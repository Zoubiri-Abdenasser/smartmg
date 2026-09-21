import type { Product, Supplier, StockMovement } from './types'
import { generateId } from '../utils/format'
import { todayISO, addDaysISO } from '../utils/dates'

const today = todayISO()

export const seedSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'مؤسسة النور للتجارة', leadTimeDays: 2 },
  { id: 'sup-2', name: 'شركة الأفق للتوريدات', leadTimeDays: 3 },
  { id: 'sup-3', name: 'مستودع البركة', leadTimeDays: 1 },
]

export const seedProducts: Product[] = [
  {
    id: 'p-1',
    name: 'حليب طازج 1 لتر',
    category: 'ألبان',
    unit: 'علبة',
    currentStock: 24,
    safetyStock: 20,
    costPrice: 55,
    supplierId: 'sup-1',
    leadTimeDays: 2,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
  {
    id: 'p-2',
    name: 'خبز توست',
    category: 'مخبوزات',
    unit: 'رغيف',
    currentStock: 15,
    safetyStock: 25,
    costPrice: 25,
    supplierId: 'sup-3',
    leadTimeDays: 1,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
  {
    id: 'p-3',
    name: 'أرز بسمتي 5 كجم',
    category: 'حبوب',
    unit: 'كيس',
    currentStock: 40,
    safetyStock: 10,
    costPrice: 850,
    supplierId: 'sup-2',
    leadTimeDays: 3,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
  {
    id: 'p-4',
    name: 'زيت ذرة 1.5 لتر',
    category: 'زيوت',
    unit: 'زجاجة',
    currentStock: 8,
    safetyStock: 12,
    costPrice: 320,
    supplierId: 'sup-1',
    leadTimeDays: 2,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
  {
    id: 'p-5',
    name: 'سكر أبيض 1 كجم',
    category: 'سكريات',
    unit: 'كيس',
    currentStock: 50,
    safetyStock: 15,
    costPrice: 90,
    supplierId: 'sup-2',
    leadTimeDays: 3,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
  {
    id: 'p-6',
    name: 'شاي أحمر 100 كيس',
    category: 'مشروبات',
    unit: 'علبة',
    currentStock: 18,
    safetyStock: 8,
    costPrice: 450,
    supplierId: 'sup-3',
    leadTimeDays: 1,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
  {
    id: 'p-7',
    name: 'ماء معدني 330 مل',
    category: 'مشروبات',
    unit: 'كرتون',
    currentStock: 5,
    safetyStock: 20,
    costPrice: 280,
    supplierId: 'sup-1',
    leadTimeDays: 2,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
  {
    id: 'p-8',
    name: 'معجون أسنان',
    category: 'عناية شخصية',
    unit: 'قطعة',
    currentStock: 35,
    safetyStock: 10,
    costPrice: 180,
    supplierId: 'sup-2',
    leadTimeDays: 3,
    archived: false,
    createdAt: addDaysISO(today, -30),
    updatedAt: today,
  },
]

function makeSales(productId: string, pattern: number[]): StockMovement[] {
  return pattern.map((qty, i) => ({
    id: generateId(),
    productId,
    type: 'sale' as const,
    quantity: qty,
    date: addDaysISO(today, -(pattern.length - 1 - i)),
  }))
}

export const seedMovements: StockMovement[] = [
  // حليب - معدل مرتفع ومتزايد
  ...makeSales('p-1', [6, 7, 8, 7, 9, 8, 10, 9, 11, 10, 12, 11, 10, 13]),
  // خبز - نفاد سريع
  ...makeSales('p-2', [12, 14, 13, 15, 14, 16, 15, 14, 17, 16, 15, 18, 16, 17]),
  // أرز - بطيء
  ...makeSales('p-3', [1, 0, 2, 1, 0, 1, 2, 1, 0, 1, 1, 0, 2, 1]),
  // زيت - حرج
  ...makeSales('p-4', [3, 4, 3, 5, 4, 3, 4, 5, 4, 3, 5, 4, 3, 4]),
  // سكر - مستقر
  ...makeSales('p-5', [2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 2, 3, 2]),
  // شاي
  ...makeSales('p-6', [1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1]),
  // ماء - حرج جداً
  ...makeSales('p-7', [8, 9, 10, 8, 11, 9, 10, 12, 9, 11, 10, 13, 11, 12]),
  // معجون - بطيء الحركة
  ...makeSales('p-8', [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0]),
]
