import Dexie, { type Table } from 'dexie'
import type { Product, Supplier, StockMovement, PurchaseOrder } from '../inventory/types'

/**
 * قاعدة بيانات IndexedDB المحلية
 * يمكن استبدالها لاحقًا بـ API سحابي
 */
export class InventoryDatabase extends Dexie {
  products!: Table<Product, string>
  suppliers!: Table<Supplier, string>
  movements!: Table<StockMovement, string>
  purchaseOrders!: Table<PurchaseOrder, string>

  constructor() {
    super('SmartInventoryDB')
    this.version(1).stores({
      products: 'id, name, category, supplierId, archived, updatedAt',
      suppliers: 'id, name',
      movements: 'id, productId, type, date, createdAt',
      purchaseOrders: 'id, supplierId, status, createdAt',
    })
  }
}

export const db = new InventoryDatabase()
