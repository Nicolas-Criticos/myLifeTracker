import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { supabase } from './supabase'
import type {
  RehabBlock, RehabPlan, RehabLog, RehabMilestone, RehabWeeklySummary,
  ActivityType,
} from './supabase'
import { nowInSAST } from './utils'

// ── STATIC LOOKUPS ────────────────────────────────────────────────────────────

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  nutrient_feed:     'Nutrient Feed',
  foliar_spray:      'Foliar Spray',
  irrigation:        'Irrigation',
  pruning_light:     'Light Pruning',
  pruning_major:     'Major Pruning',
  soil_correction:   'Soil Correction',
  spring_activation: 'Spring Activation',
  other:             'Other',
}

export type HealthState = 'dying' | 'struggling' | 'recovering' | 'healthy' | 'thriving'

export function healthStateFromScore(score: number): HealthState {
  if (score <= 2) return 'dying'
  if (score <= 4) return 'struggling'
  if (score <= 6) return 'recovering'
  if (score <= 8) return 'healthy'
  return 'thriving'
}

// ── BLOCKS ────────────────────────────────────────────────────────────────────

export function useRehabBlocks() {
  return useQuery({
    queryKey: ['rehab_blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_blocks')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as RehabBlock[]
    },
  })
}

export function useUpdateRehabBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RehabBlock> & { id: string }) => {
      const { data, error } = await supabase
        .from('rehab_blocks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RehabBlock
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_blocks'] })
    },
  })
}

// ── PLAN ──────────────────────────────────────────────────────────────────────

export function useRehabPlan(month?: string) {
  return useQuery({
    queryKey: ['rehab_plan', month],
    queryFn: async () => {
      let q = supabase
        .from('rehab_plan')
        .select('*')
        .order('scheduled_month', { ascending: true })
      if (month) q = q.eq('scheduled_month', month)
      const { data, error } = await q
      if (error) throw error
      return data as RehabPlan[]
    },
  })
}

export function useCurrentMonthPlan() {
  const now = nowInSAST()
  const month = format(now, 'yyyy-MM')
  return useRehabPlan(month)
}

export function useUpdateRehabPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RehabPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('rehab_plan')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RehabPlan
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_plan'] })
    },
  })
}

// ── LOGS ──────────────────────────────────────────────────────────────────────

export function useRehabLogs(limit = 50) {
  return useQuery({
    queryKey: ['rehab_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as RehabLog[]
    },
  })
}

export function useRehabLogsForBlock(blockId: string) {
  return useQuery({
    queryKey: ['rehab_logs', 'block', blockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_logs')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: false })
      if (error) throw error
      return data as RehabLog[]
    },
    enabled: !!blockId,
  })
}

export function useRecentRehabLogs(days = 14) {
  const now = nowInSAST()
  const since = format(subDays(now, days), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['rehab_logs', 'recent', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_logs')
        .select('*')
        .gte('date', since)
        .order('date', { ascending: false })
      if (error) throw error
      return data as RehabLog[]
    },
  })
}

export function useCreateRehabLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (log: Omit<RehabLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('rehab_logs')
        .insert(log)
        .select()
        .single()
      if (error) throw error
      return data as RehabLog
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_logs'] })
    },
  })
}

// ── BLOCK LIFETIME MILESTONES (9-task rehab journey) ────────────────────────

export function useAllBlockMilestones() {
  return useQuery({
    queryKey: ['rehab_block_milestones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_block_milestones')
        .select('*')
        .order('task_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useBlockMilestones(blockId: string) {
  return useQuery({
    queryKey: ['rehab_block_milestones', blockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_block_milestones')
        .select('*')
        .eq('block_id', blockId)
        .order('task_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!blockId,
  })
}

export function useToggleBlockMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('rehab_block_milestones')
        .update({
          completed,
          completed_date: completed ? format(new Date(), 'yyyy-MM-dd') : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_block_milestones'] })
    },
  })
}

// ── PLAN MILESTONES ───────────────────────────────────────────────────────────

export function useRehabMilestones() {
  return useQuery({
    queryKey: ['rehab_milestones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_milestones')
        .select('*')
        .order('target_date', { ascending: true })
      if (error) throw error
      return data as RehabMilestone[]
    },
  })
}

export function useUpdateRehabMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RehabMilestone> & { id: string }) => {
      const { data, error } = await supabase
        .from('rehab_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RehabMilestone
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_milestones'] })
    },
  })
}

