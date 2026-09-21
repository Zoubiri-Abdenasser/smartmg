const BASE = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `خطأ ${res.status}`)
  }
  return data as T
}

export const api = {
  bootstrap: () =>
    request<{
      products: import('../inventory/types').Product[]
      suppliers: import('../inventory/types').Supplier[]
      movements: import('../inventory/types').StockMovement[]
      purchaseOrders: import('../inventory/types').PurchaseOrder[]
    }>('/bootstrap'),

  addSupplier: (body: object) =>
    request('/suppliers', { method: 'POST', body: JSON.stringify(body) }),
  updateSupplier: (id: string, body: object) =>
    request(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSupplier: (id: string) =>
    request(`/suppliers/${id}`, { method: 'DELETE' }),

  addProduct: (body: object) =>
    request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: object) =>
    request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  recordSale: (body: object) =>
    request('/movements/sale', { method: 'POST', body: JSON.stringify(body) }),
  recordPurchase: (body: object) =>
    request('/movements/purchase', { method: 'POST', body: JSON.stringify(body) }),
  recordAdjustment: (body: object) =>
    request('/movements/adjustment', { method: 'POST', body: JSON.stringify(body) }),

  createPurchaseOrder: (body: object) =>
    request<{ id: string }>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  setPOStatus: (id: string, status: string) =>
    request(`/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}
