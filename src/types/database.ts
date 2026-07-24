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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      capsules: {
        Row: {
          body: string | null
          created_at: string
          friend_id: string
          id: string
          kind: string
          link_id: string | null
          opened_at: string | null
          storage_path: string | null
          unlock_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          friend_id: string
          id?: string
          kind: string
          link_id?: string | null
          opened_at?: string | null
          storage_path?: string | null
          unlock_at: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          friend_id?: string
          id?: string
          kind?: string
          link_id?: string | null
          opened_at?: string | null
          storage_path?: string | null
          unlock_at?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          birthday: string | null
          contact_frequency: Database["public"]["Enums"]["contact_frequency"]
          created_at: string | null
          email: string | null
          haptic_signature: string
          id: string
          name: string
          phone_number: string | null
          plant_type: Database["public"]["Enums"]["plant_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birthday?: string | null
          contact_frequency?: Database["public"]["Enums"]["contact_frequency"]
          created_at?: string | null
          email?: string | null
          haptic_signature?: string
          id?: string
          name: string
          phone_number?: string | null
          plant_type: Database["public"]["Enums"]["plant_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birthday?: string | null
          contact_frequency?: Database["public"]["Enums"]["contact_frequency"]
          created_at?: string | null
          email?: string | null
          haptic_signature?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      garden_links: {
        Row: {
          friend_a_id: string
          friend_b_id: string
          id: string
          linked_at: string
          status: string
          streak_best: number
          streak_broken_at: string | null
          streak_broken_count: number
          streak_count: number
          streak_window_satisfied: boolean
          streak_window_start: string
          user_a: string
          user_b: string
        }
        Insert: {
          friend_a_id: string
          friend_b_id: string
          id?: string
          linked_at?: string
          status?: string
          streak_best?: number
          streak_broken_at?: string | null
          streak_broken_count?: number
          streak_count?: number
          streak_window_satisfied?: boolean
          streak_window_start?: string
          user_a: string
          user_b: string
        }
        Update: {
          friend_a_id?: string
          friend_b_id?: string
          id?: string
          linked_at?: string
          status?: string
          streak_best?: number
          streak_broken_at?: string | null
          streak_broken_count?: number
          streak_count?: number
          streak_window_satisfied?: boolean
          streak_window_start?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string
          event_date: string | null
          friend_id: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          event_date?: string | null
          friend_id: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          event_date?: string | null
          friend_id?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      link_events: {
        Row: {
          created_at: string
          id: string
          interaction_id: string | null
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          link_id: string
          logger_user_id: string
          merge_group_id: string
          occurred_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_id?: string | null
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          link_id: string
          logger_user_id: string
          merge_group_id: string
          occurred_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_id?: string | null
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          link_id?: string
          logger_user_id?: string
          merge_group_id?: string
          occurred_at?: string
        }
        Relationships: []
      }
      link_invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          inviter_friend_id: string
          inviter_user_id: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          inviter_friend_id: string
          inviter_user_id: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          inviter_friend_id?: string
          inviter_user_id?: string
          status?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          metadata: Json
          reason: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reason: string
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reason?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nudges: {
        Row: {
          created_at: string
          id: string
          link_id: string
          payload: Json
          seen_at: string | null
          sender_user_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_id: string
          payload?: Json
          seen_at?: string | null
          sender_user_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          link_id?: string
          payload?: Json
          seen_at?: string | null
          sender_user_id?: string
          type?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          interaction_id: string | null
          is_shared: boolean
          storage_path: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          interaction_id?: string | null
          is_shared?: boolean
          storage_path: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          interaction_id?: string | null
          is_shared?: boolean
          storage_path?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_attachments: {
        Row: {
          created_at: string
          id: string
          plant_id: string
          position: Json
          sku: string
          slot: string
        }
        Insert: {
          created_at?: string
          id?: string
          plant_id: string
          position?: Json
          sku: string
          slot: string
        }
        Update: {
          created_at?: string
          id?: string
          plant_id?: string
          position?: Json
          sku?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_attachments_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_attachments_sku_fkey"
            columns: ["sku"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["sku"]
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
          prestige_level: number
          streak_best: number
          streak_broken_at: string | null
          streak_broken_count: number
          streak_count: number | null
          streak_window_satisfied: boolean
          streak_window_start: string
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
          prestige_level?: number
          streak_best?: number
          streak_broken_at?: string | null
          streak_broken_count?: number
          streak_count?: number | null
          streak_window_satisfied?: boolean
          streak_window_start?: string
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
          prestige_level?: number
          streak_best?: number
          streak_broken_at?: string | null
          streak_broken_count?: number
          streak_count?: number | null
          streak_window_satisfied?: boolean
          streak_window_start?: string
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
      push_tokens: {
        Row: {
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          asset_key: string
          category: string
          created_at: string
          description: string | null
          display_name: string
          is_active: boolean
          price_gems: number | null
          price_points: number | null
          scope: string
          sku: string
          sort: number
        }
        Insert: {
          asset_key: string
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          is_active?: boolean
          price_gems?: number | null
          price_points?: number | null
          scope?: string
          sku: string
          sort?: number
        }
        Update: {
          asset_key?: string
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          is_active?: boolean
          price_gems?: number | null
          price_points?: number | null
          scope?: string
          sku?: string
          sort?: number
        }
        Relationships: []
      }
      user_items: {
        Row: {
          acquired_via: string
          created_at: string
          id: string
          ledger_entry_id: string | null
          metadata: Json
          sku: string
          user_id: string
        }
        Insert: {
          acquired_via?: string
          created_at?: string
          id?: string
          ledger_entry_id?: string | null
          metadata?: Json
          sku: string
          user_id: string
        }
        Update: {
          acquired_via?: string
          created_at?: string
          id?: string
          ledger_entry_id?: string | null
          metadata?: Json
          sku?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_items_sku_fkey"
            columns: ["sku"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["sku"]
          },
          {
            foreignKeyName: "user_items_user_id_fkey"
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
          gems_balance: number
          id: string
          is_paused: boolean
          is_premium: boolean | null
          notification_prefs: Json
          notification_time: string | null
          notifications_enabled: boolean | null
          paused_at: string | null
          phone_number: string | null
          points_balance: number
          premium_expires_at: string | null
          premium_until: string | null
          total_friends: number | null
          total_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          auto_detection_enabled?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          gems_balance?: number
          id: string
          is_paused?: boolean
          is_premium?: boolean | null
          notification_prefs?: Json
          notification_time?: string | null
          notifications_enabled?: boolean | null
          paused_at?: string | null
          phone_number?: string | null
          points_balance?: number
          premium_expires_at?: string | null
          premium_until?: string | null
          total_friends?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_detection_enabled?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          gems_balance?: number
          id?: string
          is_paused?: boolean
          is_premium?: boolean | null
          notification_prefs?: Json
          notification_time?: string | null
          notifications_enabled?: boolean | null
          paused_at?: string | null
          phone_number?: string | null
          points_balance?: number
          premium_expires_at?: string | null
          premium_until?: string | null
          total_friends?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bury_capsule: {
        Args: {
          p_body?: string
          p_friend_id: string
          p_kind: string
          p_shared?: boolean
          p_storage_path?: string
          p_unlock_at: string
        }
        Returns: Json
      }
      cadence_period: {
        Args: { p_frequency: Database["public"]["Enums"]["contact_frequency"] }
        Returns: string
      }
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
          p_interaction_id?: string
          p_interaction_type: Database["public"]["Enums"]["interaction_type"]
          p_note?: string
          p_occurred_at?: string
          p_user_id: string
          p_was_auto_detected?: boolean
        }
        Returns: Json
      }
      accept_link_invite: {
        Args: {
          p_code: string
          p_existing_friend_id?: string
          p_frequency?: Database["public"]["Enums"]["contact_frequency"]
          p_grid_x?: number
          p_grid_y?: number
          p_plant_type?: Database["public"]["Enums"]["plant_type"]
        }
        Returns: Json
      }
      create_link_invite: {
        Args: { p_friend_id: string }
        Returns: Json
      }
      link_for_friend: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: Database["public"]["Tables"]["garden_links"]["Row"]
      }
      purchase_item: {
        Args: {
          p_currency?: string
          p_link_id?: string
          p_scope?: string
          p_sku: string
        }
        Returns: Json
      }
      restore_streak: {
        Args: { p_currency: string; p_friend_id: string }
        Returns: Json
      }
      roll_link_streak: {
        Args: { p_link_id: string; p_to: string }
        Returns: undefined
      }
      roll_plant_streak: {
        Args: { p_plant_id: string; p_to: string }
        Returns: undefined
      }
      send_nudge: {
        Args: { p_link_id: string; p_payload?: Json; p_type: string }
        Returns: Json
      }
      set_garden_paused: { Args: { p_paused: boolean }; Returns: undefined }
      streak_multiplier: { Args: { p_streak: number }; Returns: number }
      streak_tier_index: { Args: { p_streak: number }; Returns: number }
      sync_artifacts: { Args: never; Returns: undefined }
      sync_streaks: { Args: never; Returns: undefined }
      update_plant_hydration: {
        Args: { p_plant_id: string }
        Returns: undefined
      }
      user_is_premium: {
        Args: { p_user_id: string }
        Returns: boolean
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
