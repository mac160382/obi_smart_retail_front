export type SuggestedOrderStatus = 'Estimado' | 'Planificado' | 'Aprobado'

export interface SuggestedOrder {
  item: string
  location: number
  descripcion_tienda: string
  descripcion_item: string
  descripcion_proveedor: string
  prediccion: number
  ajustado: number | null
  lead_time_days: number
  review_period_days: number
  uplift_esperado: number
  minimum_handling_quantity_units: number
  current_stock_units: number
  on_order_in_transit_units: number
  sugerido: number
  status: SuggestedOrderStatus
}

export interface SuggestedOrdersResponse {
  location: number
  page: number
  page_size: number
  total_items: number
  total_pages: number
  items: SuggestedOrder[]
}

export interface SuggestedOrdersParams {
  location: number
  page: number
  pageSize: number
}
