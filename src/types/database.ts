/**
 * Bu dosya, `supabase gen types typescript --linked` komutunun üreteceği
 * dosyanın elle yazılmış bir dengidir (henüz bağlı/gerçek bir Supabase
 * projesi yok, ve bu sandbox'ta Docker olmadığı için `--db-url` ile bile
 * üretilemedi). Gerçek proje bağlandığında bu dosya doğrudan o komutun
 * çıktısıyla değiştirilmeli.
 *
 * Yapısal gereksinimler (Insert/Update/Relationships her tabloda zorunlu,
 * view'larda Relationships zorunlu) kurulu `@supabase/postgrest-js`
 * paketinin (`node_modules/@supabase/postgrest-js/src/types/common/common.ts`)
 * kaynak kodundan doğrulanarak yazıldı — bu yüzden `Relationships` alanları
 * gerçek FK bilgisini değil, yalnızca tip uyumluluğu için boş dizi taşıyor;
 * gerçek `supabase gen types` çıktısı bunları gerçek FK adlarıyla doldurur.
 *
 * Sütun adları kasıtlı olarak snake_case (veritabanıyla birebir aynı).
 * Uygulama katmanı (repository'ler), bu satırları `src/types/index.ts`
 * içindeki camelCase domain tiplerine eşler.
 */

export type HospitalType =
  | "state_hospital"
  | "training_and_research_hospital"
  | "city_hospital"
  | "university_hospital";

export type DoctorRole = "general_practitioner" | "specialist" | "subspecialist";

export type ReportStatus = "pending" | "reviewed" | "dismissed" | "action_taken";

export type ReportReason =
  | "spam"
  | "offensive_language"
  | "false_information"
  | "duplicate"
  | "other";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type VerificationStatus = "pending" | "approved" | "rejected";
export type VerificationDocumentType = "diploma" | "specialty_certificate";

export type LegalDocumentType = "kvkk_aydinlatma" | "kullanim_kosullari";

export type SearchSuggestionType = "hospital" | "clinic";

export type ReviewTopic =
  | "education"
  | "workload"
  | "faculty"
  | "research"
  | "night_shifts"
  | "financial_satisfaction"
  | "social_environment";

