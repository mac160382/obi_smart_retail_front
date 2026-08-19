import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import './styles/global.css'
import './styles/auth.css'
import './styles/user-menu.css'
import './styles/dashboard-stats.css'
import './styles/catalogs.css'
import './styles/imports.css'
import './styles/historical-import.css'
import './styles/suggested-orders.css'
import './styles/assistant-questions.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
