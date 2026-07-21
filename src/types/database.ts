// GENERATED FILE — do not hand-edit.
// Regenerate from the live schema via the Supabase MCP
// (generate_typescript_types, project ojotriwvmudyoeyihynb).

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artifact_templates: {
        Row: {
          artifact_category: string
          artifact_type: string
          description: string | null
          display_name: string
          id: string
          is_premium: boolean | null
          required_avg_hydration: number | null
          required_streak_days: number | null
          sort_order: number | null
        }
        Insert: {
          artifact_category: string
          artifact_type: string
          description?: string | null
          display_name: string
          id?: string
          is_premium?: boolean | null
          required_avg_hydration?: number | null
          required_streak_days?: number | null
          sort_order?: number | null
        }
        Update: {
          artifact_category?: string
          artifact_type?: string
          description?: string | null
          display_name?: string
          id?: string
          is_premium?: boolean | null
          required_avg_hydration?: number | null
          required_streak_days?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      artifacts: {
        Row: {
          artifact_category: string
          artifact_type: string
          attached_to_plant_id: string | null
          created_at: string | null
          grid_position_x: number | null
          grid_position_y: number | null
          id: string
          is_active: boolean | null
          is_unlocked: boolean | null
          required_avg_hydration: number | null
          required_streak_days: number | null
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artifact_category: string
          artifact_type: string
          attached_to_plant_id?: string | null
          created_at?: string | null
          grid_position_x?: number | null
          grid_position_y?: number | null
          id?: string
          is_active?: boolean | null
          is_unlocked?: boolean | null
          required_avg_hydration?: number | null
          required_streak_days?: number | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artifact_category?: string
          artifact_type?: string
          attached_to_plant_id?: string | null
          created_at?: string | null
          grid_position_x?: number | null
          grid_position_y?: number | null
          id?: string
          is_active?: boolean | null
          is_unlocked?: boolean | null
          required_avg_hydration?: number | null
          required_streak_days?: number | null
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_attached_to_plant_id_fkey"
            columns: ["attached_to_plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_garden_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      decorative_items: {
        Row: {
          garden_layout_id: string | null
          grid_position_x: number
          grid_position_y: number
          id: string
          is_premium: boolean | null
          item_id: string
          item_name: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          garden_layout_id?: string | null
          grid_position_x: number
          grid_position_y: number
          id?: string
          is_premium?: boolean | null
          item_id: string
          item_name: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          garden_layout_id?: string | null
          grid_position_x?: number
          grid_position_y?: number
          id?: string
          is_premium?: boolean | null
          item_id?: string
          item_name?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decorative_items_garden_layout_id_fkey"
            columns: ["garden_layout_id"]
            isOneToOne: false
            referencedRelation: "garden_layouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decorative_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_garden_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "decorative_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          contact_frequency: Database["public"]["Enums"]["contact_frequency"]
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone_number: string | null
          plant_type: Database["public"]["Enums"]["plant_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_frequency?: Database["public"]["Enums"]["contact_frequency"]
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone_number?: string | null
          plant_type: Database["public"]["Enums"]["plant_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_frequency?: Database["public"]["Enums"]["contact_frequency"]
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          plant_type?: Database["public"]["Enums"]["plant_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_garden_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      garden_layouts: {
        Row: {
          average_hydration: number | null
          created_at: string | null
          grid_size: number | null
          id: string
          last_health_check: string | null
          room_id: string | null
          theme: Database["public"]["Enums"]["garden_theme"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_hydration?: number | null
          created_at?: string | null
          grid_size?: number | null
          id?: string
          last_health_check?: string | null
          room_id?: string | null
          theme?: Database["public"]["Enums"]["garden_theme"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_hydration?: number | null
          created_at?: string | null
          grid_size?: number | null
          id?: string
          last_health_check?: string | null
          room_id?: string | null
          theme?: Database["public"]["Enums"]["garden_theme"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garden_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_garden_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "garden_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          created_at: string | null
          friend_id: string
          hydration_restored: number
          id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          note: string | null
          user_id: string
          was_auto_detected: boolean | null
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          hydration_restored: number
          id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          note?: string | null
          user_id: string
          was_auto_detected?: boolean | null
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          hydration_restored?: number
          id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          note?: string | null
          user_id?: string
          was_auto_detected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_garden_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          created_at: string | null
          current_hydration: number | null
          death_timestamp: string | null
          decay_rate_per_day: number
          evolution_stage: Database["public"]["Enums"]["evolution_stage"] | null
          friend_id: string
          grid_position_x: number
          grid_position_y: number
          grid_room_id: string | null
          id: string
          is_dead: boolean | null
          last_hydration_update: string | null
          streak_count: number | null
          total_interactions: number | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_hydration?: number | null
          death_timestamp?: string | null
          decay_rate_per_day: number
          evolution_stage?:
            | Database["public"]["Enums"]["evolution_stage"]
            | null
          friend_id: string
          grid_position_x: number
          grid_position_y: number
          grid_room_id?: string | null
          id?: string
          is_dead?: boolean | null
          last_hydration_update?: string | null
          streak_count?: number | null
          total_interactions?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_hydration?: number | null
          death_timestamp?: string | null
          decay_rate_per_day?: number
          evolution_stage?:
            | Database["public"]["Enums"]["evolution_stage"]
            | null
          friend_id?: string
          grid_position_x?: number
          grid_position_y?: number
          grid_room_id?: string | null
          id?: string
          is_dead?: boolean | null
          last_hydration_update?: string | null
          streak_count?: number | null
          total_interactions?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plants_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: true
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      revive_logs: {
        Row: {
          created_at: string | null
          id: string
          plant_id: string
          previous_stage: Database["public"]["Enums"]["evolution_stage"] | null
          previous_streak: number | null
          restored_stage: Database["public"]["Enums"]["evolution_stage"] | null
          restored_streak: number | null
          revive_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plant_id: string
          previous_stage?: Database["public"]["Enums"]["evolution_stage"] | null
          previous_streak?: number | null
          restored_stage?: Database["public"]["Enums"]["evolution_stage"] | null
          restored_streak?: number | null
          revive_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plant_id?: string
          previous_stage?: Database["public"]["Enums"]["evolution_stage"] | null
          previous_streak?: number | null
          restored_stage?: Database["public"]["Enums"]["evolution_stage"] | null
          restored_streak?: number | null
          revive_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revive_logs_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revive_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_garden_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "revive_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auto_detection_enabled: boolean | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          is_paused: boolean
          is_premium: boolean | null
          notification_time: string | null
          notifications_enabled: boolean | null
          paused_at: string | null
          phone_number: string | null
          premium_expires_at: string | null
          total_friends: number | null
          total_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          auto_detection_enabled?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_paused?: boolean
          is_premium?: boolean | null
          notification_time?: string | null
          notifications_enabled?: boolean | null
          paused_at?: string | null
          phone_number?: string | null
          premium_expires_at?: string | null
          total_friends?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_detection_enabled?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_paused?: boolean
          is_premium?: boolean | null
          notification_time?: string | null
          notifications_enabled?: boolean | null
          paused_at?: string | null
          phone_number?: string | null
          premium_expires_at?: string | null
          total_friends?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_garden_overview: {
        Row: {
          alive_plants: number | null
          avg_hydration: number | null
          dead_plants: number | null
          display_name: string | null
          total_friends: number | null
          total_interactions_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_current_hydration: {
        Args: { p_plant_id: string }
        Returns: number
      }
      calculate_decay_rate: {
        Args: { p_frequency: Database["public"]["Enums"]["contact_frequency"] }
        Returns: number
      }
      log_interaction: {
        Args: {
          p_friend_id: string
          p_hydration_amount?: number
          p_interaction_type: Database["public"]["Enums"]["interaction_type"]
          p_note?: string
          p_user_id: string
          p_was_auto_detected?: boolean
        }
        Returns: string
      }
      set_garden_paused: { Args: { p_paused: boolean }; Returns: undefined }
      update_plant_hydration: {
        Args: { p_plant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      contact_frequency: "weekly" | "biweekly" | "monthly"
      evolution_stage: "sprout" | "young" | "mature"
      garden_theme: "cozy_greenhouse" | "moonlight" | "cosmic" | "underwater"
      interaction_type: "call" | "text" | "manual"
      plant_type:
        | "cactus"
        | "fern"
        | "succulent"
        | "ivy"
        | "sunflower"
        | "bonsai"
        | "rose"
        | "herb"
        | "monstera"
        | "bamboo"
        | "ficus"
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
      contact_frequency: ["weekly", "biweekly", "monthly"],
      evolution_stage: ["sprout", "young", "mature"],
      garden_theme: ["cozy_greenhouse", "moonlight", "cosmic", "underwater"],
      interaction_type: ["call", "text", "manual"],
      plant_type: [
        "cactus",
        "fern",
        "succulent",
        "ivy",
        "sunflower",
        "bonsai",
        "rose",
        "herb",
        "monstera",
        "bamboo",
        "ficus",
      ],
    },
  },
} as const
