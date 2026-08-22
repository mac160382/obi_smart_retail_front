export type SuggestedOrderStatus = 'Estimado' | 'Planificado' | 'Aprobado'

export interface SuggestedOrder {
  item: string
  forecast_origin: string
  horizon_day: number
  target_date: string
  location: number
  descripcion_tienda: string
  descripcion_item: string
  descripcion_proveedor: string
  prediccion: number
  ajustado: number | null
  observaciones: string | null
  approved_by: string | null
  approved_at: string | null
  updated_at: string | null
  lead_time_days: number
  review_period_days: number
  uplift_esperado: number
  minimum_handling_quantity_units: number
  current_stock_units: number
  on_order_in_transit_units: number
  max_qty_vendida: number | null
  safety_stock: number | null
  reorder_point: number | null
  sugerido: number
  status: SuggestedOrderStatus
}

export interface SuggestedOrdersResponse {
  location: number
  forecast_origin: string | null
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
  forecastOrigin: string
}

export function suggestedOrderKey(order: Pick<SuggestedOrder, 'location' | 'item' | 'forecast_origin'>) {
  return `${order.location}:${order.item}:${order.forecast_origin}`
}
