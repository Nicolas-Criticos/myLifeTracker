// ── BUSINESS UTILITY FUNCTIONS ────────────────────────────────────────────────
import type { CostComponent } from '../../lib/supabase'

export const FULFILLMENT_FEE_PCT = 0.05

export const EXPENSE_CATEGORIES = ['petrol', 'packaging_run', 'labels', 'equipment', 'other']

/** Sum fixed cost_components → COGS per unit */
export function productUnitCogs(components: CostComponent[]): number {
  return components
    .filter(c => (c.cost_type || '').toLowerCase() === 'fixed')
    .reduce((sum, c) => sum + (c.amount ?? 0), 0)
}

/** Per-sale COGS (units × per-unit fixed costs) */
export function saleCogs(units: number, components: CostComponent[]): number {
  return productUnitCogs(components) * units
}
