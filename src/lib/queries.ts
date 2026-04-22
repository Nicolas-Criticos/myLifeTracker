import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from './supabase'
import type {
  Project, Task, DailyCheckin, DailyLog, WeeklyReview, Pattern,
  Product, Expense, Sale, CommunityProject, CommunityTask,
} from './supabase'
import { getWeekRange, mondayOfCurrentWeek } from './utils'

// ── PROJECTS ──────────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_projects')
        .select('*')
        .order('priority', { ascending: true })
      if (error) throw error
      return data as Project[]
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_projects')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('ops_projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ── TASKS ─────────────────────────────────────────────────────────────────────

export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      let q = supabase.from('ops_tasks').select('*').order('created_at', { ascending: true })
      if (projectId) q = q.eq('project_id', projectId)
      const { data, error } = await q
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useThisWeekTasks() {
  const { start, end } = getWeekRange()
  const startStr = format(start, 'yyyy-MM-dd')
  const endStr = format(end, 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['tasks', 'week', startStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_tasks')
        .select('*')
        .gte('scheduled_date', startStr)
        .lte('scheduled_date', endStr)
        .order('priority', { ascending: true })
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ops_tasks')
        .insert(task)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('ops_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ops_tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ── DAILY CHECKINS ────────────────────────────────────────────────────────────

export function useDailyCheckins(limit = 7) {
  return useQuery({
    queryKey: ['daily_checkins', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_daily_checkins')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as DailyCheckin[]
    },
  })
}

// ── DAILY LOGS ────────────────────────────────────────────────────────────────

export function useDailyLogs(limit = 7) {
  return useQuery({
    queryKey: ['daily_logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_daily_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as DailyLog[]
    },
  })
}

export function useThisWeekLogs() {
  const { start, end } = getWeekRange()
  const startStr = format(start, 'yyyy-MM-dd')
  const endStr = format(end, 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['daily_logs', 'week', startStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_daily_logs')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true })
      if (error) throw error
      return data as DailyLog[]
    },
  })
}

export function useCreateDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (log: Omit<DailyLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ops_daily_logs')
        .insert(log)
        .select()
        .single()
      if (error) throw error
      return data as DailyLog
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_logs'] })
    },
  })
}

// ── WEEKLY REVIEWS ────────────────────────────────────────────────────────────

export function useWeeklyReviews() {
  return useQuery({
    queryKey: ['weekly_reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_weekly_reviews')
        .select('*')
        .order('week_start', { ascending: false })
      if (error) throw error
      return data as WeeklyReview[]
    },
  })
}

export function useCurrentWeekReview() {
  const weekStart = mondayOfCurrentWeek()
  return useQuery({
    queryKey: ['weekly_reviews', weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_weekly_reviews')
        .select('*')
        .eq('week_start', weekStart)
        .maybeSingle()
      if (error) throw error
      return data as WeeklyReview | null
    },
  })
}

export function useCreateWeeklyReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (review: Omit<WeeklyReview, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('ops_weekly_reviews')
        .insert(review)
        .select()
        .single()
      if (error) throw error
      return data as WeeklyReview
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly_reviews'] })
    },
  })
}

export function useUpdateWeeklyReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WeeklyReview> & { id: string }) => {
      const { data, error } = await supabase
        .from('ops_weekly_reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as WeeklyReview
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly_reviews'] })
    },
  })
}

// ── PATTERNS ──────────────────────────────────────────────────────────────────

export function usePatterns(onlyUnacknowledged = false) {
  return useQuery({
    queryKey: ['patterns', onlyUnacknowledged],
    queryFn: async () => {
      let q = supabase
        .from('ops_patterns')
        .select('*')
        .order('detected_at', { ascending: false })
      if (onlyUnacknowledged) q = q.eq('acknowledged', false)
      const { data, error } = await q
      if (error) throw error
      return data as Pattern[]
    },
  })
}

export function useAcknowledgePattern() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ops_patterns')
        .update({ acknowledged: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}

// ── BUSINESS / OLIVE BRAIN ────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })
      if (error) throw error
      return data as Product[]
    },
  })
}

export function useSalesData(days = 30) {
  return useQuery({
    queryKey: ['sales', days],
    queryFn: async () => {
      const since = format(new Date(Date.now() - days * 86400000), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('date', since)
        .order('date', { ascending: true })
      if (error) throw error
      return data as Sale[]
    },
  })
}

export function useExpenses(days = 30) {
  return useQuery({
    queryKey: ['expenses', days],
    queryFn: async () => {
      const since = format(new Date(Date.now() - days * 86400000), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', since)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
  })
}

export function useCreateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sale: Omit<Sale, 'id'>) => {
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single()
      if (error) throw error
      return data as Sale
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

// ── COMMUNITY PROJECTS ────────────────────────────────────────────────────────

export function useCommunityProjects(realm: string) {
  return useQuery({
    queryKey: ['community_projects', realm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('realm', realm)
        .eq('archived', false)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CommunityProject[]
    },
    enabled: !!realm,
  })
}

export function useCommunityProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['community_tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project', projectId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CommunityTask[]
    },
    enabled: !!projectId,
  })
}
