export interface CurrentPromotionsImportResponse {
  id: string
  filename: string
  destination: string
  operation: string
  status: string
  total_rows: number
  inserted_rows: number
  rejected_rows: number
  columns: string[]
  validation_errors: Record<string, unknown>[]
}
