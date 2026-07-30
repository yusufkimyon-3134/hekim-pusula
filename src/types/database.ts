/**
 * Bu dosya, `supabase gen types typescript --linked` komutunun üreteceği
 * dosyanın elle yazılmış bir dengidir (henüz bağlı/gerçek bir Supabase
 * projesi yok). Gerçek proje bağlandığında bu dosya doğrudan o komutun
 * çıktısıyla değiştirilmeli — böylece migration'lar ile tipler arasında
 * asla sapma (drift) olmaz.
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
      };
      // Sprint 2'de yalnızca hospitals ve clinics için repository yazıldığı
      // için aşağıdaki tablolarda yalnızca Row şekli tanımlandı. İlgili
      // repository'ler eklendiğinde Insert/Update varyantları genişletilecek.
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
      };
      favorites: {
        Row: {
          doctor_id: string;
          clinic_id: string;
          created_at: string;
        };
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
      };
    };
  };
}
