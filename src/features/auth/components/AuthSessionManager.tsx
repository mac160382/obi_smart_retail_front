import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const SESSION_CHECK_INTERVAL = 60_000

export function AuthSessionManager() {
  const session = useAuthStore((state) => state.session)
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!session) {
      queryClient.clear()
      return
    }

    let timeoutId: number

    const scheduleExpirationCheck = () => {
      const remainingTime = session.expiresAt - Date.now()
      if (remainingTime <= 0) {
        clearSession()
        return
      }

      timeoutId = window.setTimeout(
        scheduleExpirationCheck,
        Math.min(remainingTime, SESSION_CHECK_INTERVAL),
      )
    }

    scheduleExpirationCheck()
    return () => window.clearTimeout(timeoutId)
  }, [clearSession, queryClient, session])

  return null
}
