import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Category = 'FOUNDATION' | 'LEVERAGE' | 'EXPRESSION'
export type ProjectStatus = 'active' | 'paused' | 'completed'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'dropped' | 'rescheduled'
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low'
export type TaskRecurrence = 'daily' | 'weekdays'
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
  recurrence: TaskRecurrence | null
  reminder_at: string | null
  todo_id: string | null
  created_at: string
}

export interface DailyCheckin {
  id: string
  date: string
  wake_time: string | null
  morning_routine: string | null
  reflection: string | null
  whats_weighing: string | null
  whats_light: string | null
  energy_level: number
  focus_level: number
  peace_level: number | null
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
  what_happened: string | null
  evening_reflection: string | null
  tasks_completed: string[] | null
  tasks_attempted: string[] | null
  blockers: string | null
  observations: string | null
  momentum_score: number | null
  peace_level: number | null
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
  business: string | null
  description: string | null
  unit: string | null
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

// ── OLIVE REHAB TYPES ─────────────────────────────────────────────────────────

export type IrrigationStatus = 'active' | 'restored' | 'broken' | 'unknown'
export type ActivityType =
  | 'nutrient_feed' | 'foliar_spray' | 'irrigation'
  | 'pruning_light' | 'pruning_major' | 'soil_correction'
  | 'spring_activation' | 'other'
export type PlanStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'overdue'
export type MilestoneStatus = 'pending' | 'achieved' | 'missed'
export type HealthTrend = 'improving' | 'stable' | 'declining'

export interface RehabBlock {
  id: string
  name: string
  tree_count: number
  irrigation_status: IrrigationStatus
  health_rating: number
  soil_type: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export interface RehabPlan {
  id: string
  block_id: string | null
  activity_type: ActivityType
  title: string
  description: string | null
  scheduled_month: string | null
  scheduled_date: string | null
  products: string | null
  status: PlanStatus
  priority: 'critical' | 'high' | 'normal' | 'low'
  created_at: string
  updated_at: string
}

export interface RehabLog {
  id: string
  date: string
  block_id: string | null
  plan_id: string | null
  activity_type: ActivityType
  title: string
  description: string | null
  observations: string | null
  trees_affected: number | null
  labour_count: number
  labour_hours: number | null
  products_used: string | null
  weather_conditions: string | null
  photos: string[] | null
  created_at: string
}

export interface RehabMilestone {
  id: string
  title: string
  description: string | null
  target_date: string | null
  completed_date: string | null
  status: MilestoneStatus
  block_id: string | null
  created_at: string
}

export interface RehabWeeklySummary {
  id: string
  week_start: string
  summary: string | null
  blocks_worked: string[] | null
  total_trees_serviced: number
  total_labour_hours: number
  activities_completed: number
  activities_planned: number
  key_observations: string | null
  health_trend: HealthTrend | null
  created_at: string
}

export interface Dream {
  id: string
  date: string
  title: string | null
  narrative: string
  symbols: string[]
  emotions: string[]
  clarity: number
  lucid: boolean
  recurring: boolean
  tags: string[]
  created_at: string
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

// ── DREAM TRACKER ─────────────────────────────────────────────────────────────

export interface Dream {
  id: string
  date: string
  title: string | null
  narrative: string
  symbols: string[]
  emotions: string[]
  clarity: number
  lucid: boolean
  recurring: boolean
  tags: string[]
  created_at: string
}

// ── FINANCIAL TRACKER ─────────────────────────────────────────────────────────

export interface FinAccount {
  id: string
  name: string
  type: 'personal' | 'business' | 'investment'
  color: string
  active: boolean
  created_at: string
}

export interface FinMonthlyEntry {
  id: string
  account_id: string
  month: string // YYYY-MM
  amount_zar: number
  notes: string | null
  created_at: string
}
