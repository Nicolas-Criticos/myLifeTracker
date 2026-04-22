import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Category = 'FOUNDATION' | 'LEVERAGE' | 'EXPRESSION'
export type ProjectStatus = 'active' | 'paused' | 'completed'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'dropped' | 'rescheduled'
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low'
export type RecommendedAction = 'continue' | 'shift' | 'pause'

export interface Project {
  id: string
  name: string
  category: Category
  description: string | null
  status: ProjectStatus
  priority: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  scheduled_date: string | null
  completed_at: string | null
  dropped_reason: string | null
  created_at: string
}

export interface DailyCheckin {
  id: string
  date: string
  energy_level: number
  focus_level: number
  physical_constraints: string | null
  available_hours: number | null
  intent: string | null
  selected_tasks: string[] | null
  non_negotiable: string | null
  created_at: string
}

export interface DailyLog {
  id: string
  date: string
  checkin_id: string | null
  tasks_completed: string[] | null
  tasks_attempted: string[] | null
  blockers: string | null
  observations: string | null
  momentum_score: number | null
  key_insight: string | null
  created_at: string
}

export interface WeeklyReview {
  id: string
  week_start: string
  primary_project_id: string | null
  secondary_project_ids: string[] | null
  what_completed: string | null
  what_failed: string | null
  energy_trend: string | null
  key_lessons: string | null
  completion_rate: number | null
  momentum_score: number | null
  next_week_focus: string | null
  recommended_action: RecommendedAction | null
  created_at: string
}

export interface Pattern {
  id: string
  detected_at: string
  pattern_type: string
  description: string
  affected_project_id: string | null
  suggestion: string | null
  acknowledged: boolean
}

// ── OLIVE BRAIN / BUSINESS TYPES ─────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  sku: string | null
  sell_price: number
  active: boolean
  created_at: string
}

export interface CostComponent {
  id: string
  product_id: string
  name: string
  cost_type: string
  amount: number | null
  amount_min: number | null
  amount_max: number | null
  applies_to: string | null
  active: boolean
}

export interface Expense {
  id: string
  date: string
  description: string
  amount: number
  cost_component_id: string | null
  product_id: string | null
  category: string | null
  allocation: string | null
  units_covered: number | null
  notes: string | null
}

export interface Sale {
  id: string
  date: string
  product_id: string
  units: number
  sell_price_actual: number
  channel: string | null
  delivery_cost: number | null
  customer_region: string | null
  notes: string | null
}

export interface SystemParam {
  id: string
  key: string
  value: string
  label: string | null
  description: string | null
  updated_at: string
}

// ── COMMUNITY APP TYPES ───────────────────────────────────────────────────────

export interface CommunityProject {
  id: string
  title: string
  description: string | null
  image_url: string | null
  status: string | null
  roles_needed: string[] | null
  timeline: string | null
  created_by: string | null
  created_at: string
  archived: boolean | null
  realm: string | null
  start_date: string | null
  end_date: string | null
}

export interface CommunityTask {
  id: string
  created_at: string
  name: string
  description: string | null
  status: string | null
  project: string
  start_date: string | null
  end_date: string | null
}
