-- ============================================================================
-- ROOTED APP - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Date: 2025-12-04
-- Description: Complete database schema for Rooted relationship wellness app
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Plant types available in the app
CREATE TYPE plant_type AS ENUM (
  'cactus',
  'fern',
  'succulent',
  'ivy',
  'sunflower',
  'bonsai',
  'rose',
  'herb'
);

-- Plant evolution stages
CREATE TYPE evolution_stage AS ENUM (
  'sprout',    -- Stage 1: Days 0-7
  'young',     -- Stage 2: Days 8-30
  'mature'     -- Stage 3: Days 31+
);

-- Contact frequency options
CREATE TYPE contact_frequency AS ENUM (
  'weekly',    -- Every 7 days
  'biweekly',  -- Every 14 days
  'monthly'    -- Every 30 days
);

-- Interaction types
CREATE TYPE interaction_type AS ENUM (
  'call',      -- Phone call (auto-detected or manual)
  'text',      -- Text message (auto-detected or manual)
  'manual'     -- Manual log (generic interaction)
);

-- Garden theme options
CREATE TYPE garden_theme AS ENUM (
  'cozy_greenhouse',  -- MVP default theme
  'moonlight',        -- Post-MVP
  'cosmic',           -- Post-MVP
  'underwater'        -- Post-MVP
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table (extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone_number TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Settings
  notifications_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '08:00:00',
  auto_detection_enabled BOOLEAN DEFAULT true,

  -- Premium status
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,

  -- Stats
  total_friends INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,

  CONSTRAINT users_total_friends_check CHECK (total_friends >= 0),
  CONSTRAINT users_total_interactions_check CHECK (total_interactions >= 0)
);

-- ----------------------------------------------------------------------------
-- Friends Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Friend information
  name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,

  -- Plant configuration
  plant_type plant_type NOT NULL,
  contact_frequency contact_frequency NOT NULL DEFAULT 'weekly',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT friends_name_not_empty CHECK (char_length(name) > 0)
);

-- ----------------------------------------------------------------------------
-- Plants Table (one-to-one with Friends)
-- ----------------------------------------------------------------------------
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  friend_id UUID UNIQUE NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,

  -- Hydration & Health
  current_hydration NUMERIC(5,2) DEFAULT 100.00,
  last_hydration_update TIMESTAMPTZ DEFAULT NOW(),
  decay_rate_per_day NUMERIC(5,2) NOT NULL,
  is_dead BOOLEAN DEFAULT false,
  death_timestamp TIMESTAMPTZ,

  -- Evolution & Progress
  evolution_stage evolution_stage DEFAULT 'sprout',
  streak_count INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,

  -- Grid position
  grid_position_x INTEGER NOT NULL,
  grid_position_y INTEGER NOT NULL,
  grid_room_id UUID, -- For future multi-room support

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT plants_hydration_range CHECK (current_hydration >= 0 AND current_hydration <= 100),
  CONSTRAINT plants_grid_x_range CHECK (grid_position_x >= 0 AND grid_position_x <= 5),
  CONSTRAINT plants_grid_y_range CHECK (grid_position_y >= 0 AND grid_position_y <= 5),
  CONSTRAINT plants_streak_count_check CHECK (streak_count >= 0),
  CONSTRAINT plants_total_interactions_check CHECK (total_interactions >= 0),
  CONSTRAINT plants_total_xp_check CHECK (total_xp >= 0)
);

-- ----------------------------------------------------------------------------
-- Interactions Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  friend_id UUID NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Interaction details
  interaction_type interaction_type NOT NULL,
  hydration_restored NUMERIC(5,2) NOT NULL,
  note TEXT,

  -- Auto-detection metadata
  was_auto_detected BOOLEAN DEFAULT false,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT interactions_hydration_restored_check CHECK (hydration_restored >= 0)
);

-- ----------------------------------------------------------------------------
-- Garden Layouts Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.garden_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Garden configuration
  room_id UUID DEFAULT uuid_generate_v4(), -- For future multi-room support
  theme garden_theme DEFAULT 'cozy_greenhouse',
  grid_size INTEGER DEFAULT 6,

  -- Overall garden health (calculated)
  average_hydration NUMERIC(5,2) DEFAULT 100.00,
  last_health_check TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT garden_grid_size_check CHECK (grid_size >= 6 AND grid_size <= 12)
);

