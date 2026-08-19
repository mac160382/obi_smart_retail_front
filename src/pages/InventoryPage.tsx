import { useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { AssistantQuerySection } from '../features/assistant/components/AssistantQuerySection'
import { BusinessQuestionsSection } from '../features/assistant/components/BusinessQuestionsSection'

export function InventoryPage() {
  const [question, setQuestion] = useState('')

  return (
    <div className='app-shell'>
      <Sidebar />
      <main className='main inventory-main'>
        <header className='topbar card'>
          <div>
            <h1>Control de Inventario</h1>
            <p>Consulta información operativa para apoyar las decisiones de abastecimiento.</p>
          </div>
        </header>

        <BusinessQuestionsSection
          selectedQuestion={question}
          onQuestionSelect={setQuestion}
        />
        <AssistantQuerySection
          question={question}
          onQuestionChange={setQuestion}
        />

        <footer>OBI Smart · Grupo12 · 2026</footer>
      </main>
    </div>
  )
}
