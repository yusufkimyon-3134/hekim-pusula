import type {
  DoctorRole,
  HospitalType,
  SearchSuggestionType,
  VerificationDocumentType,
  VerificationStatus,
} from "./database";

export type {
  HospitalType,
  DoctorRole,
  ReportStatus,
  ReportReason,
  ReviewStatus,
  ReviewTopic,
  LegalDocumentType,
  SearchSuggestionType,
  VerificationStatus,
  VerificationDocumentType,
} from "./database";

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
  updatedAt: string;
  incentiveScore: number;
  colleagueScore: number;
  managementScore: number;
  cityScore: number;
  educationScore: number;
  academicScore: number;
  /** Sprint 7: yazarın itibar anlık görüntüsü — doctor_id İÇERMEZ (anonimlik). */
  authorReviewCount: number;
  authorHelpfulVotes: number;
  authorReputationScore: number;
  authorIsVerified: boolean;
  /**
   * Yorum bazlı rumuz görünürlüğü: yazar bu YORUMDA rumuzunu göstermeyi
   * seçtiyse (`show_nickname=true`) dolu, aksi halde `null`. Veritabanı
   * seviyesinde (view içinde) hesaplanır — burada ayrıca bir gizleme
   * mantığı YOK, `null` zaten "gösterilmemeli" demek.
   */
  authorNickname: string | null;
  /**
   * Bu review'ın HAM `show_nickname` tercihi (yazarın kendisi için —
   * `authorNickname`'den farklı: düzenleme formunun checkbox'ını doğru
   * durumda göstermek için kullanılıyor, herkese açık gösterim için değil).
   */
  showNickname: boolean;
  /** Sprint 7: bu klinikteki toplam faydalı oy sayısı. */
  helpfulCount: number;
  /** Sprint 7: giriş yapmış kullanıcı bu review'ın sahibi mi (düzenle/sil göstermek için). */
  isMine: boolean;
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
  /** Bu yorumda yazarın rumuzunu göster (varsayılan false — anonim). */
  showNickname: boolean;
}

/** Sprint 7: kendi itibarın (profil sayfası için) — `get_my_reputation()`. */
export interface MyReputation {
  reviewCount: number;
  helpfulVotes: number;
  reputationScore: number;
  isVerified: boolean;
  memberSince: string;
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
  totalHelpfulVotes: number;
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

/** Sprint 8 — AI Dashboard (tamamen deterministik SQL agregasyonları, LLM kullanılmaz). */
export interface TopClinicThisMonth {
  clinicId: string;
  branch: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  avgOverallScore: number;
  reviewCount: number;
}

export interface MostImprovedClinic {
  clinicId: string;
  branch: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  recentAvg: number;
  previousAvg: number;
  improvement: number;
}

export interface TrendingSpecialty {
  branch: string;
  recentReviewCount: number;
}

export interface MostDiscussedHospital {
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  recentReviewCount: number;
}

/** Hekim Doğrulaması v1 — bkz. `doctor-verification-repository.ts`. */
export interface VerificationRequest {
  id: string;
  status: VerificationStatus;
  documentType: VerificationDocumentType;
  fullName: string;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

/** Ana sayfadaki gerçek zamanlı öneri kutusu — bkz. `search-suggestion-repository.ts`. */
export interface SearchSuggestion {
  type: SearchSuggestionType;
  id: string;
  title: string;
  subtitle: string;
  reviewCount: number;
}
