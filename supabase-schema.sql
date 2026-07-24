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
  'herb',
  'monstera',  -- added: app starter catalog (migration add_plant_type_enum_values)
  'bamboo',    -- added: client Plant union
  'ficus'      -- added: app starter catalog
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
  notifications_enabled BOOLEAN DEFAULT true,  -- legacy; superseded by notification_prefs
  notification_time TIME DEFAULT '08:00:00',   -- legacy; superseded by notification_prefs
  -- Batch 8: per-category toggles + digest hour for the client-scheduled
  -- local notification engine (src/lib/notifications.ts). No server push.
  notification_prefs JSONB NOT NULL DEFAULT
    '{"digest": true, "digestHour": 9, "atRisk": true, "wilt": true, "suggested": true, "birthdays": true}'::jsonb,
  auto_detection_enabled BOOLEAN DEFAULT true,

  -- Premium status
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,

  -- Vacation/pause freeze (migration garden_pause_and_death_cut): while
  -- paused, client-side decay is computed only up to paused_at; unpausing
  -- shifts plants.last_hydration_update forward by the pause duration.
  is_paused BOOLEAN NOT NULL DEFAULT false,
  paused_at TIMESTAMPTZ,

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
  -- Evolution advances on lifetime interactions (young ≥ 5, mature ≥ 20)
  -- inside log_interaction and never regresses (decoupled from streaks).
  evolution_stage evolution_stage DEFAULT 'sprout',
  streak_count INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,

  -- Streak window state (Batch 7 — see roll_plant_streak for the math)
  streak_window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  streak_window_satisfied BOOLEAN NOT NULL DEFAULT false,
  streak_best INTEGER NOT NULL DEFAULT 0,
  streak_broken_at TIMESTAMPTZ,          -- deadline the streak broke at; arms the restore window
  streak_broken_count INTEGER NOT NULL DEFAULT 0, -- streak value at break (what a restore brings back)
  prestige_level INTEGER NOT NULL DEFAULT 0,      -- milestones past the ×2.0 tier cap

  -- Grid position
  grid_position_x INTEGER NOT NULL,
  grid_position_y INTEGER NOT NULL,
  grid_room_id UUID, -- For future multi-room support

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT plants_hydration_range CHECK (current_hydration >= 0 AND current_hydration <= 100),
  -- 0..9 matches the app's 10x10 exampleMap (migration widen_plants_grid_checks)
  CONSTRAINT plants_grid_x_range CHECK (grid_position_x >= 0 AND grid_position_x <= 9),
  CONSTRAINT plants_grid_y_range CHECK (grid_position_y >= 0 AND grid_position_y <= 9),
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

  -- Widened to match plants (Batch 6); live constraint names are
  -- decorative_items_grid_position_x_check / _y_check
  CONSTRAINT decorative_items_grid_x_check CHECK (grid_position_x >= 0 AND grid_position_x <= 9),
  CONSTRAINT decorative_items_grid_y_check CHECK (grid_position_y >= 0 AND grid_position_y <= 9)
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
-- Streak machinery (Batch 7). ONE roll-forward function owns the window
-- math; sync_streaks() and log_interaction() both call it. No cron — lazy
-- evaluation on garden load and at log time.
-- ----------------------------------------------------------------------------

-- The streak clock: one period per cadence (decay rate is separate).
CREATE OR REPLACE FUNCTION public.cadence_period(p_frequency contact_frequency)
RETURNS interval
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_frequency
    WHEN 'weekly' THEN interval '7 days'
    WHEN 'biweekly' THEN interval '14 days'
    WHEN 'monthly' THEN interval '30 days'
  END;
$$;

-- Streak tier multiplier (ratified defaults: 1–2 ×1.0 · 3–4 ×1.25 ·
-- 5–8 ×1.5 · 9–12 ×1.75 · 13+ ×2.0 cap). Consumed by the Batch 9 mint.
CREATE OR REPLACE FUNCTION public.streak_multiplier(p_streak integer)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_streak >= 13 THEN 2.0
    WHEN p_streak >= 9 THEN 1.75
    WHEN p_streak >= 5 THEN 1.5
    WHEN p_streak >= 3 THEN 1.25
    ELSE 1.0
  END;
