import { useMemo } from 'react'
import { useAppStore } from './store'
import { forecastAll, getStockStatus, isSlowMoving } from '../forecast/forecast'
import type { ForecastResult, Product, StockStatus, StockMovement } from './types'
import { formatCurrency } from '../utils/numbers'

export function useActiveProducts(): Product[] {
  const products = useAppStore((s) => s.products)
  return useMemo(() => products.filter((p) => !p.archived), [products])
}

export function useForecasts(): ForecastResult[] {
  const products = useAppStore((s) => s.products)
  const movements = useAppStore((s) => s.movements)
  const purchaseOrders = useAppStore((s) => s.purchaseOrders)
  return useMemo(
    () => forecastAll(products, movements, purchaseOrders),
    [products, movements, purchaseOrders]
  )
}

export function useCriticalProducts() {
  const products = useActiveProducts()
  const forecasts = useForecasts()
  return useMemo(
    () =>
      products
        .map((p) => {
          const f = forecasts.find((x) => x.productId === p.id)!
          if (!f) return null
          const status = getStockStatus(p, f.dailySalesRate)
          return { product: p, forecast: f, status }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null && x.status === 'critical'),
    [products, forecasts]
  )
}

export function useWarningProducts() {
  const products = useActiveProducts()
  const forecasts = useForecasts()
  return useMemo(
    () =>
      products
        .map((p) => {
          const f = forecasts.find((x) => x.productId === p.id)!
          if (!f) return null
          const status = getStockStatus(p, f.dailySalesRate)
          return { product: p, forecast: f, status }
        })
        .filter(
          (x): x is NonNullable<typeof x> =>
            x !== null &&
            (x.status === 'warning' ||
              (x.forecast.daysRemaining !== null && x.forecast.daysRemaining <= 7))
        ),
    [products, forecasts]
  )
}

export function useInventoryValue(): number {
  const products = useActiveProducts()
  return useMemo(
    () => products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0),
    [products]
  )
}

export function useSlowMoving() {
  const products = useActiveProducts()
  const movements = useAppStore((s) => s.movements)
  return useMemo(
    () =>
      products
        .filter((p) => isSlowMoving(p, movements))
        .map((p) => ({
          product: p,
          value: p.currentStock * p.costPrice,
          valueFormatted: formatCurrency(p.currentStock * p.costPrice),
        })),
    [products, movements]
  )
}

export function useDemandAlerts() {
  const forecasts = useForecasts()
  const products = useActiveProducts()
  return useMemo(
    () =>
      forecasts
        .filter((f) => f.demandTrend === 'up' && f.demandChangePercent >= 20)
        .map((f) => ({
          forecast: f,
          product: products.find((p) => p.id === f.productId)!,
        }))
        .filter((x) => x.product),
    [forecasts, products]
  )
}

export function useSuggestedPurchaseItems() {
  const forecasts = useForecasts()
  const products = useActiveProducts()
  const suppliers = useAppStore((s) => s.suppliers)

  return useMemo(
    () =>
      forecasts
        .filter((f) => f.suggestedOrderQty > 0)
        .map((f) => {
          const product = products.find((p) => p.id === f.productId)!
          const supplier = suppliers.find((s) => s.id === product?.supplierId)
          return {
            product,
            forecast: f,
            supplier,
            estimatedCost: f.suggestedOrderQty * (product?.costPrice ?? 0),
          }
        })
        .filter((x) => x.product),
    [forecasts, products, suppliers]
  )
}

export function useStockStatusMap(): Record<string, StockStatus> {
  const products = useActiveProducts()
  const forecasts = useForecasts()
  return useMemo(() => {
    const map: Record<string, StockStatus> = {}
    for (const p of products) {
      const f = forecasts.find((x) => x.productId === p.id)
      map[p.id] = getStockStatus(p, f?.dailySalesRate ?? 0)
    }
    return map
  }, [products, forecasts])
}

export function useProductMovements(productId: string): StockMovement[] {
  const movements = useAppStore((s) => s.movements)
  return useMemo(
    () =>
      movements
        .filter((m) => m.productId === productId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [movements, productId]
  )
}

export function useRecentMovements(limit = 30): StockMovement[] {
  const movements = useAppStore((s) => s.movements)
  return useMemo(
    () =>
      [...movements]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    [movements, limit]
  )
}
