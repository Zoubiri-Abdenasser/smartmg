import { useState, useEffect } from 'react'
import { useActiveProducts, useRecentMovements } from '@/lib/inventory/selectors'
import { useAppStore } from '@/lib/inventory/store'
import { todayISO, formatDateAr } from '@/lib/utils/dates'
import { toast } from 'sonner'

export function SalesPage() {
  const products = useActiveProducts()
  const recordSale = useAppStore((s) => s.recordSale)
  const recentSales = useRecentMovements(30).filter((m) => m.type === 'sale')

  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState(todayISO())

  useEffect(() => {
    if (!productId && products.length > 0) {
      setProductId(products[0].id)
    }
  }, [products, productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pid = productId || products[0]?.id
    if (!pid || quantity <= 0) {
      toast.error('اختر منتجًا وأدخل كمية صحيحة')
      return
    }
    try {
      await recordSale(pid, quantity, date)
      const product = products.find((p) => p.id === pid)
      toast.success(`تم تسجيل بيع ${quantity} ${product?.unit || ''} من ${product?.name || ''}`)
      setQuantity(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل التسجيل')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">المبيعات</h1>
        <p className="text-sm text-slate-500 mt-1">كل عملية بيع تحدّث المخزون والتنبؤات فورًا</p>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          أضف منتجات أولًا من صفحة المخزون
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-bold mb-4">تسجيل بيع جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">المنتج</label>
                <select
                  className="input"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (متاح: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">الكمية</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">التاريخ</label>
                  <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">تسجيل البيع</button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="font-bold mb-4">آخر المبيعات</h2>
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد مبيعات مسجلة</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {recentSales.map((m) => {
                  const p = products.find((x) => x.id === m.productId)
                  return (
                    <li key={m.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="font-medium">{p?.name || 'منتج'}</p>
                        <p className="text-xs text-slate-400">{formatDateAr(m.date)}</p>
                      </div>
                      <span className="font-medium text-red-600">−{m.quantity} {p?.unit}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
