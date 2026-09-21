import { useMemo } from 'react'
import { useForecasts, useActiveProducts } from '@/lib/inventory/selectors'
import { useAppStore } from '@/lib/inventory/store'
import { formatNumber } from '@/lib/utils/numbers'
import { formatDateAr, getLastNDays } from '@/lib/utils/dates'
import { getBestDayLabel } from '@/lib/forecast/replenishment'
import { cn } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function ForecastsPage() {
  const forecasts = useForecasts()
  const products = useActiveProducts()
  const movements = useAppStore((s) => s.movements)

  const rows = forecasts
    .map((f) => ({
      forecast: f,
      product: products.find((p) => p.id === f.productId)!,
    }))
    .filter((x) => x.product)
    .sort((a, b) => (a.forecast.daysRemaining ?? 999) - (b.forecast.daysRemaining ?? 999))

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">التنبؤات</h1>
        <div className="card p-10 text-center text-slate-500">
          أضف منتجات وسجّل مبيعات لرؤية التنبؤات
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">التنبؤات</h1>
        <p className="text-sm text-slate-500 mt-1">تفاصيل التنبؤ لكل منتج مع الرسوم البيانية</p>
      </div>

      <div className="space-y-4">
        {rows.map(({ product, forecast: f }) => {
          const chartData = buildSalesChart(movements, product.id)
          return (
            <div key={product.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-sm text-slate-500">{product.category} · {product.unit}</p>
                </div>
                <span
                  className={cn(
                    'badge',
                    f.confidence === 'high' && 'bg-emerald-50 text-emerald-700',
                    f.confidence === 'medium' && 'bg-amber-50 text-amber-700',
                    f.confidence === 'low' && 'bg-slate-100 text-slate-600'
                  )}
                >
                  {f.confidenceLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">المخزون</p>
                  <p className="font-bold text-lg">{f.currentStock}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">معدل البيع/يوم</p>
                  <p className="font-bold text-lg">{formatNumber(f.dailySalesRate, 1)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">أيام متبقية</p>
                  <p className="font-bold text-lg">
                    {f.daysRemaining !== null ? formatNumber(f.daysRemaining, 1) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">تاريخ النفاد</p>
                  <p className="font-medium text-sm">
                    {f.stockoutDate ? formatDateAr(f.stockoutDate) : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">اتجاه الطلب</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {f.demandTrend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                    {f.demandTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {f.demandTrend === 'stable' && <Minus className="h-4 w-4 text-slate-400" />}
                    <span className="font-medium">
                      {f.demandTrend === 'up' ? 'ارتفاع' : f.demandTrend === 'down' ? 'انخفاض' : 'مستقر'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({f.demandChangePercent > 0 ? '+' : ''}{f.demandChangePercent}%)
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">كمية مقترحة</p>
                  <p className="font-bold text-lg text-brand-700">
                    {f.suggestedOrderQty > 0 ? f.suggestedOrderQty : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">أفضل يوم تموين</p>
                  <p className="font-medium">{getBestDayLabel(f.bestReplenishmentDay)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">قيد التوريد</p>
                  <p className="font-medium">{f.pendingIncoming || 0}</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="h-40 mb-4" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="qty" name="مبيعات" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
                {f.reason}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildSalesChart(
  movements: { productId: string; type: string; quantity: number; date: string }[],
  productId: string
) {
  const days = getLastNDays(14)
  return days.map((day) => {
    const qty = movements
      .filter((m) => m.productId === productId && m.type === 'sale' && m.date === day)
      .reduce((s, m) => s + m.quantity, 0)
    return { day: day.slice(5), qty }
  })
}
