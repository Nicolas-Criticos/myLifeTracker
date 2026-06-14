import { describe, it, expect } from 'vitest'
import { productUnitCogs, saleCogs } from '../components/business/businessUtils'
import type { CostComponent } from '../lib/supabase'

const mockComponents: CostComponent[] = [
  {
    id: '1', product_id: 'p1', name: 'Raw Material', cost_type: 'fixed',
    amount: 40, amount_min: null, amount_max: null, applies_to: 'per_unit', active: true,
  },
  {
    id: '2', product_id: 'p1', name: 'Packaging', cost_type: 'fixed',
    amount: 15, amount_min: null, amount_max: null, applies_to: 'per_unit', active: true,
  },
  {
    id: '3', product_id: 'p1', name: 'Delivery pool', cost_type: 'variable',
    amount: 10, amount_min: null, amount_max: null, applies_to: 'per_order', active: true,
  },
]

describe('productUnitCogs', () => {
  it('sums only fixed-type cost components', () => {
    expect(productUnitCogs(mockComponents)).toBe(55)
  })

  it('returns 0 for an empty list', () => {
    expect(productUnitCogs([])).toBe(0)
  })

  it('returns 0 when all components are variable', () => {
    const varOnly = mockComponents.filter(c => c.cost_type === 'variable')
    expect(productUnitCogs(varOnly)).toBe(0)
  })
})

describe('saleCogs', () => {
  it('multiplies unit COGS by quantity', () => {
    expect(saleCogs(3, mockComponents)).toBe(165) // 55 × 3
  })

  it('returns 0 for 0 units', () => {
    expect(saleCogs(0, mockComponents)).toBe(0)
  })
})
