import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ReviewInput, ReviewWithScores } from "@/types";

type ReviewWithScoreRow = Database["public"]["Tables"]["reviews"]["Row"] & {
  review_scores: Database["public"]["Tables"]["review_scores"]["Row"] | null;
};

function toReviewWithScores(row: ReviewWithScoreRow): ReviewWithScores | null {
  // review_scores her review ile 1-1 zorunlu olduğu için normalde null
  // gelmez; yine de savunmacı biçimde ele alınıyor (eksikse listeden atlanır).
  if (!row.review_scores) return null;
  return {
    id: row.id,
    monthlyShifts: row.monthly_shifts,
    dailyPatients: row.daily_patients,
    servicePatients: row.service_patients,
    wouldChooseAgain: row.would_choose_again,
    comment: row.comment,
    createdAt: row.created_at,
    incentiveScore: row.review_scores.incentive_score,
    colleagueScore: row.review_scores.colleague_score,
    managementScore: row.review_scores.management_score,
    cityScore: row.review_scores.city_score,
    educationScore: row.review_scores.education_score,
    academicScore: row.review_scores.academic_score,
  };
}

/**
 * `reviews`/`review_scores`'a erişim katmanı. Okuma herkese açık (RLS'te
 * `using (true)`); yazma, tüm iş kuralını (workplace oluşturma + review +
 * score, tek transaction'da) tek bir Postgres fonksiyonuna (`submit_review`)
 * delege ediyor — bkz. `supabase/migrations/20260101000016_submit_review_rpc.sql`.
 */
export class ReviewRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByClinicId(clinicId: string): Promise<ReviewWithScores[]> {
    const { data, error } = await this.client
      .from("reviews")
      .select("*, review_scores(*)")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .returns<ReviewWithScoreRow[]>();

    if (error) {
      throw new Error(`Değerlendirmeler getirilemedi: ${error.message}`);
    }
    return (data ?? [])
      .map(toReviewWithScores)
      .filter((r): r is ReviewWithScores => r !== null);
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
    });

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
