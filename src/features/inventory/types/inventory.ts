export type InventoryStatus = 'ALERT' | 'STABLE'

export interface Product {
  id: number
  sku: string
  name: string
  category: string
  provider: string
  format: 'Hipermercado' | 'Supermercado' | 'Mini-Mercado'
  quantity: number
  unit: string
  confidence: number
  status: InventoryStatus
  price: number
  projectedSale: number
  salesHistory: number[]
  reasons: string[]
}
