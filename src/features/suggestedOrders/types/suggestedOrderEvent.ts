export interface SuggestedOrdersRecalculatedData {
  forecast_origin: string
  status?: string
  inserted_rows?: number
  deleted_rows?: number
  destination?: string
  calculated_at?: string
  duration_ms?: number
}

export interface SuggestedOrdersRecalculatedPayload {
  event_id?: string
  event_type?: string
  event_version?: number
  occurred_at?: string
  correlation_id?: string
  data?: SuggestedOrdersRecalculatedData
  forecast_origin?: string
  status?: string
  inserted_rows?: number
  deleted_rows?: number
  destination?: string
  calculated_at?: string
  duration_ms?: number
}

export interface ServerSentEvent {
  id?: string
  event: string
  data: string
  retry?: number
}
