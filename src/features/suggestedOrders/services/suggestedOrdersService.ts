import { apiClient } from '../../../lib/api/client'
import type {
  SuggestedOrdersParams,
  SuggestedOrdersResponse,
} from '../types/suggestedOrder'

export async function getSuggestedOrders({
  location,
  page,
  pageSize,
}: SuggestedOrdersParams): Promise<SuggestedOrdersResponse> {
  const { data } = await apiClient.get<SuggestedOrdersResponse>('/suggested-orders', {
    params: {
      location,
      page,
      page_size: pageSize,
    },
  })

  return data
}
