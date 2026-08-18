import type { SuggestedOrder } from './suggestedOrder'

export interface SuggestedOrderBatchUpdateItem {
  item: string
  location: number
  forecast_origin: string
  ajustado: number
  observaciones: string
}

export interface SuggestedOrderBatchUpdateRequest {
  items: SuggestedOrderBatchUpdateItem[]
}

export interface SuggestedOrderBatchUpdateResponse {
  batch_id: string
  status: 'completed'
  requested_items: number
  updated_items: number
  approved_at: string
  items: SuggestedOrder[]
}
