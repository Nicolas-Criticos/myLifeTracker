import { clsx, type ClassValue } from 'clsx'
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval, addDays } from 'date-fns'
import type { Category } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function nowInSAST(): Date {
  // Africa/Johannesburg is UTC+2
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 2 * 3600000)
}

export function toSAST(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  return new Date(utc + 2 * 3600000)
}

export function getWeekRange(date?: Date): { start: Date; end: Date } {
  const base = date ?? nowInSAST()
  const start = startOfWeek(base, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(base, { weekStartsOn: 1 })
  return { start, end }
}

export function formatWeekRange(start: Date, end: Date): string {
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function isThisWeek(dateStr: string): boolean {
  const { start, end } = getWeekRange()
  const d = parseISO(dateStr)
  return isWithinInterval(d, { start, end })
}

export function getWeekDates(weekStart?: Date): Date[] {
  const start = weekStart ?? getWeekRange().start
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function categoryColor(category: Category): string {
  switch (category) {
    case 'FOUNDATION': return 'text-green-400'
    case 'LEVERAGE': return 'text-blue-400'
    case 'EXPRESSION': return 'text-amber-400'
  }
}

export function categoryBg(category: Category): string {
  switch (category) {
    case 'FOUNDATION': return 'bg-green-400/10 border-green-400/20'
    case 'LEVERAGE': return 'bg-blue-400/10 border-blue-400/20'
    case 'EXPRESSION': return 'bg-amber-400/10 border-amber-400/20'
  }
}

export function categoryBadge(category: Category): string {
  switch (category) {
    case 'FOUNDATION': return 'bg-green-400/20 text-green-400'
    case 'LEVERAGE': return 'bg-blue-400/20 text-blue-400'
    case 'EXPRESSION': return 'bg-amber-400/20 text-amber-400'
  }
}

export function categoryAccent(category: Category): string {
  switch (category) {
    case 'FOUNDATION': return '#4ade80'
    case 'LEVERAGE': return '#60a5fa'
    case 'EXPRESSION': return '#f59e0b'
  }
}

export function statusBadge(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-400/20 text-green-400'
    case 'paused': return 'bg-yellow-400/20 text-yellow-400'
    case 'completed': return 'bg-slate-400/20 text-slate-400'
    case 'pending': return 'bg-slate-400/20 text-slate-400'
    case 'in_progress': return 'bg-blue-400/20 text-blue-400'
    case 'dropped': return 'bg-red-400/20 text-red-400'
    case 'rescheduled': return 'bg-purple-400/20 text-purple-400'
    default: return 'bg-slate-400/20 text-slate-400'
  }
}

export function priorityBadge(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-500/20 text-red-400'
    case 'high': return 'bg-orange-400/20 text-orange-400'
    case 'normal': return 'bg-slate-400/20 text-slate-400'
    case 'low': return 'bg-slate-600/20 text-slate-500'
    default: return 'bg-slate-400/20 text-slate-400'
  }
}

export function mondayOfCurrentWeek(): string {
  const { start } = getWeekRange()
  return format(start, 'yyyy-MM-dd')
}
