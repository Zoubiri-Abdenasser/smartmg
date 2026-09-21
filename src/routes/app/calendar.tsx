import { useSuggestedPurchaseItems } from '@/lib/inventory/selectors'
import { useAppStore } from '@/lib/inventory/store'
import { formatDateAr, getWeekdayName, todayISO, addDaysISO } from '@/lib/utils/dates'
import { formatNumber } from '@/lib/utils/numbers'

export function CalendarPage() {
  const suggested = useSuggestedPurchaseItems()
  const suppliers = useAppStore((s) => s.suppliers)
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(todayISO(), i))

  const byDay = days.map((day) => {
    const items = suggested.filter((s) => s.forecast.bestReplenishmentDay === day)
    const bySupplier = items.reduce<Record<string, typeof items>>((acc, item) => {
      const sid = item.product.supplierId
      if (!acc[sid]) acc[sid] = []
      acc[sid].push(item)
      return acc
    }, {})
    return { day, bySupplier, count: items.length }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تقويم التموين</h1>
        <p className="text-sm text-slate-500 mt-1">المنتجات المقترح طلبها مجمّعة حسب اليوم والمورد</p>
      </div>

      {suggested.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          لا توجد طلبات مقترحة في الأيام القادمة
        </div>
      ) : (
        <div className="grid gap-4">
          {byDay.map(({ day, bySupplier, count }) => (
            <div key={day} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-lg">{getWeekdayName(day)}</h2>
                  <p className="text-sm text-slate-500">{formatDateAr(day)}</p>
                </div>
                {count > 0 ? (
                  <span className="badge bg-brand-50 text-brand-700">{count} منتج</span>
                ) : (
                  <span className="text-sm text-slate-400">لا طلبات</span>
                )}
              </div>
              {Object.entries(bySupplier).map(([sid, items]) => {
                const supplier = suppliers.find((s) => s.id === sid)
                return (
                  <div key={sid} className="mt-3 bg-slate-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">📦 {supplier?.name}</p>
                    <ul className="space-y-1.5">
                      {items.map(({ product, forecast }) => (
                        <li key={product.id} className="flex justify-between text-sm">
                          <span>{product.name}</span>
                          <span className="text-slate-500">
                            {formatNumber(forecast.suggestedOrderQty)} {product.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