// ── WEEKLY SUMMARIES ──────────────────────────────────────────────────────────

export function useRehabWeeklySummaries() {
  return useQuery({
    queryKey: ['rehab_weekly_summaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_weekly_summaries')
        .select('*')
        .order('week_start', { ascending: false })
      if (error) throw error
      return data as RehabWeeklySummary[]
    },
  })
}

// ── HEALTH SCORE ──────────────────────────────────────────────────────────────

export function useTreeHealthScore(totalBlocks = 10) {
  const { data: recentLogs = [] } = useRecentRehabLogs(14)

  const activeDays = new Set(recentLogs.map(l => l.date)).size
  const uniqueActivities = new Set(recentLogs.map(l => l.activity_type)).size
  const blocksCovered = new Set(recentLogs.filter(l => l.block_id).map(l => l.block_id)).size

  if (recentLogs.length === 0) return 1

  const score =
    (activeDays / 14) * 5 +
    (Math.min(uniqueActivities, 5) / 5) * 3 +
    (blocksCovered / totalBlocks) * 2

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10))
}

// ── BLOCK MONTHLY TASKS (checklist) ─────────────────────────────────────────

export function useAllBlockTasksForMonth(month: string) {
  return useQuery({
    queryKey: ['rehab_block_tasks', month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_block_deliverables')
        .select('*')
        .like('notes', `${month}|%`)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useBlockTasksForMonth(blockId: string, month: string) {
  return useQuery({
    queryKey: ['rehab_block_tasks', blockId, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_block_deliverables')
        .select('*')
        .eq('block_id', blockId)
        .like('notes', `${month}|%`)
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!blockId,
  })
}

// ── BLOCK PROGRESS ────────────────────────────────────────────────────────────

export function useBlockProgress(blockId: string) {
  const { data: logs = [] } = useRehabLogsForBlock(blockId)
  const { data: allPlan = [] } = useRehabPlan()

  const blockPlan = allPlan.filter(p => !p.block_id || p.block_id === blockId)
  const completedActivities = new Set(logs.map(l => l.activity_type))
  const plannedActivities = blockPlan.map(p => p.activity_type)

  return {
    logs,
    plan: blockPlan,
    completed: completedActivities,
    totalPlanned: plannedActivities.length,
    completedCount: plannedActivities.filter(a => completedActivities.has(a)).length,
  }
}

// ── SEASON PHASE ──────────────────────────────────────────────────────────────

export function useCurrentSeasonPhase() {
  const now = nowInSAST()
  const month = now.getMonth() + 1 // 1-indexed

  if (month >= 4 && month <= 5) return { phase: 'Recovery', months: 'April–May', objective: 'Restore reserves, reduce stress' }
  if (month === 6) return { phase: 'Dormancy Prep', months: 'June', objective: 'Harden trees, soil correction' }
  if (month >= 7 && month <= 8) return { phase: 'Dormancy Work', months: 'July–August', objective: 'Major pruning & structure' }
  if (month === 9) return { phase: 'Spring Prep', months: 'September', objective: 'Activate growth & feeding' }
  if (month >= 10 && month <= 12) return { phase: 'Growing Season', months: 'Oct–Dec', objective: 'Monitor growth & fruiting' }
  return { phase: 'Off-Season', months: 'Jan–Mar', objective: 'Planning & preparation' }
}
