import {
  useCriticalProducts,
  useWarningProducts,
  useInventoryValue,
  useSlowMoving,
  useDemandAlerts,
  useSuggestedPurchaseItems,
  useActiveProducts,
} from '@/lib/inventory/selectors'
import { formatCurrency, formatNumber } from '@/lib/utils/numbers'
import { formatDateAr } from '@/lib/utils/dates'
import { AlertTriangle, Package, TrendingUp, Clock, ShoppingCart, ArrowLeft, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { getBestDayLabel } from '@/lib/forecast/replenishment'

export function DashboardPage() {
  const products = useActiveProducts()
  const critical = useCriticalProducts()
  const warning = useWarningProducts()
  const inventoryValue = useInventoryValue()
  const slowMoving = useSlowMoving()
  const demandAlerts = useDemandAlerts()
  const suggested = useSuggestedPurchaseItems()

  const totalSuggestedCost = suggested.reduce((s, x) => s + x.estimatedCost, 0)
  const bestDay =
    suggested.length > 0
      ? suggested
          .map((s) => s.forecast.bestReplenishmentDay)
          .filter(Boolean)
          .sort()[0]
      : null

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
          <p className="text-sm text-slate-500 mt-1">ابدأ بإضافة بياناتك</p>
        </div>
        <div className="card p-10 text-center max-w-lg mx-auto">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="font-bold text-lg mb-2">لا توجد منتجات بعد</h2>
          <p className="text-sm text-slate-500 mb-6">
            أضف موردًا ثم منتجاتك، وبعدها سجّل المبيعات ليبدأ محرك التنبؤ بالعمل.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/app/suppliers" className="btn-secondary">
              إضافة مورد
            </Link>
            <Link to="/app/inventory" className="btn-primary">
              <Plus className="h-4 w-4" />
              إضافة منتج
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="text-sm text-slate-500 mt-1">نظرة عامة على المخزون والتنبؤات</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">حرج</span>
          </div>
          <p className="text-2xl font-bold">{critical.length}</p>
          <p className="text-xs text-slate-500">منتجات تحتاج طلبًا فوريًا</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">خلال 7 أيام</span>
          </div>
          <p className="text-2xl font-bold">{warning.length}</p>
          <p className="text-xs text-slate-500">منتجات قاربت على النفاد</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-brand-600 mb-2">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium">قيمة المخزون</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(inventoryValue)}</p>
          <p className="text-xs text-slate-500">إجمالي التكلفة</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-xs font-medium">مقترح للطلب</span>
          </div>
          <p className="text-2xl font-bold">{suggested.length}</p>
          <p className="text-xs text-slate-500">{formatCurrency(totalSuggestedCost)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            المنتجات الحرجة
          </h2>
          {critical.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد منتجات حرجة حاليًا</p>
          ) : (
            <ul className="space-y-3">
              {critical.slice(0, 5).map(({ product, forecast }) => (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-slate-500">
                      متبقي {formatNumber(forecast.daysRemaining ?? 0, 1)} يوم · مخزون {product.currentStock}
                    </p>
                  </div>
                  <span className="badge bg-red-50 text-red-700">اطلب {forecast.suggestedOrderQty}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            تنبيهات ارتفاع الطلب
          </h2>
          {demandAlerts.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد ارتفاعات ملحوظة</p>
          ) : (
            <ul className="space-y-3">
              {demandAlerts.slice(0, 5).map(({ product, forecast }) => (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <p className="font-medium">{product.name}</p>
                  <span className="badge bg-emerald-50 text-emerald-700">+{forecast.demandChangePercent}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4">مخزون بطيء الحركة</h2>
          {slowMoving.length === 0 ? (
            <p className="text-sm text-slate-500">لا يوجد مخزون بطيء</p>
          ) : (
            <ul className="space-y-3">
              {slowMoving.slice(0, 5).map(({ product, valueFormatted }) => (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.currentStock} {product.unit}</p>
                  </div>
                  <span className="text-slate-600 font-medium">{valueFormatted}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">ملخص أمر الشراء المقترح</h2>
            <Link to="/app/purchase" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {suggested.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد اقتراحات طلب</p>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-3">
                {suggested.length} منتج · <strong>{formatCurrency(totalSuggestedCost)}</strong>
              </p>
              {bestDay && (
                <p className="text-sm text-slate-600 mb-3">
                  أفضل يوم: <strong>{getBestDayLabel(bestDay)}</strong> ({formatDateAr(bestDay)})
                </p>
              )}
              <ul className="space-y-2">
                {suggested.slice(0, 4).map(({ product, forecast }) => (
                  <li key={product.id} className="text-sm flex justify-between">
                    <span>{product.name}</span>
                    <span className="text-slate-500">{forecast.suggestedOrderQty} {product.unit}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
