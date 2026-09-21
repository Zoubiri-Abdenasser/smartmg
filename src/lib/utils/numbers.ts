export function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('ar-DZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
