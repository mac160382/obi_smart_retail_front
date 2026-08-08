export type HistoricalSalesImportMode = 'incremental' | 'replace'

export interface HistoricalSalesImportResponse {
  id: string
  filename: string
  destination: string
  status: string
  total_rows: number
  inserted_rows: number
  rejected_rows: number
  columns: string[]
  validation_errors: Record<string, unknown>[]
  mode: HistoricalSalesImportMode
  feature_engineering_status: string
}
