import type {
  Product,
  StockMovement,
  PurchaseOrder,
  ForecastResult,
  StockStatus,
} from '../inventory/types'
import { calcDailySalesRate, calcDemandTrend } from './demand'
import { calcDaysOfCover, calcStockoutDate } from './stockout'
import { calcSuggestedOrderQty } from './reorder'
import { getConfidence } from './confidence'
import { buildReason } from './explanations'
import { calcBestReplenishmentDay } from './replenishment'

export function getPendingIncoming(
  productId: string,
  purchaseOrders: PurchaseOrder[]
): number {
  let total = 0
  for (const po of purchaseOrders) {
    if (po.status !== 'approved') continue
    for (const item of po.items) {
      if (item.productId === productId) total += item.quantity
    }
  }
  return total
}

export function forecastProduct(
  product: Product,
  movements: StockMovement[],
  purchaseOrders: PurchaseOrder[]
): ForecastResult {
  const { rate, dataPoints } = calcDailySalesRate(movements, product.id)
  const { trend, changePercent } = calcDemandTrend(movements, product.id)
  const pendingIncoming = getPendingIncoming(product.id, purchaseOrders)
  const daysRemaining = calcDaysOfCover(product.currentStock, rate)
  const stockoutDate = calcStockoutDate(product.currentStock, rate)
  const suggestedOrderQty = calcSuggestedOrderQty({
    dailyRate: rate,
    leadTimeDays: product.leadTimeDays,
    safetyStock: product.safetyStock,
    currentStock: product.currentStock,
    pendingIncoming,
  })
  const bestReplenishmentDay = calcBestReplenishmentDay(daysRemaining, product.leadTimeDays)
  const { level, label } = getConfidence(dataPoints)

  const base: ForecastResult = {
    productId: product.id,
    currentStock: product.currentStock,
    dailySalesRate: rate,
    stockoutDate,
    daysRemaining,
    demandTrend: trend,
    demandChangePercent: changePercent,
    suggestedOrderQty,
    bestReplenishmentDay,
    confidence: level,
    confidenceLabel: label,
    reason: '',
    pendingIncoming,
  }

  base.reason = buildReason(product, base)
  return base
}

export function forecastAll(
  products: Product[],
  movements: StockMovement[],
  purchaseOrders: PurchaseOrder[]
): ForecastResult[] {
  return products
    .filter((p) => !p.archived)
    .map((p) => forecastProduct(p, movements, purchaseOrders))
}

export function getStockStatus(product: Product, dailyRate: number): StockStatus {
  if (dailyRate <= 0) {
    if (product.currentStock <= product.safetyStock * 0.5) return 'critical'
    if (product.currentStock <= product.safetyStock) return 'warning'
    return 'safe'
  }

  const days = product.currentStock / dailyRate
  if (days <= product.leadTimeDays || product.currentStock <= product.safetyStock * 0.5) {
    return 'critical'
  }
  if (days <= product.leadTimeDays + 3 || product.currentStock <= product.safetyStock) {
    return 'warning'
  }
  return 'safe'
}

export function isSlowMoving(
  product: Product,
  movements: StockMovement[],
  daysThreshold = 14
): boolean {
  const { rate } = calcDailySalesRate(movements, product.id, daysThreshold)
  return rate < 0.3 && product.currentStock > 0
}
