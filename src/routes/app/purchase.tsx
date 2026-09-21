import { useState } from 'react'
import { useSuggestedPurchaseItems } from '@/lib/inventory/selectors'
import { useAppStore } from '@/lib/inventory/store'
import { formatCurrency, formatNumber } from '@/lib/utils/numbers'
import { toast } from 'sonner'
import { Check, Package, X, FileText } from 'lucide-react'
import type { PurchaseOrderItem } from '@/lib/inventory/types'

export function PurchasePage() {
  const suggested = useSuggestedPurchaseItems()
  const purchaseOrders = useAppStore((s) => s.purchaseOrders)
  const createPurchaseOrder = useAppStore((s) => s.createPurchaseOrder)
  const approvePurchaseOrder = useAppStore((s) => s.approvePurchaseOrder)
  const cancelPurchaseOrder = useAppStore((s) => s.cancelPurchaseOrder)
  const receivePurchaseOrder = useAppStore((s) => s.receivePurchaseOrder)
  const products = useAppStore((s) => s.products)
  const suppliers = useAppStore((s) => s.suppliers)

  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({})
  const getQty = (productId: string, suggestedQty: number) =>
    qtyOverrides[productId] ?? suggestedQty

  const bySupplier = suggested.reduce<Record<string, typeof suggested>>((acc, item) => {
    const sid = item.product.supplierId
    if (!acc[sid]) acc[sid] = []
    acc[sid].push(item)
    return acc
  }, {})

  const handleSaveDraft = async (supplierId: string, items: typeof suggested) => {
    const orderItems: PurchaseOrderItem[] = items
      .map((i) => {
        const qty = getQty(i.product.id, i.forecast.suggestedOrderQty)
        return {
          productId: i.product.id,
          quantity: qty,
          estimatedCost: qty * i.product.costPrice,
        }
      })
      .filter((i) => i.quantity > 0)

    if (orderItems.length === 0) {
      toast.error('لا توجد كميات')
      return
    }
    await createPurchaseOrder(supplierId, orderItems)
    toast.success('تم حفظ أمر الشراء كمسودة')
  }

  const handleApproveDirect = async (supplierId: string, items: typeof suggested) => {
    const orderItems: PurchaseOrderItem[] = items
      .map((i) => {
        const qty = getQty(i.product.id, i.forecast.suggestedOrderQty)
        return {
          productId: i.product.id,
          quantity: qty,
          estimatedCost: qty * i.product.costPrice,
        }
      })
      .filter((i) => i.quantity > 0)

    if (orderItems.length === 0) {
      toast.error('لا توجد كميات')
      return
    }
    const id = await createPurchaseOrder(supplierId, orderItems)
    await approvePurchaseOrder(id)
    toast.success('تم اعتماد أمر الشراء — الكميات قيد التوريد')
  }

  const activeOrders = purchaseOrders.filter(
    (po) => po.status === 'draft' || po.status === 'approved'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">أمر الشراء</h1>
        <p className="text-sm text-slate-500 mt-1">اقتراحات · مسودات · اعتماد · استلام</p>
      </div>

      {Object.keys(bySupplier).length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          لا توجد اقتراحات طلب حاليًا
        </div>
      ) : (
        Object.entries(bySupplier).map(([supplierId, items]) => {
          const supplier = suppliers.find((s) => s.id === supplierId)
          const totalCost = items.reduce(
            (s, i) => s + getQty(i.product.id, i.forecast.suggestedOrderQty) * i.product.costPrice,
            0
          )
          return (
            <div key={supplierId} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-lg">{supplier?.name || 'مورد'}</h2>
                  <p className="text-sm text-slate-500">
                    {items.length} منتج · {formatCurrency(totalCost)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSaveDraft(supplierId, items)} className="btn-secondary">
                    <FileText className="h-4 w-4" /> حفظ مسودة
                  </button>
                  <button onClick={() => handleApproveDirect(supplierId, items)} className="btn-primary">
                    <Check className="h-4 w-4" /> اعتماد مباشرة
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="text-right py-2 font-medium">المنتج</th>
                      <th className="text-right py-2 font-medium">المقترح</th>
                      <th className="text-right py-2 font-medium">الكمية</th>
                      <th className="text-right py-2 font-medium">التكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(({ product, forecast }) => {
                      const qty = getQty(product.id, forecast.suggestedOrderQty)
                      return (
                        <tr key={product.id}>
                          <td className="py-3">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-slate-400">
                              مخزون {product.currentStock} · {formatNumber(forecast.daysRemaining ?? 0, 1)} يوم
                            </p>
                          </td>
                          <td className="py-3 text-slate-500">{forecast.suggestedOrderQty}</td>
                          <td className="py-3">
                            <input
                              type="number"
                              min={0}
                              className="input w-24"
                              value={qty}
                              onChange={(e) =>
                                setQtyOverrides({ ...qtyOverrides, [product.id]: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="py-3 font-medium">{formatCurrency(qty * product.costPrice)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      )}

      {activeOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">أوامر نشطة</h2>
          {activeOrders.map((po) => {
            const supplier = suppliers.find((s) => s.id === po.supplierId)
            const total = po.items.reduce((s, i) => s + i.estimatedCost, 0)
            return (
              <div key={po.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium">{supplier?.name}</p>
                    <p className="text-xs text-slate-500">
                      {po.status === 'approved' ? 'قيد التوريد' : 'مسودة'} · {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {po.status === 'draft' && (
                      <>
                        <button
                          onClick={async () => {
                            await approvePurchaseOrder(po.id)
                            toast.success('تم الاعتماد')
                          }}
                          className="btn-primary"
                        >
                          <Check className="h-4 w-4" /> اعتماد
                        </button>
                        <button
                          onClick={async () => {
                            await cancelPurchaseOrder(po.id)
                            toast.success('تم الإلغاء')
                          }}
                          className="btn-secondary"
                        >
                          <X className="h-4 w-4" /> إلغاء
                        </button>
                      </>
                    )}
                    {po.status === 'approved' && (
                      <>
                        <button
                          onClick={async () => {
                            await receivePurchaseOrder(po.id)
                            toast.success('تم الاستلام وإضافة المخزون')
                          }}
                          className="btn-primary"
                        >
                          تسجيل الاستلام
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('إلغاء الأمر قبل الاستلام؟')) {
                              await cancelPurchaseOrder(po.id)
                              toast.success('تم الإلغاء')
                            }
                          }}
                          className="btn-secondary"
                        >
                          إلغاء
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <ul className="text-sm space-y-1">
                  {po.items.map((item) => {
                    const p = products.find((x) => x.id === item.productId)
                    return (
                      <li key={item.productId} className="flex justify-between">
                        <span>{p?.name}</span>
                        <span className="text-slate-500">{item.quantity} {p?.unit}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
