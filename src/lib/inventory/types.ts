export type MovementType = 'sale' | 'purchase' | 'adjustment'
export type PurchaseStatus = 'draft' | 'approved' | 'received' | 'cancelled'
export type StockStatus = 'safe' | 'warning' | 'critical'
export type DemandTrend = 'up' | 'down' | 'stable'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface Product {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  safetyStock: number
  costPrice: number
  supplierId: string
  leadTimeDays: number
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  leadTimeDays: number
  phone?: string
  notes?: string
  createdAt: string
}

export interface StockMovement {
  id: string
  productId: string
  type: MovementType
  quantity: number
  date: string
  note?: string
  createdAt: string
}

export interface PurchaseOrderItem {
  productId: string
  quantity: number
  estimatedCost: number
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  status: PurchaseStatus
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
  note?: string
}

export interface ForecastResult {
  productId: string
  currentStock: number
  dailySalesRate: number
  stockoutDate: string | null
  daysRemaining: number | null
  demandTrend: DemandTrend
  demandChangePercent: number
  suggestedOrderQty: number
  bestReplenishmentDay: string | null
  confidence: ConfidenceLevel
  confidenceLabel: string
  reason: string
  pendingIncoming: number
}
