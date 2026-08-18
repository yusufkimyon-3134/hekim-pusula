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

export interface Hospital { id: string; name: string; city: string; district: string; hospitalType: HospitalType; }
export interface Clinic { id: string; hospitalId: string; branch: string; }
export interface ClinicWithHospital extends Clinic { hospital: Hospital; }
export interface ClinicSearchResult { clinicId: string; branch: string; hospitalId: string; hospitalName: string; hospitalCity: string; hospitalDistrict: string; hospitalType: HospitalType; }
export interface CityCount { city: string; hospitalCount: number; }
export interface HospitalSearchParams { query?: string; city?: string; hospitalType?: HospitalType; minOverall?: number; minEducation?: number; minAcademic?: number; maxMonthlyShifts?: number; }
export interface Doctor { id: string; nickname: string; role: DoctorRole; specialty: string; isVerified: boolean; avatarUrl: string | null; city: string | null; currentHospital: string | null; experienceYear: number | null; bio: string | null; }
export interface DoctorProfileInput { nickname: string; role: DoctorRole; specialty: string; city?: string; currentHospital?: string; experienceYear?: number; bio?: string; }

export interface ReviewWithScores {
  id: string;
  monthlyShifts: number;
  dailyPatients: number;
  servicePatients: number;
  wouldChooseAgain: boolean;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt: string;
  incentiveScore: number;
  colleagueScore: number;
  managementScore: number;
  cityScore: number;
  educationScore: number;
  academicScore: number;
  authorReviewCount: number;
  authorHelpfulVotes: number;
  authorReputationScore: number;
  authorIsVerified: boolean;
  authorNickname: string | null;
  showNickname: boolean;
  helpfulCount: number;
  isMine: boolean;
}

export interface ReviewInput { clinicId: string; monthlyShifts: number; dailyPatients: number; servicePatients: number; wouldChooseAgain: boolean; comment?: string; incentiveScore: number; colleagueScore: number; managementScore: number; cityScore: number; educationScore: number; academicScore: number; showNickname: boolean; }
export interface MyReputation { reviewCount: number; helpfulVotes: number; reputationScore: number; isVerified: boolean; memberSince: string; }
export interface ClinicStats { reviewCount: number; avgOverallScore: number | null; avgIncentiveScore: number | null; avgColleagueScore: number | null; avgManagementScore: number | null; avgCityScore: number | null; avgEducationScore: number | null; avgAcademicScore: number | null; avgMonthlyShifts: number | null; avgDailyPatients: number | null; avgServicePatients: number | null; recommendPercentage: number | null; totalHelpfulVotes: number; }
export interface ClinicRanking { clinicId: string; branch: string; hospitalId: string; hospitalName: string; hospitalCity: string; hospitalDistrict: string; hospitalType: HospitalType; reviewCount: number; avgOverallScore: number | null; avgEducationScore: number | null; avgAcademicScore: number | null; avgMonthlyShifts: number | null; avgWorkload: number | null; recommendPercentage: number | null; }
export type RankingSortBy = "overall" | "education" | "academic" | "workload" | "night_shifts";
export interface TopClinicThisMonth { clinicId: string; branch: string; hospitalId: string; hospitalName: string; hospitalCity: string; avgOverallScore: number; reviewCount: number; }
export interface MostImprovedClinic { clinicId: string; branch: string; hospitalId: string; hospitalName: string; hospitalCity: string; recentAvg: number; previousAvg: number; improvement: number; }
export interface TrendingSpecialty { branch: string; recentReviewCount: number; }
export interface MostDiscussedHospital { hospitalId: string; hospitalName: string; hospitalCity: string; recentReviewCount: number; }
export interface VerificationRequest { id: string; status: VerificationStatus; documentType: VerificationDocumentType; fullName: string; rejectionReason: string | null; createdAt: string; reviewedAt: string | null; }
export interface SearchSuggestion { type: SearchSuggestionType; id: string; title: string; subtitle: string; reviewCount: number | null; }