$$;

-- Advance a plant's streak window up to p_to, committing lapses (only the
-- streak resets — spec §1). Time freezes at paused_at while paused.
CREATE OR REPLACE FUNCTION public.roll_plant_streak(p_plant_id uuid, p_to timestamptz)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_period interval;
  v_window_start timestamptz;
  v_satisfied boolean;
  v_streak integer;
  v_broken_at timestamptz;
  v_broken_count integer;
  v_effective_to timestamptz;
  v_paused boolean;
  v_paused_at timestamptz;
BEGIN
  SELECT p.streak_window_start, p.streak_window_satisfied, p.streak_count,
         p.streak_broken_at, p.streak_broken_count,
         cadence_period(f.contact_frequency), u.is_paused, u.paused_at
  INTO v_window_start, v_satisfied, v_streak, v_broken_at, v_broken_count,
       v_period, v_paused, v_paused_at
  FROM public.plants p
  JOIN public.friends f ON f.id = p.friend_id
  JOIN public.users u ON u.id = f.user_id
  WHERE p.id = p_plant_id
  FOR UPDATE OF p;

  IF NOT FOUND THEN RETURN; END IF;

  v_effective_to := CASE WHEN v_paused AND v_paused_at IS NOT NULL
                         THEN LEAST(p_to, v_paused_at) ELSE p_to END;

  WHILE v_window_start + v_period <= v_effective_to LOOP
    IF v_satisfied THEN
      v_window_start := v_window_start + v_period;
      v_satisfied := false;
    ELSE
      IF v_streak > 0 THEN
        v_broken_at := v_window_start + v_period;
        v_broken_count := v_streak;
        v_streak := 0;
      END IF;
      v_window_start := v_window_start + v_period;
    END IF;
  END LOOP;

  UPDATE public.plants
  SET streak_window_start = v_window_start,
      streak_window_satisfied = v_satisfied,
      streak_count = v_streak,
      streak_broken_at = v_broken_at,
      streak_broken_count = v_broken_count
  WHERE id = p_plant_id;
END;
$$;