-- ----------------------------------------------------------------------------
-- Decorative Items Table
-- ----------------------------------------------------------------------------
CREATE TABLE public.decorative_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  garden_layout_id UUID REFERENCES public.garden_layouts(id) ON DELETE CASCADE,

  -- Item details
  item_id TEXT NOT NULL, -- e.g., 'wooden-table', 'watering-can'
  item_name TEXT NOT NULL,
  grid_position_x INTEGER NOT NULL,
  grid_position_y INTEGER NOT NULL,

  -- Acquisition
  is_premium BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT decorative_items_grid_x_check CHECK (grid_position_x >= 0 AND grid_position_x <= 5),
  CONSTRAINT decorative_items_grid_y_check CHECK (grid_position_y >= 0 AND grid_position_y <= 5)
);

-- ----------------------------------------------------------------------------
-- Collectible Artifacts Table (Post-MVP v1.1+)
-- ----------------------------------------------------------------------------
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Artifact details
  artifact_type TEXT NOT NULL, -- 'butterfly', 'bee', 'hummingbird', 'wind_chime', etc.
  artifact_category TEXT NOT NULL, -- 'plant_level' or 'garden_level'

  -- Association (plant-level artifacts attach to specific plant)
  attached_to_plant_id UUID REFERENCES public.plants(id) ON DELETE SET NULL,

  -- Position (for garden-level artifacts)
  grid_position_x INTEGER,
  grid_position_y INTEGER,

  -- Unlock requirements
  required_streak_days INTEGER,
  required_avg_hydration NUMERIC(5,2),

  -- Status
  is_unlocked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true, -- Can be toggled on/off
  unlocked_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT artifacts_category_check CHECK (artifact_category IN ('plant_level', 'garden_level'))
);

-- ----------------------------------------------------------------------------
-- Revive Logs Table (Track free vs premium revives)
-- ----------------------------------------------------------------------------
CREATE TABLE public.revive_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,

  -- Revive details
  revive_type TEXT NOT NULL, -- 'free' or 'premium'
  previous_stage evolution_stage,
  previous_streak INTEGER,
  restored_stage evolution_stage,
  restored_streak INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT revive_type_check CHECK (revive_type IN ('free', 'premium'))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Friends indexes
CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_created_at ON public.friends(created_at DESC);

-- Plants indexes
CREATE INDEX idx_plants_friend_id ON public.plants(friend_id);
CREATE INDEX idx_plants_user_via_friend ON public.plants(friend_id); -- Join optimization
CREATE INDEX idx_plants_is_dead ON public.plants(is_dead);
CREATE INDEX idx_plants_grid_position ON public.plants(grid_position_x, grid_position_y);

-- Interactions indexes
CREATE INDEX idx_interactions_friend_id ON public.interactions(friend_id);
CREATE INDEX idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX idx_interactions_created_at ON public.interactions(created_at DESC);
CREATE INDEX idx_interactions_type ON public.interactions(interaction_type);

-- Garden layouts indexes
CREATE INDEX idx_garden_layouts_user_id ON public.garden_layouts(user_id);

-- Decorative items indexes
CREATE INDEX idx_decorative_items_user_id ON public.decorative_items(user_id);
CREATE INDEX idx_decorative_items_garden_layout_id ON public.decorative_items(garden_layout_id);

-- Artifacts indexes
CREATE INDEX idx_artifacts_user_id ON public.artifacts(user_id);
CREATE INDEX idx_artifacts_plant_id ON public.artifacts(attached_to_plant_id);
CREATE INDEX idx_artifacts_unlocked ON public.artifacts(is_unlocked);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decorative_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revive_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Friends policies
CREATE POLICY "Users can view own friends" ON public.friends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own friends" ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friends" ON public.friends
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own friends" ON public.friends
  FOR DELETE USING (auth.uid() = user_id);

-- Plants policies
CREATE POLICY "Users can view own plants" ON public.plants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE friends.id = plants.friend_id
      AND friends.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plants" ON public.plants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE friends.id = plants.friend_id
      AND friends.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plants" ON public.plants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE friends.id = plants.friend_id
      AND friends.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plants" ON public.plants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.friends
      WHERE friends.id = plants.friend_id
      AND friends.user_id = auth.uid()
    )
  );

-- Interactions policies
CREATE POLICY "Users can view own interactions" ON public.interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON public.interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Garden layouts policies
CREATE POLICY "Users can view own garden layouts" ON public.garden_layouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own garden layouts" ON public.garden_layouts
  FOR ALL USING (auth.uid() = user_id);

-- Decorative items policies
CREATE POLICY "Users can view own decorative items" ON public.decorative_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own decorative items" ON public.decorative_items
  FOR ALL USING (auth.uid() = user_id);

-- Artifacts policies
CREATE POLICY "Users can view own artifacts" ON public.artifacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own artifacts" ON public.artifacts
  FOR ALL USING (auth.uid() = user_id);

