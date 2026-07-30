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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          role: DoctorRole;
          specialty: string;
          is_verified?: boolean;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          review_id: string;
          incentive_score: number;
          colleague_score: number;
          management_score: number;
          city_score: number;
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
          reason: string;
          status: ReportStatus;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          doctor_id?: string | null;
          reason: string;
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
    };
    Views: {
      hospital_city_counts: {
        Row: {
          city: string;
          hospital_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
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
    };
  };
}
