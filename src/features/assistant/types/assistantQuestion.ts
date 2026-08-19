export interface AssistantQuestion {
  id: string
  question: string
  category: string
  description: string
  planned_tools: string[]
  available: boolean
}

export interface AssistantQuestionsResponse {
  status: string
  records_returned: number
  data: AssistantQuestion[]
}
