import type { StockMovement, DemandTrend } from '../inventory/types'
import { getLastNDays } from '../utils/dates'

export function calcDailySalesRate(
  movements: StockMovement[],
  productId: string,
  lookbackDays = 14
): { rate: number; dataPoints: number } {
  const days = getLastNDays(lookbackDays)
  const salesByDay = new Map<string, number>()

  for (const m of movements) {
    if (m.productId !== productId || m.type !== 'sale') continue
    salesByDay.set(m.date, (salesByDay.get(m.date) || 0) + m.quantity)
  }

  // Weighted average: more recent days get higher weight
  let weightedSum = 0
  let weightTotal = 0
  let dataPoints = 0

  days.forEach((day, idx) => {
    const qty = salesByDay.get(day) || 0
    const weight = idx + 1 // linear increasing weight
    weightedSum += qty * weight
    weightTotal += weight
    if (qty > 0) dataPoints++
  })

  const rate = weightTotal > 0 ? weightedSum / weightTotal : 0
  return { rate, dataPoints }
}

export function calcDemandTrend(
  movements: StockMovement[],
  productId: string
): { trend: DemandTrend; changePercent: number } {
  const recent = getLastNDays(7)
  const previous = getLastNDays(14).slice(0, 7)

  const sumPeriod = (days: string[]) => {
    let total = 0
    for (const m of movements) {
      if (m.productId !== productId || m.type !== 'sale') continue
      if (days.includes(m.date)) total += m.quantity
    }
    return total
  }

  const recentTotal = sumPeriod(recent)
  const previousTotal = sumPeriod(previous)

  if (previousTotal === 0 && recentTotal === 0) {
    return { trend: 'stable', changePercent: 0 }
  }
  if (previousTotal === 0) {
    return { trend: 'up', changePercent: 100 }
  }

  const changePercent = Math.round(((recentTotal - previousTotal) / previousTotal) * 100)

  let trend: DemandTrend = 'stable'
  if (changePercent >= 15) trend = 'up'
  else if (changePercent <= -15) trend = 'down'

  return { trend, changePercent }
}
