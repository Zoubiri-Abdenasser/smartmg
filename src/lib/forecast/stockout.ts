import { addDaysISO, todayISO } from '../utils/dates'
import { round } from '../utils/numbers'

export function calcDaysOfCover(currentStock: number, dailyRate: number): number | null {
  if (dailyRate <= 0) return null
  return round(currentStock / dailyRate, 1)
}

export function calcStockoutDate(currentStock: number, dailyRate: number): string | null {
  const days = calcDaysOfCover(currentStock, dailyRate)
  if (days === null) return null
  return addDaysISO(todayISO(), Math.floor(days))
}
