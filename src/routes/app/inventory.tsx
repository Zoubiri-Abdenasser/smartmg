import { useState, useMemo } from 'react'
import { useActiveProducts, useStockStatusMap, useForecasts, useProductMovements } from '@/lib/inventory/selectors'
import { useAppStore } from '@/lib/inventory/store'
import { formatCurrency, formatNumber } from '@/lib/utils/numbers'
import { formatDateAr } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/format'
import { Search, Plus, Archive, Pencil, Scale, History, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Product, StockStatus } from '@/lib/inventory/types'

const statusLabel: Record<StockStatus, string> = {
  safe: 'آمن',
  warning: 'تحذير',
  critical: 'حرج',
}
const statusClass: Record<StockStatus, string> = {
  safe: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
}

const movementTypeLabel = { sale: 'بيع', purchase: 'توريد', adjustment: 'تسوية' }

export function InventoryPage() {
  const products = useActiveProducts()
  const suppliers = useAppStore((s) => s.suppliers)
  const statusMap = useStockStatusMap()
  const forecasts = useForecasts()
  const archiveProduct = useAppStore((s) => s.archiveProduct)
  const addProduct = useAppStore((s) => s.addProduct)
  const updateProduct = useAppStore((s) => s.updateProduct)
  const recordAdjustment = useAppStore((s) => s.recordAdjustment)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StockStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustNote, setAdjustNote] = useState('')
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)

  const historyMovements = useProductMovements(historyProduct?.id || '')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.includes(search) || p.category.includes(search)
      const status = statusMap[p.id] || 'safe'
      const matchStatus = filterStatus === 'all' || status === filterStatus
      return matchSearch && matchStatus
    })
  }, [products, search, filterStatus, statusMap])

  const emptyForm = {
    name: '',
    category: '',
    unit: 'قطعة',
    currentStock: 0,
    safetyStock: 10,
    costPrice: 0,
    supplierId: suppliers[0]?.id || '',
    leadTimeDays: 2,
  }
  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    if (suppliers.length === 0) {
      toast.error('أضف موردًا أولاً من صفحة الموردين')
      return
    }
    setEditing(null)
    setForm({ ...emptyForm, supplierId: suppliers[0].id })
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
      currentStock: p.currentStock,
      safetyStock: p.safetyStock,
      costPrice: p.costPrice,
      supplierId: p.supplierId,
      leadTimeDays: p.leadTimeDays,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('الاسم مطلوب')
      return
    }
    if (editing) {
      await updateProduct(editing.id, form)
      toast.success('تم تحديث المنتج')
    } else {
      await addProduct(form)
      toast.success('تمت إضافة المنتج')
    }
    setShowForm(false)
  }

  const handleAdjust = async () => {
    if (!adjustProduct) return
    await recordAdjustment(adjustProduct.id, adjustQty, adjustNote || undefined)
    toast.success('تم تسجيل التسوية')
    setAdjustProduct(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المخزون</h1>
          <p className="text-sm text-slate-500 mt-1">{products.length} منتج نشط</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> إضافة منتج
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="input pr-10" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StockStatus | 'all')}>
          <option value="all">كل الحالات</option>
          <option value="safe">آمن</option>
          <option value="warning">تحذير</option>
          <option value="critical">حرج</option>
        </select>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          لا توجد منتجات. أضف موردًا ثم منتجًا للبدء.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">المنتج</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">المخزون</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">التكلفة</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">المورد</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const status = statusMap[p.id] || 'safe'
                  const supplier = suppliers.find((s) => s.id === p.supplierId)
                  const f = forecasts.find((x) => x.productId === p.id)
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category} · معدل {formatNumber(f?.dailySalesRate ?? 0, 1)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{p.currentStock}</span>
                        <span className="text-slate-400 text-xs mr-1">{p.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge', statusClass[status])}>{statusLabel[status]}</span>
                      </td>
                      <td className="px-4 py-3">{formatCurrency(p.costPrice)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{supplier?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="تعديل">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setAdjustProduct(p); setAdjustQty(p.currentStock); setAdjustNote('') }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                            title="تسوية"
                          >
                            <Scale className="h-4 w-4" />
                          </button>
                          <button onClick={() => setHistoryProduct(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="السجل">
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`أرشفة "${p.name}"؟`)) {
                                await archiveProduct(p.id)
                                toast.success('تمت الأرشفة')
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                            title="أرشفة"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{editing ? 'تعديل منتج' : 'إضافة منتج'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">الاسم</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">التصنيف</label>
                  <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div>
                  <label className="label">الوحدة</label>
                  <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">الكمية الحالية</label>
                  <input type="number" min={0} className="input" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })} disabled={!!editing} />
                </div>
                <div>
                  <label className="label">حد الأمان</label>
                  <input type="number" min={0} className="input" value={form.safetyStock} onChange={(e) => setForm({ ...form, safetyStock: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">سعر التكلفة (د.ج)</label>
                  <input type="number" min={0} step={0.1} className="input" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">مدة التوريد (أيام)</label>
                  <input type="number" min={1} className="input" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">المورد</label>
                <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">حفظ</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold">تسوية المخزون</h2>
            <p className="text-sm text-slate-600">{adjustProduct.name}</p>
            <p className="text-xs text-slate-500">الكمية الحالية: {adjustProduct.currentStock} {adjustProduct.unit}</p>
            <div>
              <label className="label">الكمية الفعلية بعد الجرد</label>
              <input type="number" min={0} className="input" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">ملاحظة (اختياري)</label>
              <input className="input" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="سبب التسوية..." />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdjust} className="btn-primary flex-1">تأكيد التسوية</button>
              <button onClick={() => setAdjustProduct(null)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">سجل الحركات — {historyProduct.name}</h2>
              <button onClick={() => setHistoryProduct(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            {historyMovements.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد حركات</p>
            ) : (
              <ul className="space-y-2">
                {historyMovements.map((m) => (
                  <li key={m.id} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                    <div>
                      <span className="font-medium">{movementTypeLabel[m.type]}</span>
                      {m.note && <p className="text-xs text-slate-400">{m.note}</p>}
                      <p className="text-xs text-slate-400">{formatDateAr(m.date)}</p>
                    </div>
                    <span className={m.type === 'sale' ? 'text-red-600' : 'text-emerald-600'}>
                      {m.type === 'sale' ? '−' : '+'}{m.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
