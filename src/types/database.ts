export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_notification_deliveries: {
        Row: {
          created_at: string
          delivery_key: string
          id: string
          kind: string
          last_error: string | null
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_key: string
          id?: string
          kind: string
          last_error?: string | null
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_key?: string
          id?: string
          kind?: string
          last_error?: string | null
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      branch_synonyms: {
        Row: {
          official_branch: string
          synonym: string
        }
        Insert: {
          official_branch: string
          synonym: string
        }
        Update: {
          official_branch?: string
          synonym?: string
        }
        Relationships: []
      }
      clinics: {
        Row: {
          branch: string
          created_at: string
          hospital_id: string
          id: string
          updated_at: string
        }
        Insert: {
          branch: string
          created_at?: string
          hospital_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          branch?: string
          created_at?: string
          hospital_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinics_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_verification_requests: {
        Row: {
          created_at: string
          doctor_id: string
          document_delete_after: string | null
          document_deleted_at: string | null
          document_path: string | null
          document_type: Database["public"]["Enums"]["verification_document_type"]
          full_name: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          doctor_id: string
          document_delete_after?: string | null
          document_deleted_at?: string | null
          document_path?: string | null
          document_type: Database["public"]["Enums"]["verification_document_type"]
          full_name: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          doctor_id?: string
          document_delete_after?: string | null
          document_deleted_at?: string | null
          document_path?: string | null
          document_type?: Database["public"]["Enums"]["verification_document_type"]
          full_name?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "doctor_verification_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_reputation"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "doctor_verification_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_workplaces: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string
          id: string
          is_current: boolean
          is_verified_workplace: boolean
          updated_at: string
          work_end_date: string | null
          work_start_date: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id: string
          id?: string
          is_current?: boolean
          is_verified_workplace?: boolean
          updated_at?: string
          work_end_date?: string | null
          work_start_date: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          is_current?: boolean
          is_verified_workplace?: boolean
          updated_at?: string
          work_end_date?: string | null
          work_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_workplaces_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_review_stats"
            referencedColumns: ["clinic_id"]
          },
          {
            foreignKeyName: "doctor_workplaces_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_workplaces_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_reputation"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "doctor_workplaces_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          current_hospital: string | null
          experience_year: number | null
          id: string
          is_verified: boolean
          nickname: string
          role: Database["public"]["Enums"]["doctor_role"]
          specialty: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          current_hospital?: string | null
          experience_year?: number | null
          id: string
          is_verified?: boolean
          nickname: string
          role: Database["public"]["Enums"]["doctor_role"]
          specialty: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          current_hospital?: string | null
          experience_year?: number | null
          id?: string
          is_verified?: boolean
          nickname?: string
          role?: Database["public"]["Enums"]["doctor_role"]
          specialty?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_review_stats"
            referencedColumns: ["clinic_id"]
          },
          {
            foreignKeyName: "favorites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_reputation"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "favorites_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          city: string
          created_at: string
          district: string
          hospital_type: Database["public"]["Enums"]["hospital_type"]
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          district: string
          hospital_type: Database["public"]["Enums"]["hospital_type"]
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          district?: string
          hospital_type?: Database["public"]["Enums"]["hospital_type"]
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          document_type: Database["public"]["Enums"]["legal_document_type"]
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document_type: Database["public"]["Enums"]["legal_document_type"]
          id?: string
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document_type?: Database["public"]["Enums"]["legal_document_type"]
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          resolved_at: string | null
          review_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          resolved_at?: string | null
          review_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          resolved_at?: string | null
          review_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_reputation"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "review_author_stats"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          doctor_id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          review_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_reputation"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "review_helpful_votes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "review_author_stats"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asker_doctor_id: string
          author_doctor_id: string
          created_at: string
          id: string
          question: string
          review_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asker_doctor_id: string
          author_doctor_id: string
          created_at?: string
          id?: string
          question: string
          review_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asker_doctor_id?: string
          author_doctor_id?: string
          created_at?: string
          id?: string
          question?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_questions_asker_doctor_id_fkey"
            columns: ["asker_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_reputation"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "review_questions_asker_doctor_id_fkey"
            columns: ["asker_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_questions_author_doctor_id_fkey"
            columns: ["author_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_reputation"
            referencedColumns: ["doctor_id"]
          },
          {
            foreignKeyName: "review_questions_author_doctor_id_fkey"
            columns: ["author_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_questions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "review_author_stats"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "review_questions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_scores: {
        Row: {
          academic_score: number
          city_score: number
          colleague_score: number
          created_at: string
          education_score: number
          incentive_score: number
          management_score: number
          review_id: string
          updated_at: string
        }
        Insert: {
          academic_score?: number
          city_score: number
          colleague_score: number
          created_at?: string
          education_score?: number
          incentive_score: number
          management_score: number
          review_id: string
          updated_at?: string
        }
        Update: {
          academic_score?: number
          city_score?: number
          colleague_score?: number
          created_at?: string
          education_score?: number
          incentive_score?: number
          management_score?: number
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_scores_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "review_author_stats"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "review_scores_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_topics: {
        Row: {
          created_at: string
          review_id: string
          topic: Database["public"]["Enums"]["review_topic"]
        }
        Insert: {
          created_at?: string
          review_id: string
          topic: Database["public"]["Enums"]["review_topic"]
        }
        Update: {
          created_at?: string
          review_id?: string
          topic?: Database["public"]["Enums"]["review_topic"]
        }
        Relationships: [
          {
            foreignKeyName: "review_topics_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "review_author_stats"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "review_topics_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          clinic_id: string
          comment: string | null
          created_at: string
          daily_patients: number
          doctor_workplace_id: string
          id: string
          monthly_shifts: number
          service_patients: number
          show_nickname: boolean
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          would_choose_again: boolean
        }
        Insert: {
          clinic_id: string
          comment?: string | null
          created_at?: string
          daily_patients: number
          doctor_workplace_id: string
          id?: string
          monthly_shifts: number
          service_patients: number
          show_nickname?: boolean
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          would_choose_again: boolean
        }
        Update: {
          clinic_id?: string
          comment?: string | null
          created_at?: string
          daily_patients?: number
          doctor_workplace_id?: string
          id?: string
          monthly_shifts?: number
          service_patients?: number
          show_nickname?: boolean
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          would_choose_again?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_review_stats"
            referencedColumns: ["clinic_id"]
          },
          {
            foreignKeyName: "reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_workplace_id_fkey"
            columns: ["doctor_workplace_id"]
            isOneToOne: false
            referencedRelation: "doctor_workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clinic_review_stats: {
        Row: {
          avg_academic_score: number | null
          avg_city_score: number | null
          avg_colleague_score: number | null
          avg_daily_patients: number | null
          avg_education_score: number | null
          avg_incentive_score: number | null
          avg_management_score: number | null
          avg_monthly_shifts: number | null
          avg_overall_score: number | null
          avg_service_patients: number | null
          clinic_id: string | null
          recommend_percentage: number | null
          review_count: number | null
          total_helpful_votes: number | null
        }
        Relationships: []
      }
      doctor_reputation: {
        Row: {
          doctor_id: string | null
          helpful_votes: number | null
          is_verified: boolean | null
          member_since: string | null
          reputation_score: number | null
          review_count: number | null
        }
        Relationships: []
      }
      hospital_city_counts: {
        Row: {
          city: string | null
          hospital_count: number | null
        }
        Relationships: []
      }
      review_author_stats: {
        Row: {
          author_helpful_votes: number | null
          author_is_verified: boolean | null
          author_reputation_score: number | null
          author_review_count: number | null
          review_id: string | null
          visible_nickname: string | null
        }
        Relationships: []
      }
      review_helpful_counts: {
        Row: {
          helpful_count: number | null
          review_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "review_author_stats"
            referencedColumns: ["review_id"]
          },
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_signup_count_since: {
        Args: { p_since: string }
        Returns: number
      }
      answer_review_question: {
        Args: { p_answer: string; p_question_id: string }
        Returns: undefined
      }
      create_review_question: {
        Args: { p_question: string; p_review_id: string }
        Returns: string
      }
      get_my_reputation: {
        Args: never
        Returns: {
          helpful_votes: number
          is_verified: boolean
          member_since: string
          reputation_score: number
          review_count: number
        }[]
      }
      is_verified_doctor: { Args: never; Returns: boolean }
      most_discussed_hospitals: {
        Args: { p_limit?: number }
        Returns: {
          hospital_city: string
          hospital_id: string
          hospital_name: string
          recent_review_count: number
        }[]
      }
      most_improved_clinics: {
        Args: { p_limit?: number }
        Returns: {
          branch: string
          clinic_id: string
          hospital_city: string
          hospital_id: string
          hospital_name: string
          improvement: number
          previous_avg: number
          recent_avg: number
        }[]
      }
      rank_clinics_by_branch: {
        Args: { p_branch: string; p_sort_by?: string }
        Returns: {
          avg_academic_score: number
          avg_education_score: number
          avg_monthly_shifts: number
          avg_overall_score: number
          avg_workload: number
          branch: string
          clinic_id: string
          hospital_city: string
          hospital_district: string
          hospital_id: string
          hospital_name: string
          hospital_type: Database["public"]["Enums"]["hospital_type"]
          recommend_percentage: number
          review_count: number
        }[]
      }
      search_clinics: {
        Args: {
          filter_city?: string
          filter_hospital_type?: Database["public"]["Enums"]["hospital_type"]
          filter_max_monthly_shifts?: number
          filter_min_academic?: number
          filter_min_education?: number
          filter_min_overall?: number
          search_query?: string
        }
        Returns: {
          branch: string
          clinic_id: string
          hospital_city: string
          hospital_district: string
          hospital_id: string
          hospital_name: string
          hospital_type: Database["public"]["Enums"]["hospital_type"]
        }[]
      }
      search_hospitals: {
        Args: {
          filter_city?: string
          filter_hospital_type?: Database["public"]["Enums"]["hospital_type"]
          search_query?: string
        }
        Returns: {
          city: string
          district: string
          hospital_type: Database["public"]["Enums"]["hospital_type"]
          id: string
          name: string
        }[]
      }
      search_suggestions: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          id: string
          result_type: Database["public"]["Enums"]["search_suggestion_type"]
          review_count: number
          subtitle: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_review: {
        Args: {
          p_academic_score: number
          p_city_score: number
          p_clinic_id: string
          p_colleague_score: number
          p_comment: string
          p_daily_patients: number
          p_education_score: number
          p_incentive_score: number
          p_management_score: number
          p_monthly_shifts: number
          p_service_patients: number
          p_show_nickname?: boolean
          p_would_choose_again: boolean
        }
        Returns: string
      }
      top_clinics_this_month: {
        Args: { p_limit?: number }
        Returns: {
          avg_overall_score: number
          branch: string
          clinic_id: string
          hospital_city: string
          hospital_id: string
          hospital_name: string
          review_count: number
        }[]
      }
      trending_specialties: {
        Args: { p_limit?: number }
        Returns: {
          branch: string
          recent_review_count: number
        }[]
      }
      update_review: {
        Args: {
          p_academic_score: number
          p_city_score: number
          p_colleague_score: number
          p_comment: string
          p_daily_patients: number
          p_education_score: number
          p_incentive_score: number
          p_management_score: number
          p_monthly_shifts: number
          p_review_id: string
          p_service_patients: number
          p_show_nickname?: boolean
          p_would_choose_again: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      doctor_role: "general_practitioner" | "specialist" | "subspecialist"
      hospital_type:
        | "state_hospital"
        | "training_and_research_hospital"
        | "city_hospital"
        | "university_hospital"
      legal_document_type: "kvkk_aydinlatma" | "kullanim_kosullari"
      report_reason:
        | "spam"
        | "offensive_language"
        | "false_information"
        | "duplicate"
        | "other"
      report_status: "pending" | "reviewed" | "dismissed" | "action_taken"
      review_status: "pending" | "approved" | "rejected"
      review_topic:
        | "education"
        | "workload"
        | "faculty"
        | "research"
        | "night_shifts"
        | "financial_satisfaction"
        | "social_environment"
      search_suggestion_type: "hospital" | "clinic"
      verification_document_type: "diploma" | "specialty_certificate"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type DoctorRole = Database["public"]["Enums"]["doctor_role"]
export type HospitalType = Database["public"]["Enums"]["hospital_type"]
export type LegalDocumentType = Database["public"]["Enums"]["legal_document_type"]
export type ReportReason = Database["public"]["Enums"]["report_reason"]
export type ReportStatus = Database["public"]["Enums"]["report_status"]
export type ReviewStatus = Database["public"]["Enums"]["review_status"]
export type ReviewTopic = Database["public"]["Enums"]["review_topic"]
export type SearchSuggestionType = Database["public"]["Enums"]["search_suggestion_type"]
export type VerificationDocumentType = Database["public"]["Enums"]["verification_document_type"]
export type VerificationStatus = Database["public"]["Enums"]["verification_status"]

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      doctor_role: ["general_practitioner", "specialist", "subspecialist"],
      hospital_type: [
        "state_hospital",
        "training_and_research_hospital",
        "city_hospital",
        "university_hospital",
      ],
      legal_document_type: ["kvkk_aydinlatma", "kullanim_kosullari"],
      report_reason: [
        "spam",
        "offensive_language",
        "false_information",
        "duplicate",
        "other",
      ],
      report_status: ["pending", "reviewed", "dismissed", "action_taken"],
      review_status: ["pending", "approved", "rejected"],
      review_topic: [
        "education",
        "workload",
        "faculty",
        "research",
        "night_shifts",
        "financial_satisfaction",
        "social_environment",
      ],
      search_suggestion_type: ["hospital", "clinic"],
      verification_document_type: ["diploma", "specialty_certificate"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