-- Revive logs policies
CREATE POLICY "Users can view own revive logs" ON public.revive_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revive logs" ON public.revive_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Calculate current hydration based on timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_current_hydration(
  p_plant_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_current_hydration NUMERIC;
  v_last_update TIMESTAMPTZ;
  v_decay_rate NUMERIC;
  v_elapsed_hours NUMERIC;
  v_elapsed_days NUMERIC;
  v_decay_amount NUMERIC;
  v_new_hydration NUMERIC;
BEGIN
  -- Get plant data
  SELECT current_hydration, last_hydration_update, decay_rate_per_day
  INTO v_current_hydration, v_last_update, v_decay_rate
  FROM public.plants
  WHERE id = p_plant_id;

  -- Calculate elapsed time
  v_elapsed_hours := EXTRACT(EPOCH FROM (NOW() - v_last_update)) / 3600;
  v_elapsed_days := v_elapsed_hours / 24;

  -- Calculate decay amount
  v_decay_amount := v_elapsed_days * v_decay_rate;

  -- Calculate new hydration (min 0)
  v_new_hydration := GREATEST(0, v_current_hydration - v_decay_amount);

  RETURN v_new_hydration;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: Update plant hydration (called periodically or on app open)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_plant_hydration(
  p_plant_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_new_hydration NUMERIC;
  v_is_currently_dead BOOLEAN;
BEGIN
  -- Calculate new hydration
  v_new_hydration := calculate_current_hydration(p_plant_id);

  -- Check current death status
  SELECT is_dead INTO v_is_currently_dead
  FROM public.plants
  WHERE id = p_plant_id;

  -- Update plant
  UPDATE public.plants
  SET
    current_hydration = v_new_hydration,
    last_hydration_update = NOW(),
    -- Mark as dead if hydration = 0 for more than 24 hours
    is_dead = CASE
      WHEN v_new_hydration = 0 AND
           (NOW() - last_hydration_update) > INTERVAL '24 hours'
      THEN true
      ELSE is_dead
    END,
    -- Set death timestamp if newly dead
    death_timestamp = CASE
      WHEN v_new_hydration = 0 AND
           (NOW() - last_hydration_update) > INTERVAL '24 hours' AND
           NOT v_is_currently_dead
      THEN NOW()
      ELSE death_timestamp
    END,
    updated_at = NOW()
  WHERE id = p_plant_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: Log interaction and restore hydration
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_interaction(
  p_user_id UUID,
  p_friend_id UUID,
  p_interaction_type interaction_type,
  p_hydration_amount NUMERIC DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_was_auto_detected BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_interaction_id UUID;
  v_plant_id UUID;
  v_hydration_to_restore NUMERIC;
  v_current_hydration NUMERIC;
  v_new_hydration NUMERIC;
BEGIN
  -- Determine hydration amount based on interaction type
  v_hydration_to_restore := COALESCE(
    p_hydration_amount,
    CASE p_interaction_type
      WHEN 'call' THEN 40
      WHEN 'text' THEN 20
      WHEN 'manual' THEN 30
    END
  );

  -- Get plant ID
  SELECT id INTO v_plant_id
  FROM public.plants
  WHERE friend_id = p_friend_id;

  -- Calculate current hydration
  v_current_hydration := calculate_current_hydration(v_plant_id);

  -- Calculate new hydration (cap at 100)
  v_new_hydration := LEAST(100, v_current_hydration + v_hydration_to_restore);

  -- Update plant
  UPDATE public.plants
  SET
    current_hydration = v_new_hydration,
    last_hydration_update = NOW(),
    total_interactions = total_interactions + 1,
    total_xp = total_xp + 10, -- 10 XP per interaction
    is_dead = false, -- Revive if was dead
    death_timestamp = NULL,
    updated_at = NOW()
  WHERE id = v_plant_id;

  -- Insert interaction record
  INSERT INTO public.interactions (
    user_id,
    friend_id,
    interaction_type,
    hydration_restored,
    note,
    was_auto_detected
  ) VALUES (
    p_user_id,
    p_friend_id,
    p_interaction_type,
    v_hydration_to_restore,
    p_note,
    p_was_auto_detected
  )
  RETURNING id INTO v_interaction_id;

  -- Update user total interactions
  UPDATE public.users
  SET total_interactions = total_interactions + 1
  WHERE id = p_user_id;

  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: Calculate decay rate based on contact frequency
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_decay_rate(
  p_frequency contact_frequency
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'weekly' THEN 100.0 / 7    -- ~14.29% per day
    WHEN 'biweekly' THEN 100.0 / 14 -- ~7.14% per day
    WHEN 'monthly' THEN 100.0 / 30  -- ~3.33% per day
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON public.plants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garden_layouts_updated_at BEFORE UPDATE ON public.garden_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate decay rate when plant is created
CREATE OR REPLACE FUNCTION set_plant_decay_rate()
RETURNS TRIGGER AS $$
DECLARE
  v_frequency contact_frequency;
BEGIN
  -- Get contact frequency from associated friend
  SELECT contact_frequency INTO v_frequency
  FROM public.friends
  WHERE id = NEW.friend_id;

  -- Set decay rate
  NEW.decay_rate_per_day := calculate_decay_rate(v_frequency);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_plant_decay_rate_on_insert BEFORE INSERT ON public.plants
  FOR EACH ROW EXECUTE FUNCTION set_plant_decay_rate();

-- Update decay rate when friend's contact frequency changes
CREATE OR REPLACE FUNCTION update_plant_decay_rate_on_frequency_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.contact_frequency IS DISTINCT FROM NEW.contact_frequency THEN
    UPDATE public.plants
    SET decay_rate_per_day = calculate_decay_rate(NEW.contact_frequency)
    WHERE friend_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plant_decay_rate AFTER UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION update_plant_decay_rate_on_frequency_change();

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- Seed artifact templates (unlockable artifacts)
-- These are templates that users can unlock, not user-specific data
CREATE TABLE IF NOT EXISTS public.artifact_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_type TEXT UNIQUE NOT NULL,
  artifact_category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  required_streak_days INTEGER,
  required_avg_hydration NUMERIC(5,2),
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Insert artifact templates
INSERT INTO public.artifact_templates (artifact_type, artifact_category, display_name, description, required_streak_days, required_avg_hydration, sort_order) VALUES
  -- Plant-level artifacts
  ('butterfly', 'plant_level', 'Butterfly', 'Gentle flutter around your plant', 7, NULL, 1),
  ('bee', 'plant_level', 'Bee', 'Hovers near flowers', 14, NULL, 2),
  ('hummingbird', 'plant_level', 'Hummingbird', 'Quick darting movements', 30, NULL, 3),
  ('firefly', 'plant_level', 'Firefly', 'Glows softly at night', 60, NULL, 4),
  ('dragonfly', 'plant_level', 'Dragonfly', 'Graceful flight patterns', 90, NULL, 5),

  -- Garden-level artifacts
  ('wind_chime', 'garden_level', 'Wind Chime', 'Gentle swaying decoration', NULL, 70.00, 6),
  ('bird_feeder', 'garden_level', 'Bird Feeder', 'Attracts bird visitors', NULL, 80.00, 7),
  ('painting', 'garden_level', 'Garden Painting', 'Beautiful wall art', NULL, 85.00, 8),
  ('cat', 'garden_level', 'Friendly Cat', 'Wanders your garden', NULL, 90.00, 9),
  ('gnome', 'garden_level', 'Garden Gnome', 'Rare animated companion', NULL, 95.00, 10);

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View: User's garden overview
CREATE OR REPLACE VIEW user_garden_overview AS
SELECT
  u.id AS user_id,
  u.display_name,
  COUNT(DISTINCT f.id) AS total_friends,
  COUNT(DISTINCT CASE WHEN p.is_dead = false THEN p.id END) AS alive_plants,
  COUNT(DISTINCT CASE WHEN p.is_dead = true THEN p.id END) AS dead_plants,
  AVG(CASE WHEN p.is_dead = false THEN p.current_hydration END) AS avg_hydration,
  COUNT(i.id) AS total_interactions_count
FROM public.users u
LEFT JOIN public.friends f ON f.user_id = u.id
LEFT JOIN public.plants p ON p.friend_id = f.id
LEFT JOIN public.interactions i ON i.user_id = u.id
GROUP BY u.id, u.display_name;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.users IS 'User accounts and profile information';
COMMENT ON TABLE public.friends IS 'Friends added to the garden';
COMMENT ON TABLE public.plants IS 'Plant representations of friendships';
COMMENT ON TABLE public.interactions IS 'Log of all friend interactions (calls, texts)';
COMMENT ON TABLE public.garden_layouts IS 'Garden configuration and theme settings';
COMMENT ON TABLE public.decorative_items IS 'Decorative furniture and items placed in garden';
COMMENT ON TABLE public.artifacts IS 'Collectible artifacts earned through streaks and garden health';
COMMENT ON TABLE public.revive_logs IS 'History of plant revivals (free vs premium)';

COMMENT ON FUNCTION calculate_current_hydration IS 'Calculate plant hydration based on elapsed time since last update';
COMMENT ON FUNCTION update_plant_hydration IS 'Update plant hydration and death status';
COMMENT ON FUNCTION log_interaction IS 'Log a friend interaction and restore plant hydration';
COMMENT ON FUNCTION calculate_decay_rate IS 'Calculate daily decay rate based on contact frequency';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
