export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type PlantType =
  | 'cactus'
  | 'fern'
  | 'succulent'
  | 'ivy'
  | 'sunflower'
  | 'bonsai'
  | 'rose'
  | 'herb';

export type EvolutionStage =
  | 'sprout'
  | 'young'
  | 'mature';

export type ContactFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly';

export type InteractionType =
  | 'call'
  | 'text'
  | 'manual';

export type GardenTheme =
  | 'cozy_greenhouse'
  | 'moonlight'
  | 'cosmic'
  | 'underwater';

export type ArtifactType =
  | 'butterfly'
  | 'bee'
  | 'hummingbird'
  | 'firefly'
  | 'dragonfly'
  | 'wind_chime'
  | 'bird_feeder'
  | 'painting'
  | 'cat'
  | 'gnome';

// Database Tables
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone_number: string | null;
          display_name: string | null;
          notifications_enabled: boolean;
          is_premium: boolean;
          total_friends: number;
          total_interactions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone_number?: string | null;
          display_name?: string | null;
          notifications_enabled?: boolean;
          is_premium?: boolean;
          total_friends?: number;
          total_interactions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone_number?: string | null;
          display_name?: string | null;
          notifications_enabled?: boolean;
          is_premium?: boolean;
          total_friends?: number;
          total_interactions?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone_number: string | null;
          email: string | null;
          plant_type: PlantType;
          contact_frequency: ContactFrequency;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone_number?: string | null;
          email?: string | null;
          plant_type: PlantType;
          contact_frequency?: ContactFrequency;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone_number?: string | null;
          email?: string | null;
          plant_type?: PlantType;
          contact_frequency?: ContactFrequency;
          created_at?: string;
          updated_at?: string;
        };
      };
      plants: {
        Row: {
          id: string;
          friend_id: string;
          current_hydration: number;
          last_hydration_update: string;
          decay_rate_per_day: number;
          is_dead: boolean;
          death_timestamp: string | null;
          evolution_stage: EvolutionStage;
          streak_count: number;
          total_interactions: number;
          total_xp: number;
          grid_position_x: number;
          grid_position_y: number;
          grid_room_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          friend_id: string;
          current_hydration?: number;
          last_hydration_update?: string;
          decay_rate_per_day: number;
          is_dead?: boolean;
          death_timestamp?: string | null;
          evolution_stage?: EvolutionStage;
          streak_count?: number;
          total_interactions?: number;
          total_xp?: number;
          grid_position_x: number;
          grid_position_y: number;
          grid_room_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          friend_id?: string;
          current_hydration?: number;
          last_hydration_update?: string;
          decay_rate_per_day?: number;
          is_dead?: boolean;
          death_timestamp?: string | null;
          evolution_stage?: EvolutionStage;
          streak_count?: number;
          total_interactions?: number;
          total_xp?: number;
          grid_position_x?: number;
          grid_position_y?: number;
          grid_room_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interactions: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          interaction_type: InteractionType;
          hydration_restored: number;
          note: string | null;
          was_auto_detected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          interaction_type: InteractionType;
          hydration_restored?: number;
          note?: string | null;
          was_auto_detected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          interaction_type?: InteractionType;
          hydration_restored?: number;
          note?: string | null;
          was_auto_detected?: boolean;
          created_at?: string;
        };
      };
      garden_layouts: {
        Row: {
          id: string;
          user_id: string;
          room_name: string;
          theme: GardenTheme;
          grid_width: number;
          grid_height: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          room_name?: string;
          theme?: GardenTheme;
          grid_width?: number;
          grid_height?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          room_name?: string;
          theme?: GardenTheme;
          grid_width?: number;
          grid_height?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      decorative_items: {
        Row: {
          id: string;
          user_id: string;
          item_name: string;
          item_type: string;
          grid_position_x: number;
          grid_position_y: number;
          grid_room_id: string | null;
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_name: string;
          item_type: string;
          grid_position_x: number;
          grid_position_y: number;
          grid_room_id?: string | null;
          is_premium?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_name?: string;
          item_type?: string;
          grid_position_x?: number;
          grid_position_y?: number;
          grid_room_id?: string | null;
          is_premium?: boolean;
          created_at?: string;
        };
      };
      artifacts: {
        Row: {
          id: string;
          user_id: string;
          artifact_type: ArtifactType;
          plant_id: string | null;
          is_garden_level: boolean;
          unlock_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          artifact_type: ArtifactType;
          plant_id?: string | null;
          is_garden_level?: boolean;
          unlock_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          artifact_type?: ArtifactType;
          plant_id?: string | null;
          is_garden_level?: boolean;
          unlock_date?: string;
          created_at?: string;
        };
      };
      revive_logs: {
        Row: {
          id: string;
          user_id: string;
          plant_id: string;
          revive_type: 'free' | 'premium';
          previous_stage: EvolutionStage;
          previous_streak: number;
          restored_stage: EvolutionStage;
          restored_streak: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plant_id: string;
          revive_type: 'free' | 'premium';
          previous_stage: EvolutionStage;
          previous_streak?: number;
          restored_stage: EvolutionStage;
          restored_streak?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plant_id?: string;
          revive_type?: 'free' | 'premium';
          previous_stage?: EvolutionStage;
          previous_streak?: number;
          restored_stage?: EvolutionStage;
          restored_streak?: number;
          created_at?: string;
        };
      };
      artifact_templates: {
        Row: {
          id: string;
          artifact_type: ArtifactType;
          display_name: string;
          description: string;
          unlock_requirement_type: 'plant_streak' | 'garden_health';
          unlock_threshold: number;
          is_garden_level: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          artifact_type: ArtifactType;
          display_name: string;
          description: string;
          unlock_requirement_type: 'plant_streak' | 'garden_health';
          unlock_threshold: number;
          is_garden_level?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          artifact_type?: ArtifactType;
          display_name?: string;
          description?: string;
          unlock_requirement_type?: 'plant_streak' | 'garden_health';
          unlock_threshold?: number;
          is_garden_level?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      user_garden_overview: {
        Row: {
          user_id: string;
          display_name: string | null;
          total_friends: number;
          alive_plants: number;
          dead_plants: number;
          avg_hydration: number;
          total_interactions_count: number;
        };
      };
    };
    Functions: {
      calculate_current_hydration: {
        Args: { p_plant_id: string };
        Returns: number;
      };
      update_plant_hydration: {
        Args: { p_plant_id: string };
        Returns: void;
      };
      log_interaction: {
        Args: {
          p_user_id: string;
          p_friend_id: string;
          p_interaction_type: InteractionType;
          p_hydration_amount?: number;
          p_note?: string;
          p_was_auto_detected?: boolean;
        };
        Returns: string;
      };
      calculate_decay_rate: {
        Args: { p_contact_frequency: ContactFrequency };
        Returns: number;
      };
    };
    Enums: {
      plant_type: PlantType;
      evolution_stage: EvolutionStage;
      contact_frequency: ContactFrequency;
      interaction_type: InteractionType;
      garden_theme: GardenTheme;
      artifact_type: ArtifactType;
    };
  };
}

// Helper types for common queries
export type User = Database['public']['Tables']['users']['Row'];
export type Friend = Database['public']['Tables']['friends']['Row'];
export type Plant = Database['public']['Tables']['plants']['Row'];
export type Interaction = Database['public']['Tables']['interactions']['Row'];
export type GardenLayout = Database['public']['Tables']['garden_layouts']['Row'];
export type DecorativeItem = Database['public']['Tables']['decorative_items']['Row'];
export type Artifact = Database['public']['Tables']['artifacts']['Row'];
export type ReviveLog = Database['public']['Tables']['revive_logs']['Row'];
export type ArtifactTemplate = Database['public']['Tables']['artifact_templates']['Row'];

// Extended types with relationships
export type PlantWithFriend = Plant & {
  friends: Friend;
};

export type FriendWithPlant = Friend & {
  plants: Plant[];
};

export type InteractionWithFriend = Interaction & {
  friends: Friend;
};

export type UserGardenOverview = Database['public']['Views']['user_garden_overview']['Row'];
