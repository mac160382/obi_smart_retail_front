import { apiClient } from '../../../lib/api/client'
import type {
  SuggestedOrderBatchUpdateRequest,
  SuggestedOrderBatchUpdateResponse,
} from '../types/suggestedOrderBatchUpdate'

export async function updateSuggestedOrdersBatch(
  request: SuggestedOrderBatchUpdateRequest,
): Promise<SuggestedOrderBatchUpdateResponse> {
  const { data } = await apiClient.patch<SuggestedOrderBatchUpdateResponse>(
    '/suggested-orders/batch',
    request,
  )

  return data
}
