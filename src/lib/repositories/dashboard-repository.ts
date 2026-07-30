import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  MostDiscussedHospital,
  MostImprovedClinic,
  TopClinicThisMonth,
  TrendingSpecialty,
} from "@/types";

/**
 * Ana sayfadaki "AI Dashboard" bölümü için erişim katmanı. Tamamı
 * deterministik SQL agregasyonlarına dayanır (bkz. migration
 * 20260101000019) — hiçbir yerde LLM çağrısı yok.
 */
export class DashboardRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async topClinicsThisMonth(limit = 5): Promise<TopClinicThisMonth[]> {
    const { data, error } = await this.client.rpc("top_clinics_this_month", {
      p_limit: limit,
    });
    if (error) throw new Error(`Bu ayın en iyileri getirilemedi: ${error.message}`);
    return (data ?? []).map((row) => ({
      clinicId: row.clinic_id,
      branch: row.branch,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      hospitalCity: row.hospital_city,
      avgOverallScore: row.avg_overall_score,
      reviewCount: row.review_count,
    }));
  }

  async mostImprovedClinics(limit = 5): Promise<MostImprovedClinic[]> {
    const { data, error } = await this.client.rpc("most_improved_clinics", {
      p_limit: limit,
    });
    if (error) throw new Error(`En çok gelişenler getirilemedi: ${error.message}`);
    return (data ?? []).map((row) => ({
      clinicId: row.clinic_id,
      branch: row.branch,
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      hospitalCity: row.hospital_city,
      recentAvg: row.recent_avg,
      previousAvg: row.previous_avg,
      improvement: row.improvement,
    }));
  }

  async trendingSpecialties(limit = 5): Promise<TrendingSpecialty[]> {
    const { data, error } = await this.client.rpc("trending_specialties", {
      p_limit: limit,
    });
    if (error) throw new Error(`Trend branşlar getirilemedi: ${error.message}`);
    return (data ?? []).map((row) => ({
      branch: row.branch,
      recentReviewCount: row.recent_review_count,
    }));
  }

  async mostDiscussedHospitals(limit = 5): Promise<MostDiscussedHospital[]> {
    const { data, error } = await this.client.rpc("most_discussed_hospitals", {
      p_limit: limit,
    });
    if (error) throw new Error(`En çok konuşulanlar getirilemedi: ${error.message}`);
    return (data ?? []).map((row) => ({
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      hospitalCity: row.hospital_city,
      recentReviewCount: row.recent_review_count,
    }));
  }
}
