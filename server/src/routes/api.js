import { Router } from 'express'
import { randomUUID } from 'crypto'
import { query } from '../db/pool.js'

const router = Router()

function mapProduct(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    unit: r.unit,
    currentStock: Number(r.current_stock),
    safetyStock: Number(r.safety_stock),
    costPrice: Number(r.cost_price),
    supplierId: r.supplier_id,
    leadTimeDays: r.lead_time_days,
    archived: r.archived,
    createdAt: r.created_at?.toISOString?.()?.slice(0, 10) || r.created_at,
    updatedAt: r.updated_at?.toISOString?.()?.slice(0, 10) || r.updated_at,
  }
}

function mapSupplier(r) {
  return {
    id: r.id,
    name: r.name,
    leadTimeDays: r.lead_time_days,
    phone: r.phone || undefined,
    notes: r.notes || undefined,
    createdAt: r.created_at?.toISOString?.()?.slice(0, 10) || r.created_at,
  }
}

function mapMovement(r) {
  return {
    id: r.id,
    productId: r.product_id,
    type: r.type,
    quantity: Number(r.quantity),
    date: r.date?.toISOString?.()?.slice(0, 10) || String(r.date).slice(0, 10),
    note: r.note || undefined,
    createdAt: r.created_at?.toISOString?.() || r.created_at,
  }
}

function mapPO(r) {
  return {
    id: r.id,
    supplierId: r.supplier_id,
    status: r.status,
    items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
    note: r.note || undefined,
    createdAt: r.created_at?.toISOString?.()?.slice(0, 10) || r.created_at,
    updatedAt: r.updated_at?.toISOString?.()?.slice(0, 10) || r.updated_at,
  }
}

