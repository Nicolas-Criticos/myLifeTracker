export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type BusinessType = 'samsara' | 'ebn'

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  created_at?: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  unit_price: number
  business: BusinessType
}

export interface BankDetails {
  id: string
  business: BusinessType
  account_name: string
  bank_name: string
  account_number: string
  branch_code: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id: string | null
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface Invoice {
  id: string
  invoice_number: string
  business: BusinessType
  client_id: string
  status: InvoiceStatus
  issue_date: string
  due_date: string
  delivery_fee: number
  notes: string | null
  created_at: string
  updated_at: string
  client?: Client
  items?: InvoiceItem[]
}

export interface CreateInvoicePayload {
  business: BusinessType
  client_id: string
  issue_date: string
  due_date: string
  delivery_fee: number
  notes?: string
  items: CreateInvoiceItemPayload[]
}

export interface CreateInvoiceItemPayload {
  product_id?: string
  description: string
  quantity: number
  unit_price: number
}
