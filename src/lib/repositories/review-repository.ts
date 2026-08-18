import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ReviewInput, ReviewTopic, ReviewWithScores } from "@/types";
import { classifyReviewTopics } from "@/lib/ai/adapters/keyword-topic-classifier";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"] & { last_verified_at?: string };
type ReviewScoreRow = Database["public"]["Tables"]["review_scores"]["Row"];
type ReviewWithScoreRow = ReviewRow & { review_scores: ReviewScoreRow | null };
type AuthorStatsRow = Database["public"]["Views"]["review_author_stats"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["review_helpful_counts"]["Row"];

export class ReviewRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByClinicId(clinicId: string, options: { requireVerifiedUser?: boolean } = {}): Promise<ReviewWithScores[]> {
    const { data: authUser } = await this.client.auth.getUser();
    if (options.requireVerifiedUser && (!authUser.user || !authUser.user.id)) return [];
    if (options.requireVerifiedUser) {
      const { data: doctor, error } = await this.client.from("doctors").select("is_verified").eq("id", authUser.user!.id).maybeSingle();
      if (error || doctor?.is_verified !== true) return [];
    }
    const { data: reviewRows, error: reviewsError } = await this.client.from("reviews").select("*, review_scores(*)").eq("clinic_id", clinicId).order("created_at", { ascending: false }).returns<ReviewWithScoreRow[]>();
    if (reviewsError) throw new Error(`Değerlendirmeler getirilemedi: ${reviewsError.message}`);
    const reviews = reviewRows ?? [];
    if (!reviews.length) return [];
    const reviewIds = reviews.map((r) => r.id);
    const [authorStatsRes, helpfulCountsRes, myWorkplaceIds] = await Promise.all([
      this.client.from("review_author_stats").select("*").in("review_id", reviewIds).returns<AuthorStatsRow[]>(),
      this.client.from("review_helpful_counts").select("*").in("review_id", reviewIds).returns<HelpfulCountRow[]>(),
      this.myWorkplaceIdsForClinic(clinicId),
    ]);
    const authorStatsByReview = new Map((authorStatsRes.data ?? []).map((s) => [s.review_id, s]));
    const helpfulCountByReview = new Map((helpfulCountsRes.data ?? []).map((h) => [h.review_id, h.helpful_count]));
    const myDoctorId = authUser.user?.id;
    return reviews.filter((r): r is ReviewWithScoreRow & { review_scores: ReviewScoreRow } => Boolean(r.review_scores)).map((row) => {
      const stats = authorStatsByReview.get(row.id);
      return {
        id: row.id, monthlyShifts: row.monthly_shifts, dailyPatients: row.daily_patients, servicePatients: row.service_patients,
        wouldChooseAgain: row.would_choose_again, comment: row.comment, createdAt: row.created_at, updatedAt: row.updated_at,
        lastVerifiedAt: row.last_verified_at ?? row.updated_at ?? row.created_at,
        incentiveScore: row.review_scores.incentive_score, colleagueScore: row.review_scores.colleague_score, managementScore: row.review_scores.management_score,
        cityScore: row.review_scores.city_score, educationScore: row.review_scores.education_score, academicScore: row.review_scores.academic_score,
        authorReviewCount: stats?.author_review_count ?? 0, authorHelpfulVotes: stats?.author_helpful_votes ?? 0, authorReputationScore: stats?.author_reputation_score ?? 0,
        authorIsVerified: stats?.author_is_verified ?? false, authorNickname: stats?.visible_nickname ?? null, showNickname: row.show_nickname,
        helpfulCount: helpfulCountByReview.get(row.id) ?? 0, isMine: Boolean(myDoctorId) && myWorkplaceIds.has(row.doctor_workplace_id),
      };
    });
  }

  private async myWorkplaceIdsForClinic(clinicId: string): Promise<Set<string>> {
    const { data, error } = await this.client.from("doctor_workplaces").select("id").eq("clinic_id", clinicId);
    if (error) return new Set();
    return new Set((data ?? []).map((row) => row.id));
  }

  async findOwnReviewIdForClinic(clinicId: string): Promise<string | null> {
    const workplaceIds = await this.myWorkplaceIdsForClinic(clinicId);
    if (!workplaceIds.size) return null;
    const { data, error } = await this.client.from("reviews").select("id").eq("clinic_id", clinicId).in("doctor_workplace_id", Array.from(workplaceIds)).maybeSingle();
    return error || !data ? null : data.id;
  }

  async create(input: ReviewInput): Promise<string> {
    const { data, error } = await this.client.rpc("submit_review", { p_clinic_id: input.clinicId, p_monthly_shifts: input.monthlyShifts, p_daily_patients: input.dailyPatients, p_service_patients: input.servicePatients, p_would_choose_again: input.wouldChooseAgain, p_comment: input.comment ?? "", p_incentive_score: input.incentiveScore, p_colleague_score: input.colleagueScore, p_management_score: input.managementScore, p_city_score: input.cityScore, p_education_score: input.educationScore, p_academic_score: input.academicScore, p_show_nickname: input.showNickname });
    if (error) throw new Error(error.message);
    await this.reclassifyTopics(data, input.comment);
    return data;
  }

  async update(reviewId: string, input: Omit<ReviewInput, "clinicId">): Promise<void> {
    const { error } = await this.client.rpc("update_review", { p_review_id: reviewId, p_monthly_shifts: input.monthlyShifts, p_daily_patients: input.dailyPatients, p_service_patients: input.servicePatients, p_would_choose_again: input.wouldChooseAgain, p_comment: input.comment ?? "", p_incentive_score: input.incentiveScore, p_colleague_score: input.colleagueScore, p_management_score: input.managementScore, p_city_score: input.cityScore, p_education_score: input.educationScore, p_academic_score: input.academicScore, p_show_nickname: input.showNickname });
    if (error) throw new Error(error.message);
    await this.reclassifyTopics(reviewId, input.comment);
  }

  private async reclassifyTopics(reviewId: string, comment: string | undefined): Promise<void> {
    try { await this.client.from("review_topics").delete().eq("review_id", reviewId); const topics = classifyReviewTopics(comment); if (topics.length) await this.client.from("review_topics").insert(topics.map((topic) => ({ review_id: reviewId, topic }))); } catch {}
  }

  async getTopicCounts(clinicId: string): Promise<Partial<Record<ReviewTopic, number>>> {
    const { data: rows, error } = await this.client.from("reviews").select("id").eq("clinic_id", clinicId);
    if (error || !rows?.length) return {};
    const { data } = await this.client.from("review_topics").select("topic").in("review_id", rows.map((r) => r.id));
    const counts: Partial<Record<ReviewTopic, number>> = {};
    for (const row of data ?? []) counts[row.topic] = (counts[row.topic] ?? 0) + 1;
    return counts;
  }

  async delete(reviewId: string): Promise<void> { const { error } = await this.client.from("reviews").delete().eq("id", reviewId); if (error) throw new Error(`Değerlendirme silinemedi: ${error.message}`); }

  async findById(reviewId: string): Promise<(ReviewWithScores & { clinicId: string }) | null> {
    const [reviewRes, authUser] = await Promise.all([this.client.from("reviews").select("*, review_scores(*)").eq("id", reviewId).maybeSingle<ReviewWithScoreRow>(), this.client.auth.getUser()]);
    const data = reviewRes.data; if (reviewRes.error || !data || !data.review_scores) return null;
    let isMine = false; if (authUser.data.user?.id) { const { data: workplace } = await this.client.from("doctor_workplaces").select("id").eq("id", data.doctor_workplace_id).maybeSingle(); isMine = Boolean(workplace); }
    return { id: data.id, clinicId: data.clinic_id, monthlyShifts: data.monthly_shifts, dailyPatients: data.daily_patients, servicePatients: data.service_patients, wouldChooseAgain: data.would_choose_again, comment: data.comment, createdAt: data.created_at, updatedAt: data.updated_at, lastVerifiedAt: data.last_verified_at ?? data.updated_at ?? data.created_at, incentiveScore: data.review_scores.incentive_score, colleagueScore: data.review_scores.colleague_score, managementScore: data.review_scores.management_score, cityScore: data.review_scores.city_score, educationScore: data.review_scores.education_score, academicScore: data.review_scores.academic_score, authorReviewCount: 0, authorHelpfulVotes: 0, authorReputationScore: 0, authorIsVerified: false, authorNickname: null, showNickname: data.show_nickname, helpfulCount: 0, isMine };
  }

  async voteHelpful(reviewId: string, doctorId: string): Promise<void> { const { error } = await this.client.from("review_helpful_votes").insert({ review_id: reviewId, doctor_id: doctorId }); if (error) throw new Error(`Oy kaydedilemedi: ${error.message}`); }
  async hasVotedHelpful(reviewId: string, doctorId: string): Promise<boolean> { const { data } = await this.client.from("review_helpful_votes").select("review_id").eq("review_id", reviewId).eq("doctor_id", doctorId).maybeSingle(); return Boolean(data); }
}
