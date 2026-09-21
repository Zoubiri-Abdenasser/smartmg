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

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!ready && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">جاري تحميل قاعدة البيانات...</p>
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
