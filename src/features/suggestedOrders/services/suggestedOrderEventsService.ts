import type { ServerSentEvent } from '../types/suggestedOrderEvent'

const EVENTS_PATH = '/suggested-orders/events'

export class SuggestedOrderEventsHttpError extends Error {
  constructor(public readonly status: number) {
    super(`El stream de pedidos respondió con estado ${status}.`)
  }
}

function getEventsUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return new URL(`${normalizedBaseUrl}${EVENTS_PATH}`, window.location.origin).toString()
}

function parseEventFrame(frame: string): ServerSentEvent | null {
  let id: string | undefined
  let event = 'message'
  let retry: number | undefined
  const data: string[] = []

  for (const line of frame.split('\n')) {
    if (!line || line.startsWith(':')) continue

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)
    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'id' && !value.includes('\0')) id = value
    if (field === 'event') event = value
    if (field === 'data') data.push(value)
    if (field === 'retry' && /^\d+$/.test(value)) retry = Number(value)
  }

  if (data.length === 0 && retry === undefined && id === undefined) return null
  return { id, event, data: data.join('\n'), retry }
}

export async function streamSuggestedOrderEvents({
  accessToken,
  lastEventId,
  signal,
  onEvent,
}: {
  accessToken: string
  lastEventId?: string
  signal: AbortSignal
  onEvent: (event: ServerSentEvent) => void
}) {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    Authorization: `Bearer ${accessToken}`,
  }
  if (lastEventId) headers['Last-Event-ID'] = lastEventId

  const response = await fetch(getEventsUrl(), {
    method: 'GET',
    headers,
    cache: 'no-store',
    signal,
  })

  if (!response.ok) throw new SuggestedOrderEventsHttpError(response.status)
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
    throw new Error('El servicio no respondió con un stream SSE válido.')
  }
  if (!response.body) throw new Error('El servicio no proporcionó un stream legible.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (!signal.aborted) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })

    let boundary = /\r\n\r\n|\n\n|\r\r/.exec(buffer)
    while (boundary?.index !== undefined) {
      const frame = buffer.slice(0, boundary.index).replaceAll('\r\n', '\n').replaceAll('\r', '\n')
      const event = parseEventFrame(frame)
      buffer = buffer.slice(boundary.index + boundary[0].length)
      if (event) onEvent(event)
      boundary = /\r\n\r\n|\n\n|\r\r/.exec(buffer)
    }

    if (done) break
  }
}
