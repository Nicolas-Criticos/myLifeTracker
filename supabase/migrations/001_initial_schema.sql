-- myLifeTracker Initial Schema
-- Created: 2026-04-21

-- Projects table
CREATE TABLE ops_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('FOUNDATION', 'LEVERAGE', 'EXPRESSION')),
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  priority int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE ops_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES ops_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dropped', 'rescheduled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  scheduled_date date,
  completed_at timestamptz,
  dropped_reason text,
  created_at timestamptz DEFAULT now()
);

-- Daily check-ins table
CREATE TABLE ops_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  energy_level int NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
  focus_level int NOT NULL CHECK (focus_level BETWEEN 1 AND 10),
  physical_constraints text,
  available_hours numeric(4,1),
  intent text,
  selected_tasks uuid[],
  non_negotiable text,
  created_at timestamptz DEFAULT now()
);

-- Daily logs table
CREATE TABLE ops_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  checkin_id uuid REFERENCES ops_checkins(id),
  tasks_completed uuid[],
  tasks_attempted uuid[],
  blockers text,
  observations text,
  momentum_score int CHECK (momentum_score BETWEEN 1 AND 10),
  key_insight text,
  created_at timestamptz DEFAULT now()
);

-- Weekly reviews table
CREATE TABLE ops_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE,
  primary_project_id uuid REFERENCES ops_projects(id),
  secondary_project_ids uuid[],
  what_completed text,
  what_failed text,
  energy_trend text,
  key_lessons text,
  completion_rate numeric(5,2),
  momentum_score numeric(4,1),
  next_week_focus text,
  recommended_action text CHECK (recommended_action IN ('continue', 'shift', 'pause')),
  created_at timestamptz DEFAULT now()
);

-- Patterns table
CREATE TABLE ops_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at timestamptz DEFAULT now(),
  pattern_type text NOT NULL,
  description text NOT NULL,
  affected_project_id uuid REFERENCES ops_projects(id),
  suggestion text,
  acknowledged boolean DEFAULT false
);

-- Seed projects
INSERT INTO ops_projects (name, category, description, priority) VALUES
  ('Water Systems', 'FOUNDATION', 'Sump, river pump, irrigation infrastructure', 1),
  ('Olive Tree Rehabilitation', 'FOUNDATION', 'Block-based olive tree restoration across ~16,000 trees', 2),
  ('Garden Systems', 'FOUNDATION', 'Compost, greenhouse, soil health', 3),
  ('Barn Layout & Workflow Zones', 'LEVERAGE', 'Physical barn organisation and operational zones', 1),
  ('AI + Data Systems', 'LEVERAGE', 'Vrisch Gewagt app, agents, data tracking', 2),
  ('Product Development', 'LEVERAGE', 'Sceletium, tallow, and other health products', 3),
  ('Olive Oil Brand & Sales', 'EXPRESSION', 'DTC olive oil sales via WhatsApp + Instagram', 1),
  ('Content Creation', 'EXPRESSION', 'Instagram journey documentation, brand building', 2),
  ('Doctor''s Wellness Retreat', 'EXPRESSION', 'Retreat development and management', 3);
