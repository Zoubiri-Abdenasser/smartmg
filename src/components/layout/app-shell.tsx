import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  ShoppingCart,
  Calendar,
  ShoppingBag,
  Menu,
  X,
  Truck,
  Database,
  Download,
  Upload,
  Trash2,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/inventory/store'
import { cn } from '@/lib/utils/format'
import { toast } from 'sonner'

const navItems = [
  { to: '/app', label: 'لوحة التحكم', icon: LayoutDashboard, exact: true },
  { to: '/app/inventory', label: 'المخزون', icon: Package },
  { to: '/app/forecasts', label: 'التنبؤات', icon: TrendingUp },
  { to: '/app/purchase', label: 'أمر الشراء', icon: ShoppingCart },
  { to: '/app/calendar', label: 'تقويم التموين', icon: Calendar },
  { to: '/app/sales', label: 'المبيعات', icon: ShoppingBag },
  { to: '/app/suppliers', label: 'الموردون', icon: Truck },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDataMenu, setShowDataMenu] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const exportData = useAppStore((s) => s.exportData)
  const importData = useAppStore((s) => s.importData)
  const clearAllData = useAppStore((s) => s.clearAllData)
  const fileRef = useRef<HTMLInputElement>(null)

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return pathname === to
    return pathname.startsWith(to)
  }

  const handleExport = async () => {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('تم تصدير النسخة الاحتياطية')
    setShowDataMenu(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data)
      toast.success('تم استيراد البيانات بنجاح')
    } catch {
      toast.error('ملف غير صالح')
    }
    e.target.value = ''
    setShowDataMenu(false)
  }

  const handleClear = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع.')) return
    await clearAllData()
    toast.success('تم حذف جميع البيانات')
    setShowDataMenu(false)
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden lg:flex w-64 flex-col border-l border-slate-200 bg-white">
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-lg font-bold text-brand-700">إدارة المخزون الذكي</h1>
          <p className="text-xs text-slate-500 mt-1">PostgreSQL · دينار جزائري</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.to, item.exact)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 relative">
          <button
            onClick={() => setShowDataMenu(!showDataMenu)}
            className="btn-ghost w-full justify-start text-slate-500"
          >
            <Database className="h-4 w-4" />
            إدارة البيانات
          </button>
          {showDataMenu && (
            <div className="absolute bottom-full right-3 left-3 mb-1 card p-2 shadow-lg space-y-1">
              <button onClick={handleExport} className="btn-ghost w-full justify-start text-sm">
                <Download className="h-4 w-4" /> تصدير نسخة احتياطية
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="btn-ghost w-full justify-start text-sm"
              >
                <Upload className="h-4 w-4" /> استيراد بيانات
              </button>
              <button onClick={handleClear} className="btn-ghost w-full justify-start text-sm text-red-600">
                <Trash2 className="h-4 w-4" /> حذف الكل
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h1 className="font-bold text-brand-700">إدارة المخزون</h1>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
            <div
              className="absolute top-0 right-0 h-full w-64 bg-white shadow-xl p-4 space-y-1 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to, item.exact)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      active ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              <hr className="my-2" />
              <button onClick={handleExport} className="btn-ghost w-full justify-start text-sm">
                <Download className="h-4 w-4" /> تصدير
              </button>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full justify-start text-sm">
                <Upload className="h-4 w-4" /> استيراد
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
