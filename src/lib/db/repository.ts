import { db } from './database'
import type {
  Product,
  Supplier,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
} from '../inventory/types'
import { generateId } from '../utils/format'
import { todayISO, nowISO } from '../utils/dates'

// ─── Products ───────────────────────────────────────────

export async function getAllProducts(includeArchived = false): Promise<Product[]> {
  if (includeArchived) return db.products.toArray()
  return db.products.filter((p) => !p.archived).toArray()
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return db.products.get(id)
}

export async function addProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'archived'>
): Promise<Product> {
  const now = todayISO()
  const product: Product = {
    ...data,
    id: generateId(),
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.products.add(product)
  return product
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await db.products.update(id, { ...data, updatedAt: todayISO() })
}

export async function archiveProduct(id: string): Promise<void> {
  await db.products.update(id, { archived: true, updatedAt: todayISO() })
}

// ─── Suppliers ──────────────────────────────────────────

export async function getAllSuppliers(): Promise<Supplier[]> {
  return db.suppliers.toArray()
}

export async function addSupplier(
  data: Omit<Supplier, 'id' | 'createdAt'>
): Promise<Supplier> {
  const supplier: Supplier = {
    ...data,
    id: generateId(),
    createdAt: todayISO(),
  }
  await db.suppliers.add(supplier)
  return supplier
}

export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<void> {
  await db.suppliers.update(id, data)
}

export async function deleteSupplier(id: string): Promise<void> {
  await db.suppliers.delete(id)
}

// ─── Movements ──────────────────────────────────────────

export async function getAllMovements(): Promise<StockMovement[]> {
  return db.movements.orderBy('date').reverse().toArray()
}

export async function getMovementsByProduct(productId: string): Promise<StockMovement[]> {
  return db.movements.where('productId').equals(productId).reverse().sortBy('date')
}

export async function recordSale(
  productId: string,
  quantity: number,
  date?: string,
  note?: string
): Promise<void> {
  if (quantity <= 0) return
  const product = await db.products.get(productId)
  if (!product) return
  if (quantity > product.currentStock) {
    throw new Error(`المخزون المتاح: ${product.currentStock} فقط`)
  }

  await db.transaction('rw', db.products, db.movements, async () => {
    const movement: StockMovement = {
      id: generateId(),
      productId,
      type: 'sale',
      quantity,
      date: date || todayISO(),
      note,
      createdAt: nowISO(),
    }
    await db.movements.add(movement)
    await db.products.update(productId, {
      currentStock: Math.max(0, product.currentStock - quantity),
      updatedAt: todayISO(),
    })
  })
}

export async function recordPurchase(
  productId: string,
  quantity: number,
  date?: string,
  note?: string
): Promise<void> {
  if (quantity <= 0) return
  const product = await db.products.get(productId)
  if (!product) return

  await db.transaction('rw', db.products, db.movements, async () => {
    const movement: StockMovement = {
      id: generateId(),
      productId,
      type: 'purchase',
      quantity,
      date: date || todayISO(),
      note,
      createdAt: nowISO(),
    }
    await db.movements.add(movement)
    await db.products.update(productId, {
      currentStock: product.currentStock + quantity,
      updatedAt: todayISO(),
    })
  })
}

/** تسوية المخزون: الفرق = الكمية الجديدة − الكمية الحالية */
export async function recordAdjustment(
  productId: string,
  newQuantity: number,
  note?: string
): Promise<void> {
  const product = await db.products.get(productId)
  if (!product) return
  const diff = newQuantity - product.currentStock
  if (diff === 0) return

  await db.transaction('rw', db.products, db.movements, async () => {
    const movement: StockMovement = {
      id: generateId(),
      productId,
      type: 'adjustment',
      quantity: Math.abs(diff),
      date: todayISO(),
      note: note || (diff > 0 ? 'تسوية بالزيادة' : 'تسوية بالنقصان'),
      createdAt: nowISO(),
    }
    // نخزّن الإشارة في note للوضوح، والكمية موجبة
    if (diff < 0) {
      movement.note = (movement.note || '') + ` (−${Math.abs(diff)})`
    } else {
      movement.note = (movement.note || '') + ` (+${diff})`
    }
    await db.movements.add(movement)
    await db.products.update(productId, {
      currentStock: Math.max(0, newQuantity),
      updatedAt: todayISO(),
    })
  })
}

// ─── Purchase Orders ────────────────────────────────────

export async function getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  return db.purchaseOrders.orderBy('createdAt').reverse().toArray()
}

