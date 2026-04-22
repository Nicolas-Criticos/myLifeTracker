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
    case 'FOUNDATION': return 'text-[#5c7a5c]'
    case 'LEVERAGE': return 'text-[#4a6b8a]'
    case 'EXPRESSION': return 'text-[#8a6a3a]'
  }
}

export function categoryBg(category: Category): string {
  switch (category) {
    case 'FOUNDATION': return 'bg-[rgba(92,122,92,0.08)] border-[rgba(92,122,92,0.2)]'
    case 'LEVERAGE': return 'bg-[rgba(74,107,138,0.08)] border-[rgba(74,107,138,0.2)]'
    case 'EXPRESSION': return 'bg-[rgba(138,106,58,0.08)] border-[rgba(138,106,58,0.2)]'
  }
}

export function categoryBadge(category: Category): string {
  switch (category) {
    case 'FOUNDATION': return 'bg-[rgba(92,122,92,0.12)] text-[#5c7a5c]'
    case 'LEVERAGE': return 'bg-[rgba(74,107,138,0.12)] text-[#4a6b8a]'
    case 'EXPRESSION': return 'bg-[rgba(138,106,58,0.12)] text-[#8a6a3a]'
  }
}

export function categoryAccent(category: Category): string {
  switch (category) {
    case 'FOUNDATION': return '#5c7a5c'
    case 'LEVERAGE': return '#4a6b8a'
    case 'EXPRESSION': return '#8a6a3a'
  }
}

export function statusBadge(status: string): string {
  switch (status) {
    case 'active': return 'bg-[rgba(92,122,92,0.12)] text-[#5c7a5c]'
    case 'paused': return 'bg-[rgba(138,106,58,0.12)] text-[#8a6a3a]'
    case 'completed': return 'bg-[rgba(139,127,109,0.12)] text-[#8a7f6d]'
    case 'pending': return 'bg-[rgba(139,127,109,0.1)] text-[#8a7f6d]'
    case 'in_progress': return 'bg-[rgba(74,107,138,0.12)] text-[#4a6b8a]'
    case 'dropped': return 'bg-[rgba(180,80,80,0.1)] text-[#a05050]'
    case 'rescheduled': return 'bg-[rgba(138,90,138,0.1)] text-[#7a5a7a]'
    default: return 'bg-[rgba(139,127,109,0.1)] text-[#8a7f6d]'
  }
}

export function priorityBadge(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-[rgba(180,60,60,0.12)] text-[#a04040]'
    case 'high': return 'bg-[rgba(180,100,40,0.12)] text-[#8a5a30]'
    case 'normal': return 'bg-[rgba(139,127,109,0.1)] text-[#8a7f6d]'
    case 'low': return 'bg-[rgba(139,127,109,0.07)] text-[#aaa090]'
    default: return 'bg-[rgba(139,127,109,0.1)] text-[#8a7f6d]'
  }
}

export function mondayOfCurrentWeek(): string {
  const { start } = getWeekRange()
  return format(start, 'yyyy-MM-dd')
}
