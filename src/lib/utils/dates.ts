import { format, addDays, parseISO, differenceInDays, subDays, isSameDay } from 'date-fns'
import { ar } from 'date-fns/locale'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function formatDate(date: string | Date, pattern = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ar })
}

export function formatDateAr(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMMM yyyy', { locale: ar })
}

export function addDaysISO(date: string, days: number): string {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd')
}

export function daysBetween(from: string, to: string): number {
  return differenceInDays(parseISO(to), parseISO(from))
}

export function getWeekdayName(date: string): string {
  return format(parseISO(date), 'EEEE', { locale: ar })
}

export function getLastNDays(n: number, endDate?: string): string[] {
  const end = endDate ? parseISO(endDate) : new Date()
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(format(subDays(end, i), 'yyyy-MM-dd'))
  }
  return days
}

export function isToday(date: string): boolean {
  return isSameDay(parseISO(date), new Date())
}
