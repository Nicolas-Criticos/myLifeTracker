# myLifeTracker — Full Build Spec

## What We're Building
A personal execution operating system for a land-based entrepreneur.
- **Telegram** = daily operator interface (check-ins, logs, commands)
- **Web dashboard** = strategic weekly view
- **Supabase** = database + auth backend

---

## Tech Stack
- **Frontend:** React 18, Vite, TailwindCSS v4, React Router v6, React Query, Recharts
- **Backend/DB:** Supabase (new project — credentials provided below)
- **Language:** TypeScript throughout

---

## Supabase Credentials
- **Project ref:** `recqyhjooukkdwsrjslp`
- **URL:** `https://recqyhjooukkdwsrjslp.supabase.co`
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3F5aGpvb3Vra2R3c3Jqc2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjkzMTAsImV4cCI6MjA4MzcwNTMxMH0.vN0bzTBBrtSBzicjniXXyCUAdn9YIWKHmXIKMJKb0rg`

Use the Supabase JS client (`@supabase/supabase-js`) for all DB operations.

---

## Database Schema

Create these tables via Supabase SQL (use `supabase/migrations/` folder):

### `projects`
```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('FOUNDATION', 'LEVERAGE', 'EXPRESSION')),
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  priority int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `tasks`
```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dropped', 'rescheduled')),
  priority text DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  scheduled_date date,
  completed_at timestamptz,
  dropped_reason text,
  created_at timestamptz DEFAULT now()
);
```

### `daily_checkins`
```sql
CREATE TABLE daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  energy_level int NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
  focus_level int NOT NULL CHECK (focus_level BETWEEN 1 AND 10),
  physical_constraints text,
  available_hours numeric(4,1),
  intent text,
  selected_tasks uuid[], -- array of task ids selected for the day
  non_negotiable text, -- the one outcome that must happen today
  created_at timestamptz DEFAULT now()
);
```

### `daily_logs`
```sql
CREATE TABLE daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  checkin_id uuid REFERENCES daily_checkins(id),
  tasks_completed uuid[],
  tasks_attempted uuid[],
  blockers text,
  observations text,
  momentum_score int CHECK (momentum_score BETWEEN 1 AND 10),
  key_insight text,
  created_at timestamptz DEFAULT now()
);
```

### `weekly_reviews`
```sql
CREATE TABLE weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE, -- Monday of the week
  primary_project_id uuid REFERENCES projects(id),
  secondary_project_ids uuid[],
  what_completed text,
  what_failed text,
  energy_trend text,
  key_lessons text,
  completion_rate numeric(5,2), -- percentage
  momentum_score numeric(4,1),
  next_week_focus text,
  recommended_action text CHECK (recommended_action IN ('continue', 'shift', 'pause')),
  created_at timestamptz DEFAULT now()
);
```

### `patterns` (computed/logged insights)
```sql
CREATE TABLE patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at timestamptz DEFAULT now(),
  pattern_type text NOT NULL, -- e.g. 'repeated_delay', 'low_energy_overload', 'avoidance'
  description text NOT NULL,
  affected_project_id uuid REFERENCES projects(id),
  suggestion text,
  acknowledged boolean DEFAULT false
);
```

Seed the `projects` table with these initial projects:
```sql
INSERT INTO projects (name, category, description, priority) VALUES
  ('Water Systems', 'FOUNDATION', 'Sump, river pump, irrigation infrastructure', 1),
  ('Olive Tree Rehabilitation', 'FOUNDATION', 'Block-based olive tree restoration across ~16,000 trees', 2),
  ('Garden Systems', 'FOUNDATION', 'Compost, greenhouse, soil health', 3),
  ('Barn Layout & Workflow Zones', 'LEVERAGE', 'Physical barn organisation and operational zones', 1),
  ('AI + Data Systems', 'LEVERAGE', 'Vrisch Gewagt app, agents, data tracking', 2),
  ('Product Development', 'LEVERAGE', 'Sceletium, tallow, and other health products', 3),
  ('Olive Oil Brand & Sales', 'EXPRESSION', 'DTC olive oil sales via WhatsApp + Instagram', 1),
  ('Content Creation', 'EXPRESSION', 'Instagram journey documentation, brand building', 2),
  ('Doctor''s Wellness Retreat', 'EXPRESSION', 'Retreat development and management', 3);
```

