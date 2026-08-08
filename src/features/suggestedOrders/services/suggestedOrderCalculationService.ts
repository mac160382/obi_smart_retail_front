import { apiClient } from '../../../lib/api/client'
import type { SuggestedOrderCalculationResponse } from '../types/suggestedOrderCalculation'

export async function recalculateSuggestedOrders(): Promise<SuggestedOrderCalculationResponse> {
  const { data } = await apiClient.post<SuggestedOrderCalculationResponse>(
    '/suggested-orders/recalculate',
  )

  return data
}
