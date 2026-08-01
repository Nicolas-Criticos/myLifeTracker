const CATEGORIES = ['FOOD', 'BUSINESS', 'RUNNING COSTS', 'LIFESTYLE'] as const

/**
 * Parse a Tracey expense message like:
 *   "log expense 350 FOOD groceries"
 *   "log expense 1200 RUNNING COSTS petrol for the week"
 *
 * Returns { amount, category, description } or null if unparseable.
 */
export function parseExpenseMessage(text: string): {
  amount: number
  category: string
  description: string
} | null {
  const trimmed = text.trim()

  // Match: log expense <amount> <CATEGORY> <description>
  const pattern = /log\s+expense\s+([\d.]+)\s+(food|business|running\s+costs|lifestyle)\s+(.+)/i
  const match = trimmed.match(pattern)
  if (!match) return null

  const amount = parseFloat(match[1])
  if (isNaN(amount) || amount <= 0) return null

  // Normalize category to uppercase (match DB CHECK constraint)
  const rawCategory = match[2].toUpperCase()
  // Find the canonical category (case-insensitive match)
  const category = CATEGORIES.find(c => c === rawCategory)
  if (!category) return null

  const description = match[3].trim()
  if (!description) return null

  return { amount, category, description }
}