export interface Database {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string;
          name: string;
          city: string;
          district: string;
          hospital_type: HospitalType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          district: string;
          hospital_type: HospitalType;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hospitals"]["Insert"]>;
        Relationships: [];
      };
      clinics: {
        Row: {
          id: string;
          hospital_id: string;
          branch: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          branch: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinics"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clinics_hospital_id_fkey";
            columns: ["hospital_id"];
            referencedRelation: "hospitals";
            referencedColumns: ["id"];
          }
        ];
      };
      // Sprint 3'te yalnızca hospitals ve clinics için repository yazıldığı
      // için aşağıdaki tablolarda Insert/Update, ilgili repository'ler
      // eklendiğinde gerçek kısıtlarla genişletilecek.
      doctors: {
        Row: {
          id: string;
          nickname: string;
          role: DoctorRole;
          specialty: string;
          is_verified: boolean;
          avatar_url: string | null;
          city: string | null;
          current_hospital: string | null;
          experience_year: number | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          role: DoctorRole;
          specialty: string;
          is_verified?: boolean;
          avatar_url?: string | null;
          city?: string | null;
          current_hospital?: string | null;
          experience_year?: number | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doctors"]["Insert"]>;
        Relationships: [];
      };
      doctor_workplaces: {
        Row: {
          id: string;
          doctor_id: string;
          clinic_id: string;
          work_start_date: string;
          work_end_date: string | null;
          is_current: boolean;
          is_verified_workplace: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          clinic_id: string;
          work_start_date: string;
          work_end_date?: string | null;
          is_current?: boolean;
          is_verified_workplace?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doctor_workplaces"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "doctor_workplaces_clinic_id_fkey";
            columns: ["clinic_id"];
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          doctor_workplace_id: string;
          clinic_id: string;
          monthly_shifts: number;
          daily_patients: number;
          service_patients: number;
          would_choose_again: boolean;
          comment: string | null;
          status: ReviewStatus;
          show_nickname: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_workplace_id: string;
          clinic_id: string;
          monthly_shifts: number;
          daily_patients: number;
          service_patients: number;
          would_choose_again: boolean;
          comment?: string | null;
          status?: ReviewStatus;
          show_nickname?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reviews_clinic_id_fkey";
            columns: ["clinic_id"];
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          }
        ];
      };
      review_scores: {
        Row: {
          review_id: string;
          incentive_score: number;
          colleague_score: number;
          management_score: number;
          city_score: number;
          education_score: number;
          academic_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          review_id: string;
          incentive_score: number;
          colleague_score: number;
          management_score: number;
          city_score: number;
          education_score?: number;
          academic_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_scores"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "review_scores_review_id_fkey";
            columns: ["review_id"];
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: {
          doctor_id: string;
          clinic_id: string;
          created_at: string;
        };
        Insert: {
          doctor_id: string;
          clinic_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "favorites_clinic_id_fkey";
            columns: ["clinic_id"];
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          review_id: string;
          doctor_id: string | null;
          reason: ReportReason;
          status: ReportStatus;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          doctor_id?: string | null;
          reason: ReportReason;
          status?: ReportStatus;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reports_review_id_fkey";
            columns: ["review_id"];
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          }
        ];
      };
      review_helpful_votes: {
        Row: {
          review_id: string;
          doctor_id: string;
          created_at: string;
        };
        Insert: {
          review_id: string;
          doctor_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_helpful_votes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey";
            columns: ["review_id"];
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          }
        ];
      };
      review_topics: {
        Row: {
          review_id: string;
          topic: ReviewTopic;
          created_at: string;
        };
        Insert: {
          review_id: string;
          topic: ReviewTopic;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_topics"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "review_topics_review_id_fkey";
            columns: ["review_id"];
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          }
        ];
      };
      doctor_verification_requests: {
        Row: {
          id: string;
          doctor_id: string;
          full_name: string;
          document_type: VerificationDocumentType;
          document_path: string;
          status: VerificationStatus;
          rejection_reason: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          full_name: string;
          document_type: VerificationDocumentType;
          document_path: string;
          status?: VerificationStatus;
          rejection_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["doctor_verification_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "doctor_verification_requests_doctor_id_fkey";
            columns: ["doctor_id"];
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          }
        ];
      };
      legal_acceptances: {
        Row: {
          id: string;
          user_id: string;
          document_type: LegalDocumentType;
          version: string;
          accepted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: LegalDocumentType;
          version: string;
          accepted_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["legal_acceptances"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      hospital_city_counts: {
        Row: {
          city: string;
          hospital_count: number;
        };
        Relationships: [];
      };
      clinic_review_stats: {
        Row: {
          clinic_id: string;
          review_count: number;
          avg_incentive_score: number | null;
          avg_colleague_score: number | null;
          avg_management_score: number | null;
          avg_city_score: number | null;
          avg_education_score: number | null;
          avg_academic_score: number | null;
          avg_overall_score: number | null;
          avg_monthly_shifts: number | null;
          avg_daily_patients: number | null;
          avg_service_patients: number | null;
          recommend_percentage: number | null;
          total_helpful_votes: number;
        };
        Relationships: [];
      };
      review_helpful_counts: {
        Row: {
          review_id: string;
          helpful_count: number;
        };
        Relationships: [];
      };
      review_author_stats: {
        Row: {
          review_id: string;
          author_review_count: number;
          author_helpful_votes: number;
          author_reputation_score: number;
          author_is_verified: boolean;
          visible_nickname: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      search_suggestions: {
        Args: { p_query: string; p_limit?: number };
        Returns: {
          result_type: SearchSuggestionType;
          id: string;
          title: string;
          subtitle: string;
          review_count: number;
        }[];
      };
      top_clinics_this_month: {
        Args: { p_limit?: number };
        Returns: {
          clinic_id: string;
          branch: string;
          hospital_id: string;
          hospital_name: string;
          hospital_city: string;
          avg_overall_score: number;
          review_count: number;
        }[];
      };
      most_improved_clinics: {
        Args: { p_limit?: number };
        Returns: {
          clinic_id: string;
          branch: string;
          hospital_id: string;
          hospital_name: string;
          hospital_city: string;
          recent_avg: number;
          previous_avg: number;
          improvement: number;
        }[];
      };
      trending_specialties: {
        Args: { p_limit?: number };
        Returns: { branch: string; recent_review_count: number }[];
      };
      most_discussed_hospitals: {
        Args: { p_limit?: number };
        Returns: {
          hospital_id: string;
          hospital_name: string;
          hospital_city: string;
          recent_review_count: number;
        }[];
      };
      get_my_reputation: {
        Args: Record<PropertyKey, never>;
        Returns: {
          review_count: number;
          helpful_votes: number;
          reputation_score: number;
          is_verified: boolean;
          member_since: string;
        }[];
      };
      update_review: {
        Args: {
          p_review_id: string;
          p_monthly_shifts: number;
          p_daily_patients: number;
          p_service_patients: number;
          p_would_choose_again: boolean;
          p_comment: string | null;
          p_incentive_score: number;
          p_colleague_score: number;
          p_management_score: number;
          p_city_score: number;
          p_education_score: number;
          p_academic_score: number;
          p_show_nickname?: boolean;
        };
        Returns: undefined;
      };
      submit_review: {
        Args: {
          p_clinic_id: string;
          p_monthly_shifts: number;
          p_daily_patients: number;
          p_service_patients: number;
          p_would_choose_again: boolean;
          p_comment: string | null;
          p_incentive_score: number;
          p_colleague_score: number;
          p_management_score: number;
          p_city_score: number;
          p_education_score: number;
          p_academic_score: number;
          p_show_nickname?: boolean;
        };
        Returns: string;
      };
      search_hospitals: {
        Args: {
          search_query?: string | null;
          filter_city?: string | null;
          filter_hospital_type?: HospitalType | null;
        };
        Returns: {
          id: string;
          name: string;
          city: string;
          district: string;
          hospital_type: HospitalType;
        }[];
      };
      search_clinics: {
        Args: {
          search_query?: string | null;
          filter_city?: string | null;
          filter_hospital_type?: HospitalType | null;
          filter_min_overall?: number | null;
          filter_min_education?: number | null;
          filter_min_academic?: number | null;
          filter_max_monthly_shifts?: number | null;
        };
        Returns: {
          clinic_id: string;
          branch: string;
          hospital_id: string;
          hospital_name: string;
          hospital_city: string;
          hospital_district: string;
          hospital_type: HospitalType;
        }[];
      };
      rank_clinics_by_branch: {
        Args: {
          p_branch: string;
          p_sort_by?: string;
        };
        Returns: {
          clinic_id: string;
          branch: string;
          hospital_id: string;
          hospital_name: string;
          hospital_city: string;
          hospital_district: string;
          hospital_type: HospitalType;
          review_count: number;
          avg_overall_score: number | null;
          avg_education_score: number | null;
          avg_academic_score: number | null;
          avg_monthly_shifts: number | null;
          avg_workload: number | null;
          recommend_percentage: number | null;
        }[];
      };
    };
  };
}
