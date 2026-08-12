import { apiClient } from '../../../lib/api/client'
import type { CsvImportRequest, CsvImportSummary } from '../types/csvImport'
import type { HistoricalSalesImportResponse } from '../types/historicalSalesImport'

export async function uploadHistoricalSalesCsv(
  request: CsvImportRequest,
): Promise<CsvImportSummary> {
  const formData = new FormData()
  const mode = request.mode ?? 'incremental'
  formData.append('file', request.file, request.file.name)
  formData.append('mode', mode)
  if (mode === 'incremental') {
    if (request.fecha) formData.append('fecha', request.fecha)
    if (request.publishMessage) formData.append('publish_message', 'true')
  }

  const { data } = await apiClient.post<HistoricalSalesImportResponse>(
    '/imports/historical-sales/csv',
    formData,
  )

  return {
    filename: data.filename,
    status: data.status,
    totalRows: data.total_rows,
    insertedRows: data.inserted_rows,
    rejectedRows: data.rejected_rows,
    validationErrors: data.validation_errors,
    mode: data.mode,
    featureEngineeringStatus: data.feature_engineering_status,
  }
}
