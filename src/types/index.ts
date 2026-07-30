import type { DoctorRole, HospitalType } from "./database";

export type { HospitalType, DoctorRole, ReportStatus } from "./database";

/**
 * Uygulama katmanının kullandığı domain tipleri (camelCase).
 * Veritabanı satır şekli (snake_case) için bkz. `database.ts`.
 * Repository'ler, DB satırlarını bu tiplere eşler.
 */

export interface Hospital {
  id: string;
  name: string;
  city: string;
  district: string;
  hospitalType: HospitalType;
}

export interface Clinic {
  id: string;
  hospitalId: string;
  branch: string;
}

/** Klinik detay sayfası için: klinik + ait olduğu hastanenin tamamı. */
export interface ClinicWithHospital extends Clinic {
  hospital: Hospital;
}

/** search_clinics RPC'sinin sonuç satırı — arama sayfasında gösterilir. */
export interface ClinicSearchResult {
  clinicId: string;
  branch: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  hospitalDistrict: string;
  hospitalType: HospitalType;
}

/** Ana sayfadaki "öne çıkan şehirler" ve arama filtresindeki şehir listesi. */
export interface CityCount {
  city: string;
  hospitalCount: number;
}

export interface HospitalSearchParams {
  query?: string;
  city?: string;
  hospitalType?: HospitalType;
  /** Sprint 6: gelişmiş filtreler — yalnızca klinik aramasında (search_clinics) etkili. */
  minOverall?: number;
  minEducation?: number;
  minAcademic?: number;
  maxMonthlyShifts?: number;
}

/** Kimliği doğrulanmış kullanıcının hekim profili (self-servis, yalnızca kendisi görebilir). */
export interface Doctor {
  id: string;
  nickname: string;
  role: DoctorRole;
  specialty: string;
  isVerified: boolean;
  avatarUrl: string | null;
  city: string | null;
  currentHospital: string | null;
  experienceYear: number | null;
  bio: string | null;
}

/** Profil formundan gönderilen, henüz kaydedilmemiş veri. */
export interface DoctorProfileInput {
  nickname: string;
  role: DoctorRole;
  specialty: string;
  city?: string;
  currentHospital?: string;
  experienceYear?: number;
  bio?: string;
}

/** Bir kliniğe ait, herkese açık (anonim) deneyim paylaşımı — puanlarıyla birlikte. */
export interface ReviewWithScores {
  id: string;
  monthlyShifts: number;
  dailyPatients: number;
  servicePatients: number;
  wouldChooseAgain: boolean;
  comment: string | null;
  createdAt: string;
  incentiveScore: number;
  colleagueScore: number;
  managementScore: number;
  cityScore: number;
  educationScore: number;
  academicScore: number;
}

/** Değerlendirme formundan gönderilen veri. */
export interface ReviewInput {
  clinicId: string;
  monthlyShifts: number;
  dailyPatients: number;
  servicePatients: number;
  wouldChooseAgain: boolean;
  comment?: string;
  incentiveScore: number;
  colleagueScore: number;
  managementScore: number;
  cityScore: number;
  educationScore: number;
  academicScore: number;
}

/** Bir klinik için özet istatistikler (Sprint 6) — `clinic_review_stats` view'ından. */
export interface ClinicStats {
  reviewCount: number;
  avgOverallScore: number | null;
  avgIncentiveScore: number | null;
  avgColleagueScore: number | null;
  avgManagementScore: number | null;
  avgCityScore: number | null;
  avgEducationScore: number | null;
  avgAcademicScore: number | null;
  avgMonthlyShifts: number | null;
  avgDailyPatients: number | null;
  avgServicePatients: number | null;
  recommendPercentage: number | null;
}

/** `rank_clinics_by_branch` sonucu — sıralama ve karşılaştırma sayfalarında kullanılır. */
export interface ClinicRanking {
  clinicId: string;
  branch: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  hospitalDistrict: string;
  hospitalType: HospitalType;
  reviewCount: number;
  avgOverallScore: number | null;
  avgEducationScore: number | null;
  avgAcademicScore: number | null;
  avgMonthlyShifts: number | null;
  avgWorkload: number | null;
  recommendPercentage: number | null;
}

export type RankingSortBy = "overall" | "education" | "academic" | "workload" | "night_shifts";