export async function createPurchaseOrder(
  supplierId: string,
  items: PurchaseOrderItem[],
  note?: string
): Promise<PurchaseOrder> {
  const now = todayISO()
  const order: PurchaseOrder = {
    id: generateId(),
    supplierId,
    status: 'draft',
    items,
    createdAt: now,
    updatedAt: now,
    note,
  }
  await db.purchaseOrders.add(order)
  return order
}

export async function approvePurchaseOrder(id: string): Promise<void> {
  await db.purchaseOrders.update(id, { status: 'approved', updatedAt: todayISO() })
}

export async function cancelPurchaseOrder(id: string): Promise<void> {
  await db.purchaseOrders.update(id, { status: 'cancelled', updatedAt: todayISO() })
}

export async function receivePurchaseOrder(id: string): Promise<void> {
  const order = await db.purchaseOrders.get(id)
  if (!order || order.status !== 'approved') return

  await db.transaction('rw', db.products, db.movements, db.purchaseOrders, async () => {
    for (const item of order.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue
      const movement: StockMovement = {
        id: generateId(),
        productId: item.productId,
        type: 'purchase',
        quantity: item.quantity,
        date: todayISO(),
        note: `استلام أمر شراء ${id}`,
        createdAt: nowISO(),
      }
      await db.movements.add(movement)
      await db.products.update(item.productId, {
        currentStock: product.currentStock + item.quantity,
        updatedAt: todayISO(),
      })
    }
    await db.purchaseOrders.update(id, { status: 'received', updatedAt: todayISO() })
  })
}

export async function updateOrderItemQty(
  orderId: string,
  productId: string,
  quantity: number
): Promise<void> {
  const order = await db.purchaseOrders.get(orderId)
  if (!order || order.status !== 'draft') return
  const product = await db.products.get(productId)
  const items = order.items.map((item) =>
    item.productId === productId
      ? {
          ...item,
          quantity,
          estimatedCost: (product?.costPrice || 0) * quantity,
        }
      : item
  )
  await db.purchaseOrders.update(orderId, { items, updatedAt: todayISO() })
}

// ─── Backup / Export ────────────────────────────────────

export async function exportAllData() {
  const [products, suppliers, movements, purchaseOrders] = await Promise.all([
    db.products.toArray(),
    db.suppliers.toArray(),
    db.movements.toArray(),
    db.purchaseOrders.toArray(),
  ])
  return { products, suppliers, movements, purchaseOrders, exportedAt: nowISO() }
}

export async function importAllData(data: {
  products?: Product[]
  suppliers?: Supplier[]
  movements?: StockMovement[]
  purchaseOrders?: PurchaseOrder[]
}): Promise<void> {
  await db.transaction(
    'rw',
    db.products,
    db.suppliers,
    db.movements,
    db.purchaseOrders,
    async () => {
      if (data.suppliers?.length) await db.suppliers.bulkPut(data.suppliers)
      if (data.products?.length) await db.products.bulkPut(data.products)
      if (data.movements?.length) await db.movements.bulkPut(data.movements)
      if (data.purchaseOrders?.length) await db.purchaseOrders.bulkPut(data.purchaseOrders)
    }
  )
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    db.products,
    db.suppliers,
    db.movements,
    db.purchaseOrders,
    async () => {
      await db.products.clear()
      await db.suppliers.clear()
      await db.movements.clear()
      await db.purchaseOrders.clear()
    }
  )
}
