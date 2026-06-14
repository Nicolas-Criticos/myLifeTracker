// ── BUSINESS PAGE — Orchestrator ──────────────────────────────────────────────
// Visual sections live in src/components/business/
// This file owns all data fetching, state, and derived metrics.

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  useBusinessProducts, useBusinessCostComponents, useSalesData, useExpenses,
  useCreateSale, useCreateExpense, useUpdateProduct,
} from '../lib/queries'
import type { Product } from '../lib/supabase'
import { saleCogs, FULFILLMENT_FEE_PCT } from '../components/business/businessUtils'
import { ProductModal } from '../components/business/ProductModal'
import { ProductsSection } from '../components/business/ProductsSection'
import { SalesSection, type SaleFormState } from '../components/business/SalesSection'
import { SummarySection } from '../components/business/SummarySection'
import { ExpensesSection, type ExpenseFormState } from '../components/business/ExpensesSection'

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function Business() {
  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: products = [] } = useBusinessProducts()
  const { data: costComponents = [] } = useBusinessCostComponents()
  const { data: sales = [], isLoading: loadingSales } = useSalesData(30)
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(30)
  const createSale = useCreateSale()
  const createExpense = useCreateExpense()
  const updateProduct = useUpdateProduct()

  // ── Product modal state ──────────────────────────────────────────────────────
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)

  // ── Derived: components by product ──────────────────────────────────────────
  const componentsByProduct = useMemo(() => {
    const map: Record<string, typeof costComponents> = {}
    for (const c of costComponents) {
      if (!map[c.product_id]) map[c.product_id] = []
      map[c.product_id].push(c)
    }
    return map
  }, [costComponents])

  // ── Product actions ──────────────────────────────────────────────────────────
  function openCreate() {
    setEditingProduct(null)
    setShowModal(true)
  }
  function openEdit(p: Product) {
    setEditingProduct(p)
    setShowModal(true)
  }
  async function handleDelete(p: Product) {
    if (!confirm(`Deactivate "${p.name}"? It will be hidden from the catalogue.`)) return
    await updateProduct.mutateAsync({ id: p.id, active: false })
  }

  // ── Sale form state ──────────────────────────────────────────────────────────
  const [saleForm, setSaleForm] = useState<SaleFormState>({
    date: format(new Date(), 'yyyy-MM-dd'),
    product_id: '',
    units: '',
    sell_price_actual: '',
    fulfillment: false,
    delivery_cost: '',
    notes: '',
  })
  const [submittingSale, setSubmittingSale] = useState(false)
  const [saleDone, setSaleDone] = useState(false)

  function onPickProduct(id: string) {
    const product = products.find(p => p.id === id)
    setSaleForm(f => ({
      ...f,
      product_id: id,
      sell_price_actual: product ? String(product.sell_price) : f.sell_price_actual,
    }))
  }

  // ── Sale derived values ──────────────────────────────────────────────────────
  const saleUnitsNum = Number(saleForm.units) || 0
  const salePriceNum = Number(saleForm.sell_price_actual) || 0
  const saleDeliveryNum = Number(saleForm.delivery_cost) || 0
  const saleRevenue = saleUnitsNum * salePriceNum
  const saleComponents = saleForm.product_id ? componentsByProduct[saleForm.product_id] ?? [] : []
  const saleCogsTotal = saleCogs(saleUnitsNum, saleComponents)
  const saleFulfillFee = saleForm.fulfillment ? saleRevenue * FULFILLMENT_FEE_PCT : 0
  const saleProfit = saleRevenue - saleCogsTotal - saleFulfillFee - saleDeliveryNum

  async function handleSubmitSale(e: React.FormEvent) {
    e.preventDefault()
    if (!saleForm.product_id || !saleForm.units) return
    setSubmittingSale(true)
    try {
      await createSale.mutateAsync({
        date: saleForm.date,
        product_id: saleForm.product_id,
        units: Number(saleForm.units),
        sell_price_actual: Number(saleForm.sell_price_actual) || 0,
        channel: saleForm.fulfillment ? 'fulfillment' : 'direct',
        delivery_cost: saleForm.delivery_cost ? Number(saleForm.delivery_cost) : null,
        customer_region: null,
        notes: saleForm.notes || null,
      })
      setSaleForm(f => ({
        ...f, units: '', sell_price_actual: '', delivery_cost: '', notes: '',
        fulfillment: false, product_id: '',
      }))
      setSaleDone(true)
      setTimeout(() => setSaleDone(false), 2500)
    } finally {
      setSubmittingSale(false)
    }
  }

  // ── Expense form state ───────────────────────────────────────────────────────
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    category: 'petrol',
    notes: '',
  })
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [expenseDone, setExpenseDone] = useState(false)

  async function handleSubmitExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseForm.description || !expenseForm.amount) return
    setSubmittingExpense(true)
    try {
      await createExpense.mutateAsync({
        date: expenseForm.date,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        product_id: null,
        cost_component_id: null,
        allocation: null,
        units_covered: null,
        notes: expenseForm.notes || null,
      })
      setExpenseForm(f => ({ ...f, description: '', amount: '', notes: '' }))
      setExpenseDone(true)
      setTimeout(() => setExpenseDone(false), 2500)
    } finally {
      setSubmittingExpense(false)
    }
  }

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const enrichedSales = useMemo(() => {
    return sales.map(sale => {
      const components = componentsByProduct[sale.product_id] ?? []
      const units = sale.units
      const sellPriceActual = sale.sell_price_actual
      const deliveryCost = sale.delivery_cost ?? 0
      const revenue = units * sellPriceActual
      const cogs = saleCogs(units, components)
      const fulfillmentFee = sale.channel === 'fulfillment' ? revenue * FULFILLMENT_FEE_PCT : 0
      const profit = revenue - cogs - fulfillmentFee - deliveryCost
      const product = products.find(p => p.id === sale.product_id)
      return { sale, product, revenue, cogs, fulfillmentFee, deliveryCost, profit }
    })
  }, [sales, componentsByProduct, products])

  const totalTurnover = enrichedSales.reduce((s, x) => s + x.revenue, 0)
  const totalCogs = enrichedSales.reduce((s, x) => s + x.cogs, 0)
  const totalFulfillment = enrichedSales.reduce((s, x) => s + x.fulfillmentFee, 0)
  const totalDelivery = enrichedSales.reduce((s, x) => s + x.deliveryCost, 0)
  const grossProfit = totalTurnover - totalCogs - totalFulfillment - totalDelivery
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = grossProfit - totalExpenses

  const salesChartData = useMemo(() => {
    const byDate: Record<string, number> = {}
    enrichedSales.forEach(x => {
      byDate[x.sale.date] = (byDate[x.sale.date] ?? 0) + x.revenue
    })
    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({
        date: format(parseISO(date), 'MMM d'),
        revenue: Math.round(revenue),
      }))
  }, [enrichedSales])

  const loading = loadingSales || loadingExpenses

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <svg width="56" height="56" fill="none" viewBox="0 0 56 56" style={{ marginBottom: '16px' }}>
          <circle cx="28" cy="28" r="27" stroke="rgba(107,92,138,0.1)"  strokeWidth="1" />
          <circle cx="28" cy="28" r="20" stroke="rgba(107,92,138,0.18)" strokeWidth="1" />
          <circle cx="28" cy="28" r="12" stroke="rgba(107,92,138,0.28)" strokeWidth="1" />
          <circle cx="28" cy="28" r="4"  fill="rgba(107,92,138,0.45)" />
        </svg>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.6rem',
          color: 'var(--ink)', letterSpacing: '0.04em', marginBottom: '4px',
        }}>Business</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Catalogue · Sales · Costs
        </p>
      </div>

      {/* Invoices shortcut */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Link
          to="/invoices"
          style={{
            fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 400,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)',
            textDecoration: 'none', borderBottom: '1px solid var(--border)', paddingBottom: '2px',
          }}
        >
          View invoices →
        </Link>
      </div>

      {/* ── Section 1: Products catalogue ── */}
      <ProductsSection
        products={products}
        componentsByProduct={componentsByProduct}
        onCreateClick={openCreate}
        onEditClick={openEdit}
        onDeleteClick={handleDelete}
      />

      {/* ── Section 2: Log a sale ── */}
      <SalesSection
        products={products}
        componentsByProduct={componentsByProduct}
        saleForm={saleForm}
        setSaleForm={setSaleForm}
        submittingSale={submittingSale}
        saleDone={saleDone}
        onPickProduct={onPickProduct}
        onSubmit={handleSubmitSale}
        saleRevenue={saleRevenue}
        saleCogsTotal={saleCogsTotal}
        saleFulfillFee={saleFulfillFee}
        saleDeliveryNum={saleDeliveryNum}
        saleProfit={saleProfit}
      />

      {/* ── Section 3: 30-day summary ── */}
      <SummarySection
        loading={loading}
        sales={sales}
        expenses={expenses}
        enrichedSales={enrichedSales}
        salesChartData={salesChartData}
        totalTurnover={totalTurnover}
        grossProfit={grossProfit}
        totalExpenses={totalExpenses}
        netProfit={netProfit}
      />

      {/* ── Section 4: Unforeseen expenses ── */}
      <ExpensesSection
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        submittingExpense={submittingExpense}
        expenseDone={expenseDone}
        onSubmit={handleSubmitExpense}
        expenses={expenses}
      />

      {/* ── Product modal (create/edit) ── */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          components={costComponents}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
