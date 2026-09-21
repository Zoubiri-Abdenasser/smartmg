import { create } from 'zustand'
import type {
  Product,
  Supplier,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
} from './types'
import * as repo from '../db/repository'

interface AppStore {
  products: Product[]
  suppliers: Supplier[]
  movements: StockMovement[]
  purchaseOrders: PurchaseOrder[]
  loading: boolean
  ready: boolean

  /** تحميل كل البيانات من IndexedDB */
  hydrate: () => Promise<void>
  refresh: () => Promise<void>

  // Products
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => Promise<void>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  archiveProduct: (id: string) => Promise<void>

  // Suppliers
  addSupplier: (data: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>

  // Movements
  recordSale: (productId: string, quantity: number, date?: string, note?: string) => Promise<void>
  recordPurchase: (productId: string, quantity: number, date?: string, note?: string) => Promise<void>
  recordAdjustment: (productId: string, newQuantity: number, note?: string) => Promise<void>

  // Purchase Orders
  createPurchaseOrder: (supplierId: string, items: PurchaseOrderItem[], note?: string) => Promise<string>
  approvePurchaseOrder: (id: string) => Promise<void>
  cancelPurchaseOrder: (id: string) => Promise<void>
  receivePurchaseOrder: (id: string) => Promise<void>
  updateOrderItemQty: (orderId: string, productId: string, quantity: number) => Promise<void>

  // Data management
  exportData: () => Promise<object>
  importData: (data: Parameters<typeof repo.importAllData>[0]) => Promise<void>
  clearAllData: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  products: [],
  suppliers: [],
  movements: [],
  purchaseOrders: [],
  loading: false,
  ready: false,

  hydrate: async () => {
    set({ loading: true })
    try {
      const [products, suppliers, movements, purchaseOrders] = await Promise.all([
        repo.getAllProducts(true),
        repo.getAllSuppliers(),
        repo.getAllMovements(),
        repo.getAllPurchaseOrders(),
      ])
      set({ products, suppliers, movements, purchaseOrders, ready: true })
    } finally {
      set({ loading: false })
    }
  },

  refresh: async () => {
    await get().hydrate()
  },

  addProduct: async (data) => {
    await repo.addProduct(data)
    await get().refresh()
  },

  updateProduct: async (id, data) => {
    await repo.updateProduct(id, data)
    await get().refresh()
  },

  archiveProduct: async (id) => {
    await repo.archiveProduct(id)
    await get().refresh()
  },

  addSupplier: async (data) => {
    await repo.addSupplier(data)
    await get().refresh()
  },

  updateSupplier: async (id, data) => {
    await repo.updateSupplier(id, data)
    await get().refresh()
  },

  deleteSupplier: async (id) => {
    await repo.deleteSupplier(id)
    await get().refresh()
  },

  recordSale: async (productId, quantity, date, note) => {
    await repo.recordSale(productId, quantity, date, note)
    await get().refresh()
  },

  recordPurchase: async (productId, quantity, date, note) => {
    await repo.recordPurchase(productId, quantity, date, note)
    await get().refresh()
  },

  recordAdjustment: async (productId, newQuantity, note) => {
    await repo.recordAdjustment(productId, newQuantity, note)
    await get().refresh()
  },

  createPurchaseOrder: async (supplierId, items, note) => {
    const order = await repo.createPurchaseOrder(supplierId, items, note)
    await get().refresh()
    return order.id
  },

  approvePurchaseOrder: async (id) => {
    await repo.approvePurchaseOrder(id)
    await get().refresh()
  },

  cancelPurchaseOrder: async (id) => {
    await repo.cancelPurchaseOrder(id)
    await get().refresh()
  },

  receivePurchaseOrder: async (id) => {
    await repo.receivePurchaseOrder(id)
    await get().refresh()
  },

  updateOrderItemQty: async (orderId, productId, quantity) => {
    await repo.updateOrderItemQty(orderId, productId, quantity)
    await get().refresh()
  },

  exportData: async () => {
    return repo.exportAllData()
  },

  importData: async (data) => {
    await repo.importAllData(data)
    await get().refresh()
  },

  clearAllData: async () => {
    await repo.clearAllData()
    await get().refresh()
  },
}))
