import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ReviewInput, ReviewTopic, ReviewWithScores } from "@/types";
import { classifyReviewTopics } from "@/lib/ai/adapters/keyword-topic-classifier";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewScoreRow = Database["public"]["Tables"]["review_scores"]["Row"];
type ReviewWithScoreRow = ReviewRow & { review_scores: ReviewScoreRow | null };
type AuthorStatsRow = Database["public"]["Views"]["review_author_stats"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["review_helpful_counts"]["Row"];

/**
 * `reviews`/`review_scores`'a erişim katmanı. Okuma herkese açık (RLS'te
 * `status = 'approved' OR kendi review'un`); yazma, tüm iş kuralını
 * (workplace oluşturma + review + score, tek transaction'da) tek bir
 * Postgres fonksiyonuna (`submit_review`/`update_review`) delege ediyor.
 *
 * `review_author_stats` ve `review_helpful_counts` birer VIEW olduğu ve
 * `reviews` ile gerçek bir FK ilişkisi olmadığı için PostgREST'in
 * embedded-resource `select("*, foo(*)")` sözdizimiyle güvenilir şekilde
 * birleştirilemeyebilir (bu, önceki sprintlerde embedded-resource `or()`
 * filtrelemesinde yaşanan kırılganlıkla aynı sınıf sorun) — bu yüzden
 * ayrı sorgularla çekilip JS tarafında `review_id` üzerinden birleştiriliyor.
 */
export class ReviewRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByClinicId(clinicId: string): Promise<ReviewWithScores[]> {
    const [reviewsRes, authUser] = await Promise.all([
      this.client
        .from("reviews")
        .select("*, review_scores(*)")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .returns<ReviewWithScoreRow[]>(),
      this.client.auth.getUser(),
    ]);

    if (reviewsRes.error) {
      throw new Error(`Değerlendirmeler getirilemedi: ${reviewsRes.error.message}`);
    }
    const reviews = reviewsRes.data ?? [];
    if (reviews.length === 0) return [];

    const reviewIds = reviews.map((r) => r.id);

    const [authorStatsRes, helpfulCountsRes, myWorkplaceIds] = await Promise.all([
      this.client
        .from("review_author_stats")
        .select("*")
        .in("review_id", reviewIds)
        .returns<AuthorStatsRow[]>(),
      this.client
        .from("review_helpful_counts")
        .select("*")
        .in("review_id", reviewIds)
        .returns<HelpfulCountRow[]>(),
      this.myWorkplaceIdsForClinic(clinicId),
    ]);

    const authorStatsByReview = new Map(
      (authorStatsRes.data ?? []).map((s) => [s.review_id, s])
    );
    const helpfulCountByReview = new Map(
      (helpfulCountsRes.data ?? []).map((h) => [h.review_id, h.helpful_count])
    );
    const myDoctorId = authUser.data.user?.id;

    return reviews
      .filter((r): r is ReviewWithScoreRow & { review_scores: ReviewScoreRow } =>
        Boolean(r.review_scores)
      )
      .map((row) => {
        const stats = authorStatsByReview.get(row.id);
        return {
          id: row.id,
          monthlyShifts: row.monthly_shifts,
          dailyPatients: row.daily_patients,
          servicePatients: row.service_patients,
          wouldChooseAgain: row.would_choose_again,
          comment: row.comment,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          incentiveScore: row.review_scores.incentive_score,
          colleagueScore: row.review_scores.colleague_score,
          managementScore: row.review_scores.management_score,
          cityScore: row.review_scores.city_score,
          educationScore: row.review_scores.education_score,
          academicScore: row.review_scores.academic_score,
          authorReviewCount: stats?.author_review_count ?? 0,
          authorHelpfulVotes: stats?.author_helpful_votes ?? 0,
          authorReputationScore: stats?.author_reputation_score ?? 0,
          authorIsVerified: stats?.author_is_verified ?? false,
          authorNickname: stats?.visible_nickname ?? null,
          showNickname: row.show_nickname,
          helpfulCount: helpfulCountByReview.get(row.id) ?? 0,
          isMine: Boolean(myDoctorId) && myWorkplaceIds.has(row.doctor_workplace_id),
        };
      });
  }

  /**
   * Giriş yapmış kullanıcının, bu klinik için (varsa) kendi çalışma
   * kaydı ID'leri — RLS zaten yalnızca kendi satırlarını döndürüyor.
   */
  private async myWorkplaceIdsForClinic(clinicId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from("doctor_workplaces")
      .select("id")
      .eq("clinic_id", clinicId);

    if (error) return new Set();
    return new Set((data ?? []).map((row) => row.id));
  }

  /** Giriş yapmış kullanıcının bu klinik için var olan review'ı (varsa) — "zaten değerlendirdin" yönlendirmesi için. */
  async findOwnReviewIdForClinic(clinicId: string): Promise<string | null> {
    const workplaceIds = await this.myWorkplaceIdsForClinic(clinicId);
    if (workplaceIds.size === 0) return null;

    const { data, error } = await this.client
      .from("reviews")
      .select("id")
      .eq("clinic_id", clinicId)
      .in("doctor_workplace_id", Array.from(workplaceIds))
      .maybeSingle();

    if (error || !data) return null;
    return data.id;
  }

  /**
   * @throws kullanıcı giriş yapmamışsa, ya da bu klinik için zaten bir
   * değerlendirmesi varsa (Postgres hata mesajı olduğu gibi yukarı taşınır).
   */
  async create(input: ReviewInput): Promise<string> {
    const { data, error } = await this.client.rpc("submit_review", {
      p_clinic_id: input.clinicId,
      p_monthly_shifts: input.monthlyShifts,
      p_daily_patients: input.dailyPatients,
      p_service_patients: input.servicePatients,
      p_would_choose_again: input.wouldChooseAgain,
      p_comment: input.comment ?? null,
      p_incentive_score: input.incentiveScore,
      p_colleague_score: input.colleagueScore,
      p_management_score: input.managementScore,
      p_city_score: input.cityScore,
      p_education_score: input.educationScore,
      p_academic_score: input.academicScore,
      p_show_nickname: input.showNickname,
    });

    if (error) {
      throw new Error(error.message);
    }
    await this.reclassifyTopics(data, input.comment);
    return data;
  }

  /** Kendi review'unu düzenler (reviews + review_scores tek transaction'da). */
  async update(reviewId: string, input: Omit<ReviewInput, "clinicId">): Promise<void> {
    const { error } = await this.client.rpc("update_review", {
      p_review_id: reviewId,
      p_monthly_shifts: input.monthlyShifts,
      p_daily_patients: input.dailyPatients,
      p_service_patients: input.servicePatients,
      p_would_choose_again: input.wouldChooseAgain,
      p_comment: input.comment ?? null,
      p_incentive_score: input.incentiveScore,
      p_colleague_score: input.colleagueScore,
      p_management_score: input.managementScore,
      p_city_score: input.cityScore,
      p_education_score: input.educationScore,
      p_academic_score: input.academicScore,
      p_show_nickname: input.showNickname,
    });

    if (error) {
      throw new Error(error.message);
    }
    await this.reclassifyTopics(reviewId, input.comment);
  }

  /**
   * Yorum metnini anahtar kelime tabanlı sınıflandırıcıdan geçirir
   * (bkz. `src/lib/ai/adapters/keyword-topic-classifier.ts` — LLM
   * KULLANMAZ, deterministiktir) ve `review_topics`'i günceller. Önce
   * eski etiketleri temizler (düzenlemede yorum değişmiş olabilir).
   * Bu adımın başarısız olması review'ın kendisini geçersiz kılmamalı
   * — bu yüzden hata sessizce yutuluyor (etiketleme "nice to have",
   * review'ın var olması kritik).
   */
  private async reclassifyTopics(reviewId: string, comment: string | undefined): Promise<void> {
    try {
      await this.client.from("review_topics").delete().eq("review_id", reviewId);
      const topics = classifyReviewTopics(comment);
      if (topics.length === 0) return;
      await this.client
        .from("review_topics")
        .insert(topics.map((topic) => ({ review_id: reviewId, topic })));
    } catch {
      // Sessizce yut — bkz. yukarıdaki açıklama.
    }
  }

  /** Bir klinikteki onaylı yorumlarda hangi konunun kaç kez geçtiği (Sprint 8 içgörüleri için). */
  async getTopicCounts(clinicId: string): Promise<Partial<Record<ReviewTopic, number>>> {
    const { data: reviewRows, error: reviewsError } = await this.client
      .from("reviews")
      .select("id")
      .eq("clinic_id", clinicId);

    if (reviewsError || !reviewRows || reviewRows.length === 0) return {};

    const { data, error } = await this.client
      .from("review_topics")
      .select("topic")
      .in(
        "review_id",
        reviewRows.map((r) => r.id)
      );

    if (error || !data) return {};

    const counts: Partial<Record<ReviewTopic, number>> = {};
    for (const row of data) {
      counts[row.topic] = (counts[row.topic] ?? 0) + 1;
    }
    return counts;
  }

  /** Bir review'ı siler (RLS: yalnızca sahibi). review_scores cascade ile silinir. */
  async delete(reviewId: string): Promise<void> {
    const { error } = await this.client.from("reviews").delete().eq("id", reviewId);
    if (error) {
      throw new Error(`Değerlendirme silinemedi: ${error.message}`);
    }
  }

  async findById(reviewId: string): Promise<
    (ReviewWithScores & { clinicId: string }) | null
  > {
    const [reviewRes, authUser] = await Promise.all([
      this.client
        .from("reviews")
        .select("*, review_scores(*)")
        .eq("id", reviewId)
        .maybeSingle<ReviewWithScoreRow>(),
      this.client.auth.getUser(),
    ]);

    const data = reviewRes.data;
    if (reviewRes.error || !data || !data.review_scores) return null;

    const myDoctorId = authUser.data.user?.id;
    let isMine = false;
    if (myDoctorId) {
      const { data: workplace } = await this.client
        .from("doctor_workplaces")
        .select("id")
        .eq("id", data.doctor_workplace_id)
        .maybeSingle();
      // RLS zaten yalnızca auth.uid() == doctor_id olan satırları
      // döndürüyor — bu yüzden bir satır bulunması, bu workplace'in
      // (dolayısıyla review'ın) çağıran kullanıcıya ait olduğu anlamına gelir.
      isMine = Boolean(workplace);
    }

    return {
      id: data.id,
      clinicId: data.clinic_id,
      monthlyShifts: data.monthly_shifts,
      dailyPatients: data.daily_patients,
      servicePatients: data.service_patients,
      wouldChooseAgain: data.would_choose_again,
      comment: data.comment,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      incentiveScore: data.review_scores.incentive_score,
      colleagueScore: data.review_scores.colleague_score,
      managementScore: data.review_scores.management_score,
      cityScore: data.review_scores.city_score,
      educationScore: data.review_scores.education_score,
      academicScore: data.review_scores.academic_score,
      authorReviewCount: 0,
      authorHelpfulVotes: 0,
      authorReputationScore: 0,
      authorIsVerified: false,
      authorNickname: null,
      showNickname: data.show_nickname,
      helpfulCount: 0,
      isMine,
    };
  }

  /** Bir review'ı "faydalı" olarak işaretler. Aynı kullanıcı iki kez oy veremez (bileşik PK). */
  async voteHelpful(reviewId: string, doctorId: string): Promise<void> {
    const { error } = await this.client
      .from("review_helpful_votes")
      .insert({ review_id: reviewId, doctor_id: doctorId });

    if (error) {
      throw new Error(`Oy kaydedilemedi: ${error.message}`);
    }
  }

  async hasVotedHelpful(reviewId: string, doctorId: string): Promise<boolean> {
    const { data } = await this.client
      .from("review_helpful_votes")
      .select("review_id")
      .eq("review_id", reviewId)
      .eq("doctor_id", doctorId)
      .maybeSingle();
    return Boolean(data);
  }
}
