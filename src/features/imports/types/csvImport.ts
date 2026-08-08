import type { HistoricalSalesImportMode } from './historicalSalesImport'

export interface CsvImportRequest {
  file: File
  mode?: HistoricalSalesImportMode
}

export interface CsvImportSummary {
  filename: string
  status: string
  totalRows: number
  insertedRows: number
  rejectedRows: number
  validationErrors: Record<string, unknown>[]
  operation?: string
  mode?: HistoricalSalesImportMode
  featureEngineeringStatus?: string
}