---

## Frontend Structure

```
src/
  components/
    layout/
      Sidebar.tsx
      TopBar.tsx
    dashboard/
      WeeklyDashboard.tsx
      ProjectCard.tsx
      CategorySection.tsx
      CompletionRing.tsx
      MomentumChart.tsx
      PatternAlert.tsx
    projects/
      ProjectList.tsx
      ProjectDetail.tsx
      TaskList.tsx
      TaskItem.tsx
    reviews/
      WeeklyReviewForm.tsx
      WeeklyReviewHistory.tsx
  pages/
    Dashboard.tsx      -- main weekly view
    Projects.tsx       -- all projects by category
    ProjectDetail.tsx  -- single project with tasks
    Reviews.tsx        -- weekly review history
    Insights.tsx       -- patterns + intelligence layer
  lib/
    supabase.ts        -- client init
    queries.ts         -- react-query hooks
    utils.ts
  App.tsx
  main.tsx
```

---

## Dashboard Page (main view)

The weekly dashboard must show:

### Header
- Current week (Mon–Sun)
- Primary project for this week (highlighted)
- Secondary projects (dimmed)

### 3-Column Category View
Each column = FOUNDATION / LEVERAGE / EXPRESSION
Each project card shows:
- Project name
- Active tasks count / total tasks
- Completion ring (% done this week)
- Status badge (active/paused/on-hold)

### Weekly Stats Bar
- Overall completion rate %
- Days logged this week
- Momentum score (avg of daily logs)
- Streak counter (consecutive days logged)

### Patterns Panel
- List of unacknowledged patterns/insights
- Each has a dismiss button

### Recent Activity Feed
- Last 5 log entries, compact

---

## Projects Page

- Grouped by category (FOUNDATION / LEVERAGE / EXPRESSION)
- Each project expandable to show tasks
- Tasks filterable by status
- Add task button per project
- Drag to reorder tasks within a project

---

## Design System

**Color palette:**
- Background: `#0f1117` (near black)
- Surface: `#1a1d27`
- Border: `#2a2d3a`
- Primary: `#4ade80` (green — growth/land)
- Secondary: `#60a5fa` (blue — systems/water)
- Accent: `#f59e0b` (amber — expression/output)
- Text primary: `#f1f5f9`
- Text muted: `#64748b`
- FOUNDATION category: green tint
- LEVERAGE category: blue tint  
- EXPRESSION category: amber tint

**Typography:** Inter (Google Fonts)
**Vibe:** Dark, minimal, operator-grade. Like a mission control dashboard. No gradients, no decorative flourishes. Clean data.

---

## Key Behaviors

1. **No more than 3 critical tasks per day** — enforced in check-in flow
2. **No more than 1 primary project per week** — enforced in weekly review
3. **Foundation overrides all** — when a Foundation project has critical tasks, it auto-promotes to primary
4. **No silent carryover** — any task not completed must be explicitly rescheduled or dropped

---

## What to Build (in order)

1. **Supabase migration files** (`supabase/migrations/001_initial_schema.sql`) with all tables + seed data
2. **Vite + React project** with TailwindCSS v4, React Router, React Query, Recharts
3. **Supabase client** (`src/lib/supabase.ts`) + all query hooks (`src/queries.ts`)
4. **Dashboard page** — full weekly view as described above
5. **Projects page** — all projects grouped by category
6. **Project detail page** — tasks list, add/complete/drop tasks
7. **Weekly review page** — form to submit weekly review + history list
8. **Insights page** — patterns and intelligence alerts

---

## Notes
- Use `.env` for Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- All dates in ISO format, timezone: Africa/Johannesburg (SAST, UTC+2)
- Mobile-responsive (Nicris uses Telegram on mobile, might open dashboard on phone)
- No auth needed for now — single user system

When completely finished, run this command:
openclaw system event --text "Done: myLifeTracker dashboard built — ready for review" --mode now