-- Roll every plant of the caller forward. Called on garden load and before
-- widget sync (client: fetchGarden in src/lib/garden.ts).
CREATE OR REPLACE FUNCTION public.sync_streaks()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_plant RECORD;
BEGIN
  FOR v_plant IN
    SELECT p.id FROM public.plants p
    JOIN public.friends f ON f.id = p.friend_id
    WHERE f.user_id = auth.uid()
  LOOP
    PERFORM roll_plant_streak(v_plant.id, now());
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: Log interaction — hydration + streak + evolution + MINTING (v3)
-- SECURITY DEFINER with explicit ownership checks (p_user_id must be
-- auth.uid() and own the friend). Returns jsonb: interaction_id,
-- new_hydration, streak, full_mint, points_minted, multiplier, gems_minted,
-- points_balance, gems_balance. See migration batch9_economy_core for the
-- authoritative body (mint keys: mint:<friend_id>:<date>,
-- mint:trickle:<interaction_id>, gem:tierup/prestige/first-call).
-- Weights: manual ("hung out") 50 / call 35 / text 15. Backdating 48 h via
-- p_occurred_at. Idempotent on p_interaction_id.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_interaction(
  p_user_id UUID,
  p_friend_id UUID,
  p_interaction_type interaction_type,
  p_hydration_amount NUMERIC DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_was_auto_detected BOOLEAN DEFAULT false,
  p_interaction_id UUID DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_interaction_id UUID;
  v_plant_id UUID;
  v_hydration_to_restore NUMERIC;
  v_current_hydration NUMERIC;
  v_new_hydration NUMERIC;
  v_occurred timestamptz;
  v_total integer;
  v_satisfied boolean;
  v_streak integer;
  v_prestige_before integer;
  v_prestige_after integer;
  v_mult numeric;
  v_points integer := 0;
  v_gems integer := 0;
  v_full_mint boolean := false;
  v_year integer;
BEGIN
  IF auth.uid() IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.friends WHERE id = p_friend_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'friend not found';
  END IF;

  IF p_interaction_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.interactions WHERE id = p_interaction_id
  ) THEN
    RETURN jsonb_build_object('interaction_id', p_interaction_id, 'replayed', true);
  END IF;

  v_occurred := LEAST(now(), GREATEST(COALESCE(p_occurred_at, now()), now() - interval '48 hours'));

  v_hydration_to_restore := COALESCE(
    p_hydration_amount,
    CASE p_interaction_type
      WHEN 'manual' THEN 50
      WHEN 'call' THEN 35
      WHEN 'text' THEN 15
    END
  );

  SELECT id INTO v_plant_id FROM public.plants WHERE friend_id = p_friend_id;

  v_current_hydration := calculate_current_hydration(v_plant_id);
  v_new_hydration := LEAST(100, v_current_hydration + v_hydration_to_restore);

  UPDATE public.plants
  SET
    current_hydration = v_new_hydration,
    last_hydration_update = NOW(),
    total_interactions = total_interactions + 1,
    total_xp = total_xp + 10,
    updated_at = NOW()
  WHERE id = v_plant_id
  RETURNING total_interactions INTO v_total;

  UPDATE public.plants
  SET evolution_stage = CASE
    WHEN v_total >= 20 THEN 'mature'::evolution_stage
    WHEN v_total >= 5 THEN 'young'::evolution_stage
    ELSE 'sprout'::evolution_stage
  END
  WHERE id = v_plant_id
    AND evolution_stage IS DISTINCT FROM (CASE
      WHEN v_total >= 20 THEN 'mature'::evolution_stage
      WHEN v_total >= 5 THEN 'young'::evolution_stage
      ELSE 'sprout'::evolution_stage END);

  PERFORM roll_plant_streak(v_plant_id, v_occurred);

  SELECT streak_window_satisfied, streak_count, prestige_level
  INTO v_satisfied, v_streak, v_prestige_before
  FROM public.plants WHERE id = v_plant_id;
  v_prestige_after := v_prestige_before;

  IF NOT v_satisfied THEN
    v_streak := v_streak + 1;
    v_prestige_after := v_prestige_before +
      CASE WHEN v_streak >= 13 AND (v_streak - 13) % 4 = 0 THEN 1 ELSE 0 END;
    UPDATE public.plants
    SET streak_window_satisfied = true,
        streak_count = v_streak,
        streak_best = GREATEST(streak_best, v_streak),
        prestige_level = v_prestige_after
    WHERE id = v_plant_id;
  END IF;

  PERFORM roll_plant_streak(v_plant_id, now());

  INSERT INTO public.interactions (
    id, user_id, friend_id, interaction_type,
    hydration_restored, note, was_auto_detected, created_at
  ) VALUES (
    COALESCE(p_interaction_id, extensions.uuid_generate_v4()),
    p_user_id, p_friend_id, p_interaction_type,
    v_hydration_to_restore, p_note, p_was_auto_detected, v_occurred
  )
  RETURNING id INTO v_interaction_id;

  UPDATE public.users
  SET total_interactions = total_interactions + 1
  WHERE id = p_user_id;

  v_mult := streak_multiplier(v_streak);

  -- Full mint once per plant per day; extras trickle 5 (default #6).
  INSERT INTO public.ledger_entries
    (user_id, currency, amount, reason, source_type, source_id, idempotency_key, metadata)
  VALUES (
    p_user_id, 'points',
    round(v_hydration_to_restore * v_mult)::integer,
    'interaction_mint', 'interaction', v_interaction_id,
    'mint:' || p_friend_id || ':' || to_char(v_occurred AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
    jsonb_build_object('type', p_interaction_type, 'base', v_hydration_to_restore, 'multiplier', v_mult)
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  IF FOUND THEN
    v_full_mint := true;
    v_points := round(v_hydration_to_restore * v_mult)::integer;
  ELSE
    INSERT INTO public.ledger_entries
      (user_id, currency, amount, reason, source_type, source_id, idempotency_key)
    VALUES (
      p_user_id, 'points', 5, 'same_day_trickle', 'trickle', v_interaction_id,
      'mint:trickle:' || v_interaction_id
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN v_points := 5; END IF;
  END IF;

  -- Gem drops (default #7), idempotency-keyed against farming.
  IF NOT v_satisfied AND v_streak IN (3, 5, 9, 13) THEN
    INSERT INTO public.ledger_entries
      (user_id, currency, amount, reason, source_type, source_id, idempotency_key)
    VALUES (
      p_user_id, 'gems', 3, 'streak_tier_up', 'tier_up', p_friend_id,
      'gem:tierup:' || p_friend_id || ':' || v_streak
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN v_gems := v_gems + 3; END IF;
  END IF;

  IF v_prestige_after > v_prestige_before THEN
    INSERT INTO public.ledger_entries
      (user_id, currency, amount, reason, source_type, source_id, idempotency_key)
    VALUES (
      p_user_id, 'gems', 5, 'prestige_milestone', 'prestige', p_friend_id,
      'gem:prestige:' || p_friend_id || ':' || v_prestige_after
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN v_gems := v_gems + 5; END IF;
  END IF;

  IF p_interaction_type = 'call' THEN
    v_year := extract(year FROM v_occurred)::integer;
    INSERT INTO public.ledger_entries
      (user_id, currency, amount, reason, source_type, source_id, idempotency_key)
    VALUES (
      p_user_id, 'gems', 2, 'first_call_of_year', 'first_call_year', p_friend_id,
      'gem:first-call:' || p_friend_id || ':' || v_year
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    IF FOUND THEN v_gems := v_gems + 2; END IF;
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'interaction_id', v_interaction_id,
      'new_hydration', v_new_hydration,
      'streak', v_streak,
      'full_mint', v_full_mint,
      'points_minted', v_points,
      'multiplier', v_mult,
      'gems_minted', v_gems,
      'points_balance', u.points_balance,
      'gems_balance', u.gems_balance
    )
    FROM public.users u WHERE u.id = p_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION log_interaction(uuid, uuid, interaction_type, numeric, text, boolean, uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION log_interaction(uuid, uuid, interaction_type, numeric, text, boolean, uuid, timestamptz) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- PRODUCT DECISION (ratified 2026-07-20): plant DEATH is CUT — wilt only.
-- is_dead, death_timestamp, revive_logs, and update_plant_hydration's death
-- check are legacy; do not build on them. Decay is computed CLIENT-side from
-- last_hydration_update + decay_rate_per_day (src/lib/garden.ts) and frozen
-- while users.is_paused.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Function: Pause/unpause the garden (vacation freeze)
-- SECURITY INVOKER — RLS scopes all updates to auth.uid().
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_garden_paused(p_paused BOOLEAN)
RETURNS void AS $$
DECLARE
  v_paused_at TIMESTAMPTZ;
BEGIN
  SELECT paused_at INTO v_paused_at FROM public.users WHERE id = auth.uid();

  IF p_paused THEN
    UPDATE public.users
    SET is_paused = true, paused_at = now()
    WHERE id = auth.uid() AND NOT is_paused;
  ELSE
    IF v_paused_at IS NOT NULL THEN
      -- Unpause shifts every clock by the pause duration: hydration decay,
      -- the streak window, and the restore window (Batch 7).
      UPDATE public.plants p
      SET last_hydration_update = p.last_hydration_update + (now() - v_paused_at),
          streak_window_start = p.streak_window_start + (now() - v_paused_at),
          streak_broken_at = p.streak_broken_at + (now() - v_paused_at)
      FROM public.friends f
      WHERE f.id = p.friend_id AND f.user_id = auth.uid();
    END IF;
    UPDATE public.users
    SET is_paused = false, paused_at = NULL
    WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

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

-- Create public.users row for every new auth.users signup
-- (migration handle_new_user_trigger; also backfilled pre-existing auth users).
-- SECURITY DEFINER bypasses RLS for the trigger path, so public.users needs
-- no INSERT policy.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update decay rate when friend's contact frequency changes
CREATE OR REPLACE FUNCTION update_plant_decay_rate_on_frequency_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.contact_frequency IS DISTINCT FROM NEW.contact_frequency THEN
    -- Cadence change recomputes the streak window at the LATER of old/new
    -- deadlines (Batch 7) — never insta-breaks a streak.
    UPDATE public.plants
    SET decay_rate_per_day = calculate_decay_rate(NEW.contact_frequency),
        streak_window_start = streak_window_start +
          GREATEST(cadence_period(OLD.contact_frequency)
                   - cadence_period(NEW.contact_frequency), interval '0')
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

-- Read-only reference data (Batch 6): RLS on, SELECT for authenticated, no
-- write policies — all writes happen via migrations.
ALTER TABLE public.artifact_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read artifact templates"
  ON public.artifact_templates FOR SELECT
  TO authenticated
  USING (true);

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

-- user_garden_overview was DROPPED in Batch 6: its cross-joined interaction
-- counts were inflated and nothing read it.

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
-- BATCH 9 — ECONOMY CORE (decision D1)
-- Append-only ledger is the truth; users.points_balance/gems_balance are
-- trigger-maintained caches. All writes via SECURITY DEFINER RPCs with
-- deterministic idempotency keys (no double-mint under replay).
-- ============================================================================

CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('points', 'gems')),
  amount INTEGER NOT NULL,               -- signed: mint > 0, spend < 0
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL,             -- interaction | trickle | tier_up | prestige | first_call_year | seasonal | restore | purchase | gift | milestone
  source_id UUID,
  idempotency_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_user_created ON public.ledger_entries (user_id, created_at DESC);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ledger" ON public.ledger_entries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Cached balances on users (also: points_balance/gems_balance INTEGER NOT
-- NULL DEFAULT 0 CHECK >= 0 — see users table, added by migration).

CREATE OR REPLACE FUNCTION public.apply_ledger_entry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.currency = 'points' THEN
    UPDATE public.users SET points_balance = points_balance + NEW.amount WHERE id = NEW.user_id;
  ELSE
    UPDATE public.users SET gems_balance = gems_balance + NEW.amount WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ledger_apply_balance
  AFTER INSERT ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.apply_ledger_entry();

-- Tier index 1-5 (restore pricing)
CREATE OR REPLACE FUNCTION public.streak_tier_index(p_streak integer)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_streak >= 13 THEN 5
    WHEN p_streak >= 9 THEN 4
    WHEN p_streak >= 5 THEN 3
    WHEN p_streak >= 3 THEN 2
    ELSE 1
  END;
$$;

-- Streak restore: the economy's first sink (spec §1). Valid for one cadence
-- period after the break; price = 100 pts × broken tier × 2^(restores in
-- 90 d) or flat 5 gems; restores the count and RE-ARMS the window without
-- satisfying it (the restore only counts if you follow through).
CREATE OR REPLACE FUNCTION public.restore_streak(p_friend_id uuid, p_currency text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_plant_id uuid;
  v_period interval;
  v_broken_at timestamptz;
  v_broken_count integer;
  v_prior_restores integer;
  v_price integer;
  v_points integer;
  v_gems integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT p.id, cadence_period(f.contact_frequency)
  INTO v_plant_id, v_period
  FROM public.plants p
  JOIN public.friends f ON f.id = p.friend_id
  WHERE p.friend_id = p_friend_id AND f.user_id = auth.uid();

  IF v_plant_id IS NULL THEN RAISE EXCEPTION 'friend not found'; END IF;
  IF p_currency NOT IN ('points', 'gems') THEN RAISE EXCEPTION 'invalid currency'; END IF;

  PERFORM roll_plant_streak(v_plant_id, now());

  SELECT streak_broken_at, streak_broken_count
  INTO v_broken_at, v_broken_count
  FROM public.plants WHERE id = v_plant_id;

  IF v_broken_at IS NULL OR v_broken_count <= 0 THEN
    RAISE EXCEPTION 'no broken streak to restore';
  END IF;
  IF now() >= v_broken_at + v_period THEN
    RAISE EXCEPTION 'restore window closed';
  END IF;

  SELECT count(*) INTO v_prior_restores
  FROM public.ledger_entries
  WHERE user_id = auth.uid() AND source_type = 'restore'
    AND source_id = p_friend_id AND created_at > now() - interval '90 days';

  IF p_currency = 'points' THEN
    v_price := 100 * streak_tier_index(v_broken_count) * power(2, v_prior_restores)::integer;
  ELSE
    v_price := 5;
  END IF;

  SELECT points_balance, gems_balance INTO v_points, v_gems
  FROM public.users WHERE id = auth.uid();

  IF (p_currency = 'points' AND v_points < v_price)
     OR (p_currency = 'gems' AND v_gems < v_price) THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  INSERT INTO public.ledger_entries
    (user_id, currency, amount, reason, source_type, source_id, idempotency_key, metadata)
  VALUES (
    auth.uid(), p_currency, -v_price, 'streak_restore', 'restore', p_friend_id,
    'restore:' || p_friend_id || ':' || to_char(v_broken_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS'),
    jsonb_build_object('restored_streak', v_broken_count, 'prior_restores_90d', v_prior_restores)
  );

  UPDATE public.plants
  SET streak_count = v_broken_count,
      streak_best = GREATEST(streak_best, v_broken_count),
      streak_window_start = now(),
      streak_window_satisfied = false,
      streak_broken_at = NULL,
      streak_broken_count = 0
  WHERE id = v_plant_id;

  RETURN (
    SELECT jsonb_build_object(
      'restored_streak', v_broken_count,
      'price', v_price,
      'currency', p_currency,
      'points_balance', u.points_balance,
      'gems_balance', u.gems_balance
    )
    FROM public.users u WHERE u.id = auth.uid()
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'streak already restored';
END;
$$;

REVOKE ALL ON FUNCTION public.restore_streak(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_streak(uuid, text) TO authenticated, service_role;


-- ============================================================================
-- BATCH 10 — SHOP v1 (spec §3, Self scope)
-- Catalog / inventory / attachments + atomic purchase RPC. NOT reusing
-- artifact_templates — that stays reserved for Batch 18 collections.
-- ============================================================================

CREATE TABLE public.shop_items (
  sku TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('pot', 'nameplate', 'accessory', 'bloom', 'garden_theme', 'decor')),
  scope TEXT NOT NULL DEFAULT 'self' CHECK (scope IN ('self', 'gift', 'shared')),
  display_name TEXT NOT NULL,
  description TEXT,
  price_points INTEGER CHECK (price_points > 0),
  price_gems INTEGER CHECK (price_gems > 0),
  asset_key TEXT NOT NULL,               -- client sprite registry key (src/data/attachmentCatalog.ts)
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- both prices NULL = unpurchasable (milestone/prestige-only item)
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read the catalog" ON public.shop_items
  FOR SELECT TO authenticated USING (true);

CREATE TABLE public.user_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL REFERENCES public.shop_items(sku),
  acquired_via TEXT NOT NULL DEFAULT 'purchase' CHECK (acquired_via IN ('purchase', 'gift', 'milestone')),
  ledger_entry_id UUID REFERENCES public.ledger_entries(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,  -- gift sender etc. (Batch 15)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sku)
);
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own inventory" ON public.user_items
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.plant_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL REFERENCES public.shop_items(sku),
  slot TEXT NOT NULL,                    -- = category for v1 (one pot, one accessory, …)
  position JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plant_id, slot)
);
ALTER TABLE public.plant_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plant attachments" ON public.plant_attachments
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.plants p JOIN public.friends f ON f.id = p.friend_id
    WHERE p.id = plant_id AND f.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.plants p JOIN public.friends f ON f.id = p.friend_id
    WHERE p.id = plant_id AND f.user_id = auth.uid()
  ));

-- Atomic purchase: ledger spend + inventory grant, key purchase:<user>:<sku>.
-- SECURITY DEFINER; self-scope only until Batch 15 (gift/shared). See
-- migration batch10_shop_v1 for the authoritative body.
-- purchase_item(p_sku text, p_currency text DEFAULT NULL) RETURNS jsonb
--   {sku, price, currency, points_balance, gems_balance}
-- Launch catalog: 12 seeded SKUs (pots/nameplates/accessories/blooms), incl.
-- the unpurchasable prestige 'pot-golden-ring'.


-- ============================================================================
-- BATCH 11 — MEMORY LAYER, solo half (spec §6)
-- ============================================================================

-- friends.birthday DATE (year optional by convention — 1904 = year unknown)
-- was added to the friends table by migration batch11_memory_layer.

CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note', 'date', 'gift_idea', 'milestone')),
  body TEXT NOT NULL,
  event_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_journal_friend ON public.journal_entries (friend_id, created_at DESC);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal" ON public.journal_entries
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,            -- memories/<user_id>/<friend_id>/<uuid>.jpg
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_shared BOOLEAN NOT NULL DEFAULT false,  -- designed now for Batch 14's shared wall
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_friend ON public.photos (friend_id, taken_at DESC);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own photos" ON public.photos
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Storage: private bucket 'memories', RLS scoped to the auth.uid() path
-- prefix: (storage.foldername(name))[1] = auth.uid()::text.


-- ============================================================================
-- BATCH 13 — LINKING CORE (spec §4). Cross-user access ONLY via SECURITY
-- DEFINER RPCs with explicit membership checks. See migrations
-- batch13_linking_core + batch13_linked_log_interaction for authoritative
-- bodies.
-- ============================================================================
-- Tables:
--   link_invites  (code UNIQUE, inviter_user_id/friend_id, status, expires_at
--                  DEFAULT now()+14d) — inviter-only SELECT RLS.
--   garden_links  (user_a/b, friend_a/b_id, status, linked_at + THE shared
--                  streak state: window_start/satisfied, streak_count/best,
--                  broken_at/count) — member SELECT RLS. Per-plant streak
--                  fields are display mirrors for linked plants.
--   link_events   (link_id, logger_user_id, interaction_id, interaction_type,
--                  merge_group_id, occurred_at) — member SELECT RLS; in the
--                  supabase_realtime publication (live watering moments).
--   push_tokens   (user_id, token, platform) — owner ALL RLS.
-- Functions:
--   link_for_friend(user, friend) — the active link, if any (STABLE).
--   roll_link_streak(link, to)    — shared-streak roll-forward; period = the
--       LONGER of the two cadences; clock freezes if EITHER member paused;
--       mirrors result onto both plants.
--   sync_streaks()                — now rolls links first, then solo plants.
--   create_link_invite(friend)    — 8-char single-use code; supersedes prior
--       pending invites for that friend.
--   accept_link_invite(code, plant_type, frequency, grid_x, grid_y,
--       existing_friend_id) — creates/reuses the reciprocal friend+plant,
--       marries streaks (pair inherits the LONGER current streak), marks the
--       invite accepted. Declines/expiry never surface (silent asymmetry).
--   log_interaction v4            — linked branch (D5): a linked log waters
--       BOTH plants + satisfies the SHARED streak once per merge group; a
--       partner's same-type log on the same UTC day JOINS the merge group
--       (no double effects) but still mints for that user (daily mint key ⇒
--       once per user per merge group; co-op out-earns solo).
--   restore_streak v2             — link-aware: restores the shared streak
--       and mirrors to both plants.
-- Edge Function: send-push — dumb Expo push sender (service-role token
--   lookup); all decisions stay client/RPC-side.


-- ============================================================================
-- BATCH 14 — COMMUNICATION LAYER (spec §4). See migration
-- batch14_communication_layer.
-- ============================================================================
-- nudges (link_id, sender_user_id, type sun|rain|butterfly|leaf|ladybug|
--   shimmer|shake|shimmy, payload jsonb {note, v}, seen_at) — member SELECT
--   RLS + receiver-only UPDATE (mark seen); Realtime-enabled. send_nudge RPC
--   enforces membership + the 3/link/day cap. NUDGES MINT NOTHING (§8).
-- friends.haptic_signature text DEFAULT 'pulse' (pulse|double|triple|long)
--   — the per-friend signature buzz, client-interpreted.
-- Gift restores: with the shared streak on garden_links, either member's
--   restore_streak saves it for BOTH — "I've been the absent one" works by
--   construction.
-- Edge Function: shared-wall — membership-checked signed URLs for BOTH
--   sides' is_shared photos of a link (storage RLS is owner-scoped, so the
--   partner's shared photos must be service-role signed).


-- ============================================================================
-- BATCH 15 — SOCIAL ECONOMY (spec §3 Gift & Shared). Migration
-- batch15_social_economy.
-- ============================================================================
-- shop_items.scope is a CAPABILITY tier: self | gift (self+gift) |
--   shared (self+gift+shared). Plant cosmetics are 'gift'; matching sets
--   ('acc-friendship-bracelet', 'bloom-twin-flower') are 'shared'; garden
--   themes/decor stay 'self' (the garden is private space).
-- purchase_item v2 (p_sku, p_currency, p_scope, p_link_id): membership +
--   capability + never-spend-on-a-no-op checks; ONE ledger spend
--   (key purchase:<buyer>:<sku>:<scope>:<link|self>); gift writes the
--   partner's user_items (giver in metadata); shared writes BOTH
--   inventories atomically from one spend (default #14: buyer pays full,
--   both receive). Gifted-item ping rides the push channel client-side.


-- ============================================================================
-- BATCH 16 — TIME CAPSULES (spec §6). Migration batch16_time_capsules.
-- ============================================================================
-- capsules (user_id, friend_id, link_id NULL = co-op, kind note|photo|voice,
--   body, storage_path → memories bucket, unlock_at, opened_at) — owner ALL
--   RLS + link-member SELECT for shared capsules. Unlock is LAZY (client
--   checks unlock_at) + a local notification at unlock_at via the Batch 8
--   engine. bury_capsule RPC enforces slots server-side: 1/plant free,
--   5 with Pass (default #15). Voice memos record via expo-audio and use
--   the memories-bucket path pattern. In-garden buried marker: pending art.


-- ============================================================================
-- BATCH 17 — GARDEN PASS (spec §7). Migration batch17_garden_pass_entitlements.
-- ============================================================================
-- users.premium_until timestamptz; user_is_premium(uid) helper.
-- SERVER-enforced entitlements (never client-only):
--   friends_plant_cap trigger  — 12 plants free, unlimited with Pass
--                                (downgrade soft-locks in the client; rows
--                                are never deleted).
--   photos_cap trigger         — 20 photos/plant free.
--   bury_capsule (Batch 16)    — 1 capsule slot free, 5 with Pass.
-- Edge Function: revenuecat-webhook (verify_jwt OFF; fail-closed on the
--   REVENUECAT_WEBHOOK_SECRET function secret) — RevenueCat lifecycle →
--   users.is_premium/premium_until. appUserID = Supabase user id.
-- Client: react-native-purchases behind EXPO_PUBLIC_REVENUECAT_IOS_KEY
--   (graceful no-op without it); GardenPassScreen paywall; guardrails —
--   cash never touches care, currency, or recovery; gems stay earned-only.
-- SETUP (user): create the RevenueCat app + products ($4.99/mo, $29.99/yr),
--   set EXPO_PUBLIC_REVENUECAT_IOS_KEY in .env, set the
--   REVENUECAT_WEBHOOK_SECRET function secret, point the RC webhook at the
--   revenuecat-webhook function URL.


-- ============================================================================
-- BATCH 18 — ALMANAC, LIVE-OPS & THE LONG TAIL (spec §7). Migrations
-- batch18_almanac_liveops_longtail + batch18_seasonal_gems.
-- ============================================================================
-- Almanac: computed entirely from interactions + ledger_entries + photos +
--   plants — no new write paths (client src/lib/almanac.ts; recap cards via
--   the captureRef pipeline; history depth Pass-gated client-side).
-- Collections: artifacts/artifact_templates finally activate —
--   sync_artifacts() lazily awards on load (streak periods × cadence days vs
--   required_streak_days; garden avg hydration vs required_avg_hydration).
-- Live-ops: pg_cron enabled; seasonal_events table; shop_items.event_window
--   tstzrange + hourly cron job 'shop-event-windows' toggling is_active.
--   Seasonal gem drop: award_seasonal_gems trigger on link_events — a log
--   that COMPLETES a merge group during an active event pays both members
--   5 gems (once per event per link per user).
-- Music Box (previews-only v1): nudge type 'song' — iTunes Search previews
--   over the nudge channel, playback via expo-audio; no MusicKit module.
-- Helpers: gopher/hedgehog SKUs (giftable decor; they flag care, never do
--   it). L1 call auto-watering NOT built — CallKit spike needs a device
--   session; the in-app "Call now" assist ships (trust-ladder L2).

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
