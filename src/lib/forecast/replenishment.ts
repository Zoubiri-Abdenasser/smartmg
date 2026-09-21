import { addDaysISO, todayISO, getWeekdayName } from '../utils/dates'

/**
 * Best day to place the order so that goods arrive before stockout,
 * accounting for lead time. Prefer grouping by supplier later.
 */
export function calcBestReplenishmentDay(
  daysRemaining: number | null,
  leadTimeDays: number
): string | null {
  if (daysRemaining === null) return null

  // Order so that delivery arrives ~1 day before expected stockout
  const daysUntilOrder = Math.max(0, Math.floor(daysRemaining) - leadTimeDays - 1)
  const orderDate = addDaysISO(todayISO(), daysUntilOrder)
  return orderDate
}

export function getBestDayLabel(date: string | null): string {
  if (!date) return '—'
  return getWeekdayName(date)
}