// ─── Bootstrap: كل البيانات دفعة واحدة ───────────────────
router.get('/bootstrap', async (_req, res) => {
  try {
    const [products, suppliers, movements, purchaseOrders] = await Promise.all([
      query('SELECT * FROM products ORDER BY name'),
      query('SELECT * FROM suppliers ORDER BY name'),
      query('SELECT * FROM movements ORDER BY date DESC, created_at DESC'),
      query('SELECT * FROM purchase_orders ORDER BY created_at DESC'),
    ])
    res.json({
      products: products.rows.map(mapProduct),
      suppliers: suppliers.rows.map(mapSupplier),
      movements: movements.rows.map(mapMovement),
      purchaseOrders: purchaseOrders.rows.map(mapPO),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

// ─── Suppliers ─────────────────────────────────────────
router.get('/suppliers', async (_req, res) => {
  const r = await query('SELECT * FROM suppliers ORDER BY name')
  res.json(r.rows.map(mapSupplier))
})

router.post('/suppliers', async (req, res) => {
  const { name, leadTimeDays = 2, phone, notes } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' })
  const id = randomUUID()
  await query(
    `INSERT INTO suppliers (id, name, lead_time_days, phone, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, name.trim(), leadTimeDays, phone || null, notes || null]
  )
  const r = await query('SELECT * FROM suppliers WHERE id = $1', [id])
  res.status(201).json(mapSupplier(r.rows[0]))
})

router.patch('/suppliers/:id', async (req, res) => {
  const { name, leadTimeDays, phone, notes } = req.body
  await query(
    `UPDATE suppliers SET
      name = COALESCE($2, name),
      lead_time_days = COALESCE($3, lead_time_days),
      phone = COALESCE($4, phone),
      notes = COALESCE($5, notes)
     WHERE id = $1`,
    [req.params.id, name, leadTimeDays, phone, notes]
  )
  const r = await query('SELECT * FROM suppliers WHERE id = $1', [req.params.id])
  if (!r.rows[0]) return res.status(404).json({ error: 'غير موجود' })
  res.json(mapSupplier(r.rows[0]))
})

router.delete('/suppliers/:id', async (req, res) => {
  const used = await query(
    'SELECT COUNT(*)::int AS c FROM products WHERE supplier_id = $1 AND archived = FALSE',
    [req.params.id]
  )
  if (used.rows[0].c > 0) {
    return res.status(400).json({ error: 'لا يمكن حذف مورد مرتبط بمنتجات نشطة' })
  }
  await query('DELETE FROM suppliers WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// ─── Products ──────────────────────────────────────────
router.get('/products', async (_req, res) => {
  const r = await query('SELECT * FROM products ORDER BY name')
  res.json(r.rows.map(mapProduct))
})

router.post('/products', async (req, res) => {
  const {
    name, category = '', unit = 'قطعة', currentStock = 0,
    safetyStock = 0, costPrice = 0, supplierId, leadTimeDays = 2,
  } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' })
  const id = randomUUID()
  const today = new Date().toISOString().slice(0, 10)
  await query(
    `INSERT INTO products
     (id, name, category, unit, current_stock, safety_stock, cost_price,
      supplier_id, lead_time_days, archived, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,$10,$10)`,
    [id, name.trim(), category, unit, currentStock, safetyStock, costPrice,
      supplierId || null, leadTimeDays, today]
  )
  const r = await query('SELECT * FROM products WHERE id = $1', [id])
  res.status(201).json(mapProduct(r.rows[0]))
})

router.patch('/products/:id', async (req, res) => {
  const b = req.body
  const today = new Date().toISOString().slice(0, 10)
  await query(
    `UPDATE products SET
      name = COALESCE($2, name),
      category = COALESCE($3, category),
      unit = COALESCE($4, unit),
      safety_stock = COALESCE($5, safety_stock),
      cost_price = COALESCE($6, cost_price),
      supplier_id = COALESCE($7, supplier_id),
      lead_time_days = COALESCE($8, lead_time_days),
      archived = COALESCE($9, archived),
      updated_at = $10
     WHERE id = $1`,
    [
      req.params.id,
      b.name, b.category, b.unit,
      b.safetyStock, b.costPrice, b.supplierId, b.leadTimeDays,
      b.archived, today,
    ]
  )
  const r = await query('SELECT * FROM products WHERE id = $1', [req.params.id])
  if (!r.rows[0]) return res.status(404).json({ error: 'غير موجود' })
  res.json(mapProduct(r.rows[0]))
})

// ─── Movements ─────────────────────────────────────────
router.get('/movements', async (_req, res) => {
  const r = await query('SELECT * FROM movements ORDER BY date DESC, created_at DESC')
  res.json(r.rows.map(mapMovement))
})

router.post('/movements/sale', async (req, res) => {
  const { productId, quantity, date, note } = req.body
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'بيانات غير صالحة' })
  }
  const client = await (await import('../db/pool.js')).pool.connect()
  try {
    await client.query('BEGIN')
    const p = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId])
    if (!p.rows[0]) throw new Error('المنتج غير موجود')
    const stock = Number(p.rows[0].current_stock)
    if (quantity > stock) throw new Error(`المخزون المتاح: ${stock} فقط`)
    const id = randomUUID()
    const d = date || new Date().toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    await client.query(
      `INSERT INTO movements (id, product_id, type, quantity, date, note)
       VALUES ($1, $2, 'sale', $3, $4, $5)`,
      [id, productId, quantity, d, note || null]
    )
    await client.query(
      `UPDATE products SET current_stock = $2, updated_at = $3 WHERE id = $1`,
      [productId, stock - quantity, today]
    )
    await client.query('COMMIT')
    res.status(201).json({ ok: true })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: e.message })
  } finally {
    client.release()
  }
})

router.post('/movements/purchase', async (req, res) => {
  const { productId, quantity, date, note } = req.body
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'بيانات غير صالحة' })
  }
  const client = await (await import('../db/pool.js')).pool.connect()
  try {
    await client.query('BEGIN')
    const p = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId])
    if (!p.rows[0]) throw new Error('المنتج غير موجود')
    const stock = Number(p.rows[0].current_stock)
    const id = randomUUID()
    const d = date || new Date().toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    await client.query(
      `INSERT INTO movements (id, product_id, type, quantity, date, note)
       VALUES ($1, $2, 'purchase', $3, $4, $5)`,
      [id, productId, quantity, d, note || null]
    )
    await client.query(
      `UPDATE products SET current_stock = $2, updated_at = $3 WHERE id = $1`,
      [productId, stock + quantity, today]
    )
    await client.query('COMMIT')
    res.status(201).json({ ok: true })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: e.message })
  } finally {
    client.release()
  }
})

router.post('/movements/adjustment', async (req, res) => {
  const { productId, newQuantity, note } = req.body
  if (!productId || newQuantity == null || newQuantity < 0) {
    return res.status(400).json({ error: 'بيانات غير صالحة' })
  }
  const client = await (await import('../db/pool.js')).pool.connect()
  try {
    await client.query('BEGIN')
    const p = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId])
    if (!p.rows[0]) throw new Error('المنتج غير موجود')
    const stock = Number(p.rows[0].current_stock)
    const diff = newQuantity - stock
    if (diff === 0) {
      await client.query('COMMIT')
      return res.json({ ok: true })
    }
    const id = randomUUID()
    const today = new Date().toISOString().slice(0, 10)
    const noteText = (note || (diff > 0 ? 'تسوية بالزيادة' : 'تسوية بالنقصان')) +
      (diff > 0 ? ` (+${diff})` : ` (−${Math.abs(diff)})`)
    await client.query(
      `INSERT INTO movements (id, product_id, type, quantity, date, note)
       VALUES ($1, $2, 'adjustment', $3, $4, $5)`,
      [id, productId, Math.abs(diff), today, noteText]
    )
    await client.query(
      `UPDATE products SET current_stock = $2, updated_at = $3 WHERE id = $1`,
      [productId, newQuantity, today]
    )
    await client.query('COMMIT')
    res.status(201).json({ ok: true })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: e.message })
  } finally {
    client.release()
  }
})

// ─── Purchase Orders ───────────────────────────────────
router.get('/purchase-orders', async (_req, res) => {
  const r = await query('SELECT * FROM purchase_orders ORDER BY created_at DESC')
  res.json(r.rows.map(mapPO))
})

router.post('/purchase-orders', async (req, res) => {
  const { supplierId, items, note } = req.body
  if (!items?.length) return res.status(400).json({ error: 'لا توجد عناصر' })
  const id = randomUUID()
  const today = new Date().toISOString().slice(0, 10)
  await query(
    `INSERT INTO purchase_orders (id, supplier_id, status, items, note, created_at, updated_at)
     VALUES ($1, $2, 'draft', $3, $4, $5, $5)`,
    [id, supplierId, JSON.stringify(items), note || null, today]
  )
  const r = await query('SELECT * FROM purchase_orders WHERE id = $1', [id])
  res.status(201).json(mapPO(r.rows[0]))
})

router.patch('/purchase-orders/:id/status', async (req, res) => {
  const { status } = req.body
  if (!['draft', 'approved', 'received', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' })
  }
  const today = new Date().toISOString().slice(0, 10)

  if (status === 'received') {
    const client = await (await import('../db/pool.js')).pool.connect()
    try {
      await client.query('BEGIN')
      const po = await client.query('SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE', [req.params.id])
      if (!po.rows[0]) throw new Error('الأمر غير موجود')
      if (po.rows[0].status !== 'approved') throw new Error('يجب اعتماد الأمر أولاً')
      const items = typeof po.rows[0].items === 'string'
        ? JSON.parse(po.rows[0].items)
        : po.rows[0].items
      for (const item of items) {
        const p = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.productId])
        if (!p.rows[0]) continue
        const stock = Number(p.rows[0].current_stock)
        const mid = randomUUID()
        await client.query(
          `INSERT INTO movements (id, product_id, type, quantity, date, note)
           VALUES ($1, $2, 'purchase', $3, $4, $5)`,
          [mid, item.productId, item.quantity, today, `استلام أمر شراء ${req.params.id}`]
        )
        await client.query(
          `UPDATE products SET current_stock = $2, updated_at = $3 WHERE id = $1`,
          [item.productId, stock + item.quantity, today]
        )
      }
      await client.query(
        `UPDATE purchase_orders SET status = 'received', updated_at = $2 WHERE id = $1`,
        [req.params.id, today]
      )
      await client.query('COMMIT')
      res.json({ ok: true })
    } catch (e) {
      await client.query('ROLLBACK')
      res.status(400).json({ error: e.message })
    } finally {
      client.release()
    }
    return
  }

  await query(
    `UPDATE purchase_orders SET status = $2, updated_at = $3 WHERE id = $1`,
    [req.params.id, status, today]
  )
  res.json({ ok: true })
})

export default router
