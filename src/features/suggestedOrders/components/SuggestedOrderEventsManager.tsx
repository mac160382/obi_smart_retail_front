import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isSessionValid, useAuthStore } from '../../auth/store/authStore'
import {
  streamSuggestedOrderEvents,
  SuggestedOrderEventsHttpError,
} from '../services/suggestedOrderEventsService'
import type {
  ServerSentEvent,
  SuggestedOrdersRecalculatedData,
  SuggestedOrdersRecalculatedPayload,
} from '../types/suggestedOrderEvent'

const LAST_EVENT_ID_KEY = 'obi-smart-retail.suggested-orders.last-event-id'
const RECALCULATED_EVENT = 'suggested-orders.recalculated'
const DEFAULT_RETRY_MS = 3_000
const MAX_RETRY_MS = 30_000

interface RecalculationNotification {
  eventId?: string
  forecastOrigin: string
  insertedRows?: number
}

function readLastEventId() {
  const value = window.sessionStorage.getItem(LAST_EVENT_ID_KEY)
  return value && /^\d+$/.test(value) ? value : undefined
}

function isAlreadyProcessed(eventId: string, lastEventId?: string) {
  if (!lastEventId) return false
  return Number(eventId) <= Number(lastEventId)
}

function formatForecastOrigin(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function getEventData(payload: SuggestedOrdersRecalculatedPayload) {
  if (payload.data && typeof payload.data === 'object') return payload.data
  return payload as SuggestedOrdersRecalculatedData
}

export function SuggestedOrderEventsManager() {
  const session = useAuthStore((state) => state.session)
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [notification, setNotification] = useState<RecalculationNotification | null>(null)

  useEffect(() => {
    if (!isSessionValid(session)) {
      window.sessionStorage.removeItem(LAST_EVENT_ID_KEY)
      setNotification(null)
      return
    }

    let disposed = false
    let reconnectDelay = DEFAULT_RETRY_MS
    let lastEventId = readLastEventId()
    const accessToken = session.accessToken
    const controller = new AbortController()

    function rememberEventId(eventId?: string) {
      if (!eventId || !/^\d+$/.test(eventId)) return
      lastEventId = eventId
      window.sessionStorage.setItem(LAST_EVENT_ID_KEY, eventId)
    }

    function handleEvent(event: ServerSentEvent) {
      if (event.retry && event.retry > 0) {
        reconnectDelay = Math.min(event.retry, MAX_RETRY_MS)
      }

      if (event.id && isAlreadyProcessed(event.id, lastEventId)) return

      let payload: SuggestedOrdersRecalculatedPayload
      try {
        payload = JSON.parse(event.data) as SuggestedOrdersRecalculatedPayload
      } catch {
        rememberEventId(event.id)
        return
      }

      const eventType = event.event === 'message' ? payload.event_type : event.event
      if (eventType !== RECALCULATED_EVENT) {
        rememberEventId(event.id)
        return
      }

      const data = getEventData(payload)
      if (
        (data.status !== undefined && data.status !== 'completed') ||
        typeof data.forecast_origin !== 'string'
      ) {
        rememberEventId(event.id)
        return
      }

      rememberEventId(event.id)
      setNotification({
        eventId: event.id,
        forecastOrigin: data.forecast_origin,
        insertedRows: data.inserted_rows,
      })
      void queryClient.invalidateQueries({ queryKey: ['suggested-orders'] })
      navigate('/dashboard')
    }

    const waitForReconnect = (delay: number) => new Promise<void>((resolve) => {
      const handleAbort = () => {
        window.clearTimeout(timeoutId)
        resolve()
      }
      const timeoutId = window.setTimeout(() => {
        controller.signal.removeEventListener('abort', handleAbort)
        resolve()
      }, delay)
      controller.signal.addEventListener('abort', handleAbort, { once: true })
    })

    async function connect() {
      while (!disposed && !controller.signal.aborted) {
        try {
          await streamSuggestedOrderEvents({
            accessToken,
            lastEventId,
            signal: controller.signal,
            onEvent: handleEvent,
          })
          reconnectDelay = DEFAULT_RETRY_MS
        } catch (error) {
          if (controller.signal.aborted || disposed) return

          if (error instanceof SuggestedOrderEventsHttpError) {
            if (error.status === 401) {
              clearSession()
              return
            }
            if (error.status === 403) return
            if (error.status === 422 && lastEventId) {
              lastEventId = undefined
              window.sessionStorage.removeItem(LAST_EVENT_ID_KEY)
              continue
            }
          }
        }

        if (disposed || controller.signal.aborted) return
        await waitForReconnect(reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RETRY_MS)
      }
    }

    void connect()

    return () => {
      disposed = true
      controller.abort()
    }
  }, [clearSession, navigate, queryClient, session])

  if (!notification) return null

  return (
    <aside className='suggested-order-notification' role='status' aria-live='polite'>
      <CheckCircle2 size={22} aria-hidden='true' />
      <div>
        <strong>Pedido sugerido procesado</strong>
        <p>
          El pedido sugerido se calculó correctamente con el pronóstico del{' '}
          {formatForecastOrigin(notification.forecastOrigin)}.
        </p>
        {notification.insertedRows !== undefined && (
          <small>{notification.insertedRows.toLocaleString('es-MX')} pedidos generados.</small>
        )}
      </div>
      <button type='button' onClick={() => setNotification(null)} aria-label='Cerrar notificación'>
        <X size={18} />
      </button>
    </aside>
  )
}
