import { apiClient } from '../../../lib/api/client'
import type {
  AssistantQueryRequest,
  AssistantQueryResponse,
} from '../types/assistantQuery'

export async function queryAssistant(
  request: AssistantQueryRequest,
): Promise<AssistantQueryResponse> {
  const { data } = await apiClient.post<AssistantQueryResponse>(
    '/assistant-light/query',
    request,
  )

  return data
}
