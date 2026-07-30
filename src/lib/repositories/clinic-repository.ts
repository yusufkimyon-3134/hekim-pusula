import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  Clinic,
  ClinicRanking,
  ClinicSearchResult,
  ClinicStats,
  ClinicWithHospital,
  HospitalSearchParams,
  RankingSortBy,
} from "@/types";

type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];
type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
type SearchClinicsRow = Database["public"]["Functions"]["search_clinics"]["Returns"][number];
type ClinicStatsRow = Database["public"]["Views"]["clinic_review_stats"]["Row"];
type RankClinicsRow = Database["public"]["Functions"]["rank_clinics_by_branch"]["Returns"][number];

function toClinic(row: ClinicRow): Clinic {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    branch: row.branch,
  };
}

function toSearchResult(row: SearchClinicsRow): ClinicSearchResult {
  return {
    clinicId: row.clinic_id,
    branch: row.branch,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    hospitalCity: row.hospital_city,
    hospitalDistrict: row.hospital_district,
    hospitalType: row.hospital_type,
  };
}

function toClinicStats(row: ClinicStatsRow): ClinicStats {
  return {
    reviewCount: row.review_count,
    avgOverallScore: row.avg_overall_score,
    avgIncentiveScore: row.avg_incentive_score,
    avgColleagueScore: row.avg_colleague_score,
    avgManagementScore: row.avg_management_score,
    avgCityScore: row.avg_city_score,
    avgEducationScore: row.avg_education_score,
    avgAcademicScore: row.avg_academic_score,
    avgMonthlyShifts: row.avg_monthly_shifts,
    avgDailyPatients: row.avg_daily_patients,
    avgServicePatients: row.avg_service_patients,
    recommendPercentage: row.recommend_percentage,
    totalHelpfulVotes: row.total_helpful_votes,
  };
}

function toClinicRanking(row: RankClinicsRow): ClinicRanking {
  return {
    clinicId: row.clinic_id,
    branch: row.branch,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    hospitalCity: row.hospital_city,
    hospitalDistrict: row.hospital_district,
    hospitalType: row.hospital_type,
    reviewCount: row.review_count,
    avgOverallScore: row.avg_overall_score,
    avgEducationScore: row.avg_education_score,
    avgAcademicScore: row.avg_academic_score,
    avgMonthlyShifts: row.avg_monthly_shifts,
    avgWorkload: row.avg_workload,
    recommendPercentage: row.recommend_percentage,
  };
}

/**
 * `clinics` tablosuna erişim katmanı. Aynı desen: DB satırı repository
 * içinde domain tipine eşlenir, UI hiçbir zaman ham satırı görmez.
 */
export class ClinicRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByHospitalId(hospitalId: string): Promise<Clinic[]> {
    const { data, error } = await this.client
      .from("clinics")
      .select("*")
      .eq("hospital_id", hospitalId)
      .order("branch");

    if (error) {
      throw new Error(`Klinikler getirilemedi: ${error.message}`);
    }
    return (data ?? []).map(toClinic);
  }

  async findById(id: string): Promise<Clinic | null> {
    const { data, error } = await this.client
      .from("clinics")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Klinik getirilemedi: ${error.message}`);
    }
    return data ? toClinic(data) : null;
  }

  /**
   * Klinik detay sayfası için: klinik + hastanesini TEK sorguda getirir
   * (PostgREST embedded resource ile) — sayfa başına iki ayrı round-trip
   * yerine (klinik + sonra hastane) tek istek.
   */
  async findByIdWithHospital(id: string): Promise<ClinicWithHospital | null> {
    const { data, error } = await this.client
      .from("clinics")
      .select("*, hospitals(*)")
      .eq("id", id)
      .maybeSingle<ClinicRow & { hospitals: HospitalRow }>();

    if (error) {
      throw new Error(`Klinik getirilemedi: ${error.message}`);
    }
    if (!data) return null;

    return {
      ...toClinic(data),
      hospital: {
        id: data.hospitals.id,
        name: data.hospitals.name,
        city: data.hospitals.city,
        district: data.hospitals.district,
        hospitalType: data.hospitals.hospital_type,
      },
    };
  }

  /**
   * Branş + hastane adı/il/ilçe üzerinden çok kelimeli arama + isteğe
   * bağlı gelişmiş filtreler (Sprint 6: minimum puan/maks. nöbet).
   * Klinikler hastanelerle (ve Sprint 6'da istatistik view'ıyla) join
   * gerektirdiği için bir Postgres RPC fonksiyonuna delege edilir.
   */
  async search(params: HospitalSearchParams = {}): Promise<ClinicSearchResult[]> {
    const { data, error } = await this.client.rpc("search_clinics", {
      search_query: params.query ?? null,
      filter_city: params.city ?? null,
      filter_hospital_type: params.hospitalType ?? null,
      filter_min_overall: params.minOverall ?? null,
      filter_min_education: params.minEducation ?? null,
      filter_min_academic: params.minAcademic ?? null,
      filter_max_monthly_shifts: params.maxMonthlyShifts ?? null,
    });

    if (error) {
      throw new Error(`Klinik araması yapılamadı: ${error.message}`);
    }
    return (data ?? []).map(toSearchResult);
  }

  /** Bir klinik için özet istatistikler (Sprint 6) — istatistik/detay bölümleri için. */
  async getStats(clinicId: string): Promise<ClinicStats | null> {
    const { data, error } = await this.client
      .from("clinic_review_stats")
      .select("*")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (error) {
      throw new Error(`Klinik istatistikleri getirilemedi: ${error.message}`);
    }
    return data ? toClinicStats(data) : null;
  }

  /** Bir branştaki tüm klinikleri, seçilen boyuta göre sıralı döner (Sprint 6). */
  async rankByBranch(
    branch: string,
    sortBy: RankingSortBy = "overall"
  ): Promise<ClinicRanking[]> {
    const { data, error } = await this.client.rpc("rank_clinics_by_branch", {
      p_branch: branch,
      p_sort_by: sortBy,
    });

    if (error) {
      throw new Error(`Sıralama getirilemedi: ${error.message}`);
    }
    return (data ?? []).map(toClinicRanking);
  }

  /** Sıralama sayfası için: sistemdeki tüm benzersiz branşlar, alfabetik. */
  async listBranches(): Promise<string[]> {
    const { data, error } = await this.client
      .from("clinics")
      .select("branch")
      .order("branch");

    if (error) {
      throw new Error(`Branş listesi getirilemedi: ${error.message}`);
    }
    return Array.from(new Set((data ?? []).map((row) => row.branch)));
  }
}
