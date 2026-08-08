import { apiClient } from '../../../lib/api/client'
import type { CsvImportRequest, CsvImportSummary } from '../types/csvImport'
import type { InventoryMasterImportResponse } from '../types/inventoryMasterImport'

export async function uploadInventoryMasterCsv(
  request: CsvImportRequest,
): Promise<CsvImportSummary> {
  const formData = new FormData()
  formData.append('file', request.file, request.file.name)

  const { data } = await apiClient.post<InventoryMasterImportResponse>(
    '/imports/inventory-master/csv',
    formData,
  )

  return {
    filename: data.filename,
    status: data.status,
    totalRows: data.total_rows,
    insertedRows: data.inserted_rows,
    rejectedRows: data.rejected_rows,
    validationErrors: data.validation_errors,
    operation: data.operation,
  }
}
