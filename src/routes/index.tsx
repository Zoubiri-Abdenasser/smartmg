import { Link } from '@tanstack/react-router'
import { Package, TrendingUp, ShoppingCart, Calendar, ArrowLeft, Database } from 'lucide-react'

const features = [
  {
    icon: Package,
    title: 'متى سينفد المنتج؟',
    desc: 'توقع تاريخ النفاد بناءً على معدل البيع الفعلي والمخزون الحالي.',
  },
  {
    icon: ShoppingCart,
    title: 'كم كمية يجب طلبها؟',
    desc: 'اقتراح كمية الطلب مع مراعاة مدة التوريد ومخزون الأمان والكميات قيد التوريد.',
  },
  {
    icon: TrendingUp,
    title: 'هل الطلب يرتفع أم ينخفض؟',
    desc: 'مقارنة آخر 7 أيام مع الفترة السابقة لمعرفة اتجاه الطلب.',
  },
  {
    icon: Calendar,
    title: 'ما أفضل يوم للتموين؟',
    desc: 'تحديد أفضل يوم لإعادة الطلب مع تجميع المنتجات حسب المورد.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 text-brand-700 px-4 py-1.5 text-sm font-medium mb-6">
            <Database className="h-4 w-4" />
            قاعدة بيانات محلية · بدون بيانات تجريبية
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            إدارة المخزون الذكي
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            ابدأ بإضافة منتجاتك ومورديك، ثم سجّل المبيعات. النظام يحسب التنبؤات
            ويقترح أوامر الشراء تلقائيًا بالدينار الجزائري.
          </p>
          <Link
            to="/app"
            className="btn-primary text-base px-8 py-3 rounded-xl shadow-lg shadow-brand-600/25"
          >
            فتح لوحة التحكم
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="h-11 w-11 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-slate-400">
          البيانات تُحفظ في قاعدة IndexedDB على جهازك · تصدير واستيراد متاحان
        </p>
      </div>
    </div>
  )
}
