import { create } from 'zustand'
import type {
  Product,
  Supplier,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
} from './types'
import { api } from '../api/client'

interface AppStore {
  products: Product[]
  suppliers: Supplier[]
  movements: StockMovement[]
  purchaseOrders: PurchaseOrder[]
  loading: boolean
  ready: boolean
  error: string | null

  hydrate: () => Promise<void>
  refresh: () => Promise<void>

  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => Promise<void>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  archiveProduct: (id: string) => Promise<void>

  addSupplier: (data: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>

  recordSale: (productId: string, quantity: number, date?: string, note?: string) => Promise<void>
  recordPurchase: (productId: string, quantity: number, date?: string, note?: string) => Promise<void>
  recordAdjustment: (productId: string, newQuantity: number, note?: string) => Promise<void>

  createPurchaseOrder: (supplierId: string, items: PurchaseOrderItem[], note?: string) => Promise<string>
  approvePurchaseOrder: (id: string) => Promise<void>
  cancelPurchaseOrder: (id: string) => Promise<void>
  receivePurchaseOrder: (id: string) => Promise<void>
  updateOrderItemQty: (orderId: string, productId: string, quantity: number) => Promise<void>

  exportData: () => Promise<object>
  importData: (_data: unknown) => Promise<void>
  clearAllData: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  products: [],
  suppliers: [],
  movements: [],
  purchaseOrders: [],
  loading: false,
  ready: false,
  error: null,

  hydrate: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.bootstrap()
      set({
        products: data.products,
        suppliers: data.suppliers,
        movements: data.movements,
        purchaseOrders: data.purchaseOrders,
        ready: true,
      })
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'فشل الاتصال بالخادم',
        ready: true,
      })
    } finally {
      set({ loading: false })
    }
  },

  refresh: async () => {
    await get().hydrate()
  },

  addProduct: async (data) => {
    await api.addProduct(data)
    await get().refresh()
  },

  updateProduct: async (id, data) => {
    await api.updateProduct(id, data)
    await get().refresh()
  },

  archiveProduct: async (id) => {
    await api.updateProduct(id, { archived: true })
    await get().refresh()
  },

  addSupplier: async (data) => {
    await api.addSupplier(data)
    await get().refresh()
  },

  updateSupplier: async (id, data) => {
    await api.updateSupplier(id, data)
    await get().refresh()
  },

  deleteSupplier: async (id) => {
    await api.deleteSupplier(id)
    await get().refresh()
  },

  recordSale: async (productId, quantity, date, note) => {
    await api.recordSale({ productId, quantity, date, note })
    await get().refresh()
  },

  recordPurchase: async (productId, quantity, date, note) => {
    await api.recordPurchase({ productId, quantity, date, note })
    await get().refresh()
  },

  recordAdjustment: async (productId, newQuantity, note) => {
    await api.recordAdjustment({ productId, newQuantity, note })
    await get().refresh()
  },

  createPurchaseOrder: async (supplierId, items, note) => {
    const order = await api.createPurchaseOrder({ supplierId, items, note })
    await get().refresh()
    return order.id
  },

  approvePurchaseOrder: async (id) => {
    await api.setPOStatus(id, 'approved')
    await get().refresh()
  },

  cancelPurchaseOrder: async (id) => {
    await api.setPOStatus(id, 'cancelled')
    await get().refresh()
  },

  receivePurchaseOrder: async (id) => {
    await api.setPOStatus(id, 'received')
    await get().refresh()
  },

  updateOrderItemQty: async () => {},

  exportData: async () => api.bootstrap(),

  importData: async () => {
    throw new Error('الاستيراد غير متاح مع قاعدة PostgreSQL')
  },

  clearAllData: async () => {
    throw new Error('حذف الكل غير متاح من الواجهة مع قاعدة سحابية')
  },
}))
