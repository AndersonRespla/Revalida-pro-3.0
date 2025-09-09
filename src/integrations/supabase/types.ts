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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      simulations: {
        Row: {
          candidate_id: string
          checklist_responses: Json | null
          completed_at: string | null
          created_at: string
          examiner_id: string | null
          feedback: string | null
          id: string
          score: number | null
          started_at: string | null
          station_id: string
          status: Database["public"]["Enums"]["simulation_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          checklist_responses?: Json | null
          completed_at?: string | null
          created_at?: string
          examiner_id?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          station_id: string
          status?: Database["public"]["Enums"]["simulation_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          checklist_responses?: Json | null
          completed_at?: string | null
          created_at?: string
          examiner_id?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          station_id?: string
          status?: Database["public"]["Enums"]["simulation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_examiner_id_fkey"
            columns: ["examiner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_results: {
        Row: {
          id: string
          created_at: string
          user_id: string
          session_id: string
          station_id: string
          station_number: number
          started_at: string
          completed_at: string | null
          duration_minutes: number | null
          score: number | null
          max_possible_score: number | null
          percentage_score: number | null
          criteria_scores: Json | null
          transcription: string | null
          ai_feedback: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          session_id: string
          station_id: string
          station_number: number
          started_at: string
          completed_at?: string | null
          duration_minutes?: number | null
          score?: number | null
          max_possible_score?: number | null
          percentage_score?: number | null
          criteria_scores?: Json | null
          transcription?: string | null
          ai_feedback?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          session_id?: string
          station_id?: string
          station_number?: number
          started_at?: string
          completed_at?: string | null
          duration_minutes?: number | null
          score?: number | null
          max_possible_score?: number | null
          percentage_score?: number | null
          criteria_scores?: Json | null
          transcription?: string | null
          ai_feedback?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_results_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          checklist: Json
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          max_score: number
          name: string
          updated_at: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          max_score?: number
          name: string
          updated_at?: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          max_score?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_time_tracking: {
        Row: {
          id: string
          created_at: string
          user_id: string
          study_date: string
          simulation_minutes: number | null
          ai_chat_minutes: number | null
          collaborative_minutes: number | null
          review_minutes: number | null
          total_minutes: number | null
          sessions_count: number | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          study_date?: string
          simulation_minutes?: number | null
          ai_chat_minutes?: number | null
          collaborative_minutes?: number | null
          review_minutes?: number | null
          total_minutes?: number | null
          sessions_count?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          study_date?: string
          simulation_minutes?: number | null
          ai_chat_minutes?: number | null
          collaborative_minutes?: number | null
          review_minutes?: number | null
          total_minutes?: number | null
          sessions_count?: number | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "study_time_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          id: string
          created_at: string
          user_id: string
          achievement_type: Database["public"]["Enums"]["achievement_type"]
          achievement_name: string
          achievement_description: string | null
          earned_at: string
          points_awarded: number | null
          criteria_met: Json | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          achievement_type: Database["public"]["Enums"]["achievement_type"]
          achievement_name: string
          achievement_description?: string | null
          earned_at?: string
          points_awarded?: number | null
          criteria_met?: Json | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          achievement_type?: Database["public"]["Enums"]["achievement_type"]
          achievement_name?: string
          achievement_description?: string | null
          earned_at?: string
          points_awarded?: number | null
          criteria_met?: Json | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          period_type: Database["public"]["Enums"]["period_type"]
          period_start: string
          period_end: string
          total_sessions: number | null
          total_study_minutes: number | null
          total_simulations: number | null
          completed_simulations: number | null
          average_score: number | null
          best_score: number | null
          score_trend: number | null
          overall_progress_percentage: number | null
          specialties_mastered: number | null
          achievements_earned: number | null
          global_rank: number | null
          total_users: number | null
          rank_percentile: number | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          period_type: Database["public"]["Enums"]["period_type"]
          period_start: string
          period_end: string
          total_sessions?: number | null
          total_study_minutes?: number | null
          total_simulations?: number | null
          completed_simulations?: number | null
          average_score?: number | null
          best_score?: number | null
          score_trend?: number | null
          overall_progress_percentage?: number | null
          specialties_mastered?: number | null
          achievements_earned?: number | null
          global_rank?: number | null
          total_users?: number | null
          rank_percentile?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          period_type?: Database["public"]["Enums"]["period_type"]
          period_start?: string
          period_end?: string
          total_sessions?: number | null
          total_study_minutes?: number | null
          total_simulations?: number | null
          completed_simulations?: number | null
          average_score?: number | null
          best_score?: number | null
          score_trend?: number | null
          overall_progress_percentage?: number | null
          specialties_mastered?: number | null
          achievements_earned?: number | null
          global_rank?: number | null
          total_users?: number | null
          rank_percentile?: number | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          specialty: string
          total_simulations: number | null
          completed_simulations: number | null
          abandoned_simulations: number | null
          average_score: number | null
          best_score: number | null
          worst_score: number | null
          latest_score: number | null
          first_simulation_at: string | null
          last_simulation_at: string | null
          mastery_level: Database["public"]["Enums"]["mastery_level"]
          mastery_percentage: number | null
          total_study_time_minutes: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          specialty: string
          total_simulations?: number | null
          completed_simulations?: number | null
          abandoned_simulations?: number | null
          average_score?: number | null
          best_score?: number | null
          worst_score?: number | null
          latest_score?: number | null
          first_simulation_at?: string | null
          last_simulation_at?: string | null
          mastery_level?: Database["public"]["Enums"]["mastery_level"]
          mastery_percentage?: number | null
          total_study_time_minutes?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          specialty?: string
          total_simulations?: number | null
          completed_simulations?: number | null
          abandoned_simulations?: number | null
          average_score?: number | null
          best_score?: number | null
          worst_score?: number | null
          latest_score?: number | null
          first_simulation_at?: string | null
          last_simulation_at?: string | null
          mastery_level?: Database["public"]["Enums"]["mastery_level"]
          mastery_percentage?: number | null
          total_study_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          session_type: Database["public"]["Enums"]["session_type"]
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          stations_completed: number | null
          total_score: number | null
          average_score: number | null
          feedback: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["session_status"]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          session_type: Database["public"]["Enums"]["session_type"]
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          stations_completed?: number | null
          total_score?: number | null
          average_score?: number | null
          feedback?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["session_status"]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          session_type?: Database["public"]["Enums"]["session_type"]
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          stations_completed?: number | null
          total_score?: number | null
          average_score?: number | null
          feedback?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      library_materials: {
        Row: {
          id: string
          title: string
          type: Database["public"]["Enums"]["material_type"]
          category: Database["public"]["Enums"]["material_category"]
          specialty: string | null
          description: string | null
          author: string | null
          date_published: string
          duration_minutes: number | null
          rating: number
          downloads: number
          views: number
          tags: string[] | null
          content_url: string | null
          thumbnail_url: string | null
          is_new: boolean
          is_premium: boolean
          is_active: boolean
          file_size_mb: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          type: Database["public"]["Enums"]["material_type"]
          category: Database["public"]["Enums"]["material_category"]
          specialty?: string | null
          description?: string | null
          author?: string | null
          date_published?: string
          duration_minutes?: number | null
          rating?: number
          downloads?: number
          views?: number
          tags?: string[] | null
          content_url?: string | null
          thumbnail_url?: string | null
          is_new?: boolean
          is_premium?: boolean
          is_active?: boolean
          file_size_mb?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["material_type"]
          category?: Database["public"]["Enums"]["material_category"]
          specialty?: string | null
          description?: string | null
          author?: string | null
          date_published?: string
          duration_minutes?: number | null
          rating?: number
          downloads?: number
          views?: number
          tags?: string[] | null
          content_url?: string | null
          thumbnail_url?: string | null
          is_new?: boolean
          is_premium?: boolean
          is_active?: boolean
          file_size_mb?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      achievement_type: "milestone" | "streak" | "score" | "specialty" | "time" | "collaborative"
      mastery_level: "beginner" | "intermediate" | "advanced" | "expert"
      material_category: "guidelines" | "cases" | "training" | "protocols" | "research"
      material_type: "document" | "video" | "case" | "protocol" | "guideline"
      period_type: "daily" | "weekly" | "monthly" | "all_time"
      session_status: "in_progress" | "completed" | "abandoned" | "error"
      session_type: "simulation_exam" | "simulation_study" | "collaborative" | "ai_chat"
      simulation_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "candidate" | "examiner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

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
      achievement_type: ["milestone", "streak", "score", "specialty", "time", "collaborative"],
      mastery_level: ["beginner", "intermediate", "advanced", "expert"],
      material_category: ["guidelines", "cases", "training", "protocols", "research"],
      material_type: ["document", "video", "case", "protocol", "guideline"],
      period_type: ["daily", "weekly", "monthly", "all_time"],
      session_status: ["in_progress", "completed", "abandoned", "error"],
      session_type: ["simulation_exam", "simulation_study", "collaborative", "ai_chat"],
      simulation_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["candidate", "examiner", "admin"],
    },
  },
} as const
