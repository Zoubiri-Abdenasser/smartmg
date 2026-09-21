import { round } from '../utils/numbers'

/**
 * Suggested order quantity =
 *   (dailyRate * coverageDays) + safetyStock - currentStock - pendingIncoming
 * coverageDays typically = leadTimeDays + buffer (e.g. 3)
 */
export function calcSuggestedOrderQty(params: {
  dailyRate: number
  leadTimeDays: number
  safetyStock: number
  currentStock: number
  pendingIncoming: number
  bufferDays?: number
}): number {
  const {
    dailyRate,
    leadTimeDays,
    safetyStock,
    currentStock,
    pendingIncoming,
    bufferDays = 3,
  } = params

  if (dailyRate <= 0) {
    // If no sales, only reorder if below safety
    const gap = safetyStock - currentStock - pendingIncoming
    return Math.max(0, Math.ceil(gap))
  }

  const coverageDays = leadTimeDays + bufferDays
  const expectedDemand = dailyRate * coverageDays
  const needed = expectedDemand + safetyStock - currentStock - pendingIncoming
  return Math.max(0, Math.ceil(round(needed, 0)))
}
