export interface AssistantQueryRequest {
  question: string
  forecast_origin?: string
}

export interface AssistantUsage {
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

export interface AssistantQueryResponse {
  application: string
  endpoint: string
  request_id: string
  started_utc: string
  completed_utc: string
  status: string
  question: string
  forecast_origin: string | null
  routing: Record<string, unknown>
  answer: string
  sources: string[]
  selected_tools: string[]
  tools_used: Record<string, unknown>[]
  usage: AssistantUsage
  model: string
  model_calls: number
  model_called: boolean
  local_restriction: boolean
  response_id: string | null
}
