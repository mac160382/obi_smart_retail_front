export interface SuggestedOrderCalculationResponse {
  operation: 'replace'
  destination: string
  status: 'completed'
  deleted_rows: number
  inserted_rows: number
  calculated_at: string
  duration_ms: number
}
