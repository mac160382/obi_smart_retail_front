import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { queryAssistant } from '../services/assistantQueryService'
import type { AssistantQueryResponse } from '../types/assistantQuery'

interface AssistantQuerySectionProps {
  question: string
  onQuestionChange: (question: string) => void
}

function getQueryError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (error.response?.status === 409) return 'La consulta requiere una herramienta que no está disponible.'
    if (error.response?.status === 422) return 'La pregunta o la fecha no tienen un formato válido.'
    if (error.response?.status === 503) return 'El asistente no está disponible temporalmente.'
    if (!error.response) return 'No fue posible conectar con el asistente.'
  }
  return 'No fue posible completar la consulta.'
}

export function AssistantQuerySection({
  question,
  onQuestionChange,
}: AssistantQuerySectionProps) {
  const [forecastOrigin, setForecastOrigin] = useState('')
  const [conversation, setConversation] = useState<AssistantQueryResponse[]>([])
  const queryMutation = useMutation({
    mutationFn: queryAssistant,
    onSuccess: (response) => {
      setConversation((current) => [...current, response])
    },
  })

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanedQuestion = question.trim()
    if (!cleanedQuestion || queryMutation.isPending) return

    queryMutation.mutate({
      question: cleanedQuestion,
      ...(forecastOrigin ? { forecast_origin: forecastOrigin } : {}),
    })
  }

  function clearQuestion() {
    onQuestionChange('')
    queryMutation.reset()
  }

  function clearConversation() {
    setConversation([])
    queryMutation.reset()
  }

  return (
    <>
      <section className='assistant-query-card card' aria-labelledby='assistant-question-label'>
        <form onSubmit={submitQuestion}>
          <div className='assistant-query-fields'>
            <label className='assistant-question-control'>
              <span id='assistant-question-label'>Pregunta</span>
              <textarea
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
                placeholder='Ejemplo: ¿Cuáles son los pedidos sugeridos para la tienda 13?'
                maxLength={4000}
                disabled={queryMutation.isPending}
                required
              />
            </label>

            <label className='assistant-date-control'>
              <span>Origen del pronóstico</span>
              <input
                type='date'
                value={forecastOrigin}
                onChange={(event) => setForecastOrigin(event.target.value)}
                disabled={queryMutation.isPending}
              />
            </label>
          </div>

          <div className='assistant-query-actions'>
            <button className='assistant-submit-button' type='submit' disabled={queryMutation.isPending}>
              {queryMutation.isPending ? 'Consultando...' : 'Consultar'}
            </button>
            <button type='button' onClick={clearQuestion} disabled={queryMutation.isPending || question.length === 0}>
              Limpiar pregunta
            </button>
            <button type='button' onClick={clearConversation} disabled={queryMutation.isPending || conversation.length === 0}>
              Limpiar conversación
            </button>
          </div>

          {queryMutation.isError && (
            <p className='assistant-query-error' role='alert'>{getQueryError(queryMutation.error)}</p>
          )}
        </form>
      </section>

      <section className='assistant-conversation card' aria-labelledby='assistant-conversation-title'>
        <h2 id='assistant-conversation-title'>Conversación</h2>
        {conversation.length === 0 ? (
          <p className='assistant-conversation-empty'>Realiza una consulta para comenzar la conversación.</p>
        ) : (
          <div className='assistant-conversation-list' aria-live='polite'>
            {conversation.map((entry) => (
              <article className='assistant-conversation-entry' key={entry.request_id}>
                <div className='assistant-user-message'>
                  <span>Pregunta</span>
                  <p>{entry.question}</p>
                </div>
                <div className='assistant-response-message'>
                  <span>Asistente</span>
                  <p>{entry.answer}</p>
                  {entry.sources.length > 0 && (
                    <small>Fuentes: {entry.sources.join(', ')}</small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
