const STORAGE_KEY = 'smart-inventory-v1'

export function loadFromStorage<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}
