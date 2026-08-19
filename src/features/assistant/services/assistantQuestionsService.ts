import { apiClient } from '../../../lib/api/client'
import type { AssistantQuestionsResponse } from '../types/assistantQuestion'

export async function getAssistantQuestions(): Promise<AssistantQuestionsResponse> {
  const { data } = await apiClient.get<AssistantQuestionsResponse>(
    '/assistant-light/questions',
  )

  return data
}
