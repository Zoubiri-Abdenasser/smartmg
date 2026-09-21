import { useState } from 'react'
import { useAppStore } from '@/lib/inventory/store'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Supplier } from '@/lib/inventory/types'

export function SuppliersPage() {
  const suppliers = useAppStore((s) => s.suppliers)
  const products = useAppStore((s) => s.products)
  const addSupplier = useAppStore((s) => s.addSupplier)
  const updateSupplier = useAppStore((s) => s.updateSupplier)
  const deleteSupplier = useAppStore((s) => s.deleteSupplier)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', leadTimeDays: 2, phone: '', notes: '' })

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', leadTimeDays: 2, phone: '', notes: '' })
    setShowForm(true)
  }

  const openEdit = (s: Supplier) => {
    setEditing(s)
    setForm({
      name: s.name,
      leadTimeDays: s.leadTimeDays,
      phone: s.phone || '',
      notes: s.notes || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('اسم المورد مطلوب')
      return
    }
    if (editing) {
      await updateSupplier(editing.id, form)
      toast.success('تم التحديث')
    } else {
      await addSupplier(form)
      toast.success('تمت الإضافة')
    }
    setShowForm(false)
  }

  const handleDelete = async (s: Supplier) => {
    const used = products.some((p) => p.supplierId === s.id && !p.archived)
    if (used) {
      toast.error('لا يمكن حذف مورد مرتبط بمنتجات نشطة')
      return
    }
    if (confirm(`حذف المورد "${s.name}"؟`)) {
      await deleteSupplier(s.id)
      toast.success('تم الحذف')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الموردون</h1>
          <p className="text-sm text-slate-500 mt-1">{suppliers.length} مورد</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> إضافة مورد
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          لا يوجد موردون. أضف موردًا قبل إضافة المنتجات.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => {
            const count = products.filter((p) => p.supplierId === s.id && !p.archived).length
            return (
              <div key={s.id} className="card p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{s.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(s)} className="p-1.5 hover:bg-red-50 rounded text-slate-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500">مدة التوريد: {s.leadTimeDays} يوم</p>
                {s.phone && <p className="text-sm text-slate-500">هاتف: {s.phone}</p>}
                <p className="text-xs text-slate-400 mt-2">{count} منتج مرتبط</p>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold">{editing ? 'تعديل مورد' : 'إضافة مورد'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">الاسم</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">مدة التوريد (أيام)</label>
                <input type="number" min={1} className="input" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">الهاتف (اختياري)</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">ملاحظات</label>
                <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">حفظ</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
