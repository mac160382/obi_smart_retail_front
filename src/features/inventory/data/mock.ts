import type { Product } from '../types/inventory'

const baseProducts: Product[] = [
  { id: 1, sku: 'SKU-10335532', name: 'Leche Entera Premium 1L', category: 'Lácteos', provider: 'Alquería Corp.', format: 'Mini-Mercado', quantity: 120, unit: 'u', confidence: 94, status: 'ALERT', price: 1.25, projectedSale: 2.2, salesHistory: [70,85,95,80,110,118,125], reasons: ['Rotación sostenida durante 7 días', 'Cobertura actual menor a dos días', 'Demanda prevista para fin de semana'] },
  { id: 2, sku: 'SKU-63001292', name: 'Arroz Integral 1kg', category: 'Abarrotes', provider: 'Diana S.A.', format: 'Hipermercado', quantity: 450, unit: 'u', confidence: 88, status: 'ALERT', price: .95, projectedSale: 1.8, salesHistory: [280,310,350,390,410,440,460], reasons: ['Pico de compra por quincena', 'Alta rotación regional'] },
  { id: 3, sku: 'SKU-32001594', name: 'Detergente Líquido 3L', category: 'Cuidado del Hogar', provider: 'Procter & Co.', format: 'Supermercado', quantity: 65, unit: 'u', confidence: 81, status: 'STABLE', price: 8.4, projectedSale: 14.5, salesHistory: [40,45,50,52,58,62,65], reasons: ['Demanda estable', 'Campaña comercial activa'] },
  { id: 4, sku: 'SKU-52022841', name: 'Aceite de Girasol 1L', category: 'Abarrotes', provider: 'Soler S.A.', format: 'Supermercado', quantity: 95, unit: 'u', confidence: 90, status: 'ALERT', price: 3.1, projectedSale: 4.8, salesHistory: [60,68,75,80,88,92,98], reasons: ['Rotación acelerada', 'Stock de seguridad reducido'] },
  { id: 5, sku: 'SKU-33001844', name: 'Papel Higiénico 12u', category: 'Aseo Personal', provider: 'Kimberly-Papel', format: 'Hipermercado', quantity: 320, unit: 'u', confidence: 85, status: 'STABLE', price: 4.5, projectedSale: 7.2, salesHistory: [210,230,245,270,290,310,325], reasons: ['Consumo familiar estable', 'Cobertura adecuada'] },
  { id: 6, sku: 'SKU-88075322', name: 'Pechuga de Pollo 1kg', category: 'Fresco / Carnes', provider: 'Avícola Central', format: 'Supermercado', quantity: 110, unit: 'kg', confidence: 92, status: 'ALERT', price: 5.2, projectedSale: 7.9, salesHistory: [75,82,90,95,102,108,115], reasons: ['Alta demanda', 'Cadena de frío disponible'] },
  { id: 7, sku: 'SKU-73025619', name: 'Cerveza Pack 6u', category: 'Licores', provider: 'Bavaria Corp.', format: 'Mini-Mercado', quantity: 180, unit: 'u', confidence: 96, status: 'ALERT', price: 5.8, projectedSale: 9.5, salesHistory: [90,110,125,140,160,175,185], reasons: ['Evento deportivo', 'Aumento de demanda vecinal'] },
  { id: 8, sku: 'SKU-61075902', name: 'Galletas Dulces 12u', category: 'Abarrotes', provider: 'Noel S.A.S.', format: 'Mini-Mercado', quantity: 80, unit: 'u', confidence: 76, status: 'STABLE', price: 2.1, projectedSale: 3.4, salesHistory: [50,55,62,68,72,78,82], reasons: ['Demanda escolar constante'] },
]

export function getMockProducts(): Product[] {
  return baseProducts.map((product) => ({
    ...product,
    salesHistory: [...product.salesHistory],
    reasons: [...product.reasons],
  }))
}
