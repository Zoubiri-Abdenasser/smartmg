import type { Product, ForecastResult } from '../inventory/types'
import { formatNumber } from '../utils/numbers'

export function buildReason(
  product: Product,
  forecast: Pick<
    ForecastResult,
    'dailySalesRate' | 'daysRemaining' | 'suggestedOrderQty' | 'pendingIncoming'
  >
): string {
  const { dailySalesRate, daysRemaining, suggestedOrderQty, pendingIncoming } = forecast

  if (dailySalesRate <= 0) {
    return `لا توجد مبيعات كافية لتقدير الطلب. المخزون الحالي ${formatNumber(product.currentStock)} ${product.unit}.`
  }

  if (suggestedOrderQty <= 0) {
    return `المخزون الحالي كافٍ. معدل البيع ${formatNumber(dailySalesRate, 1)}/${product.unit} يوم، والمخزون يكفي حوالي ${daysRemaining ?? '—'} يوم.`
  }

  const pendingNote =
    pendingIncoming > 0 ? ` (يوجد ${formatNumber(pendingIncoming)} قيد التوريد)` : ''

  return `يُطلب ${formatNumber(suggestedOrderQty)} ${product.unit} ${product.name} — معدل البيع ${formatNumber(dailySalesRate, 1)}/يوم، مدة التوريد ${product.leadTimeDays} يوم، والمخزون الحالي يكفي حوالي ${daysRemaining ?? '—'} يوم${pendingNote}.`
}
