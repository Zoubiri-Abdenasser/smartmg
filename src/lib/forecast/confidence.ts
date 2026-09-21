import type { ConfidenceLevel } from '../inventory/types'

export function getConfidence(dataPoints: number): {
  level: ConfidenceLevel
  label: string
} {
  if (dataPoints >= 10) {
    return { level: 'high', label: 'ثقة جيدة' }
  }
  if (dataPoints >= 5) {
    return { level: 'medium', label: 'ثقة متوسطة' }
  }
  return { level: 'low', label: 'تقدير أولي – بيانات محدودة' }
}
