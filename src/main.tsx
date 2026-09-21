import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree'
import { Toaster } from 'sonner'
import { useAppStore } from './lib/inventory/store'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const hydrate = useAppStore((s) => s.hydrate)
  const ready = useAppStore((s) => s.ready)
  const loading = useAppStore((s) => s.loading)
  const error = useAppStore((s) => s.error)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!ready && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">جاري الاتصال بقاعدة البيانات...</p>
        </div>
      </div>
    )
  }

  if (error && !useAppStore.getState().products.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="card p-8 max-w-md text-center">
          <h1 className="font-bold text-lg mb-2">تعذّر الاتصال بالخادم</h1>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <p className="text-xs text-slate-400 mb-4">
            تأكد أن API يعمل وأن DATABASE_URL مضبوط
          </p>
          <button onClick={() => hydrate()} className="btn-primary">
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" dir="rtl" richColors closeButton />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
