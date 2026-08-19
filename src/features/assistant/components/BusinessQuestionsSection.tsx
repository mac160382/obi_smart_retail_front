import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { getAssistantQuestions } from '../services/assistantQuestionsService'

interface BusinessQuestionsSectionProps {
  selectedQuestion: string
  onQuestionSelect: (question: string) => void
}

function getQuestionsError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return 'No tienes permisos para consultar las preguntas.'
    if (!error.response) return 'No fue posible conectar con el servicio de preguntas.'
    if (error.response.status >= 500) return 'El servicio de preguntas no está disponible temporalmente.'
  }
  return 'No fue posible cargar las preguntas frecuentes.'
}

export function BusinessQuestionsSection({
  selectedQuestion,
  onQuestionSelect,
}: BusinessQuestionsSectionProps) {
  const {
    data,
    error,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['assistant-light', 'questions'],
    queryFn: getAssistantQuestions,
  })

  return (
    <section className='business-questions card' aria-labelledby='business-questions-title'>
      <header>
        <h2 id='business-questions-title'>Preguntas frecuentes de negocio</h2>
        <p>Seleccione una pregunta o escriba la suya con sus propios datos.</p>
      </header>

      {isPending && (
        <div className='business-questions-feedback' role='status'>
          Cargando preguntas frecuentes...
        </div>
      )}

      {isError && (
        <div className='business-questions-feedback business-questions-error' role='alert'>
          <span>{getQuestionsError(error)}</span>
          <button type='button' onClick={() => void refetch()}>Reintentar</button>
        </div>
      )}

      {!isPending && !isError && data?.data.length === 0 && (
        <div className='business-questions-feedback'>No hay preguntas disponibles.</div>
      )}

      {!isPending && !isError && data && data.data.length > 0 && (
        <ol className='business-questions-grid'>
          {data.data.map((item, index) => (
            <li key={item.id}>
              <button
                className={`business-question-card${selectedQuestion === item.question ? ' selected' : ''}`}
                type='button'
                title={item.available ? item.description : 'Esta pregunta no está disponible temporalmente.'}
                onClick={() => onQuestionSelect(item.question)}
                disabled={!item.available}
              >
                <span className='business-question-number'>{index + 1}.</span>
                <span>{item.question}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
