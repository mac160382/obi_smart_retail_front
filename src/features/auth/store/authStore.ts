import { create } from 'zustand'
import type { AuthSession, LoginResponse } from '../types/auth'

const AUTH_STORAGE_KEY = 'obi-smart-retail.auth'

interface AuthState {
  session: AuthSession | null
  startSession: (response: LoginResponse, username: string) => void
  clearSession: () => void
}

export function isSessionValid(session: AuthSession | null): session is AuthSession {
  return Boolean(session?.accessToken && session.expiresAt > Date.now())
}

function removeStoredSession() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const rawSession = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!rawSession) return null

    const session = JSON.parse(rawSession) as AuthSession
    if (
      typeof session.accessToken !== 'string' ||
      typeof session.tokenType !== 'string' ||
      typeof session.expiresAt !== 'number' ||
      !isSessionValid(session)
    ) {
      removeStoredSession()
      return null
    }

    return session
  } catch {
    removeStoredSession()
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: readStoredSession(),
  startSession: (response, username) => {
    const expiresIn = Number(response.expires_in)
    if (!response.access_token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error('La respuesta de autenticación no contiene una sesión válida.')
    }

    const session: AuthSession = {
      accessToken: response.access_token,
      tokenType: response.token_type?.trim() || 'bearer',
      expiresAt: Date.now() + expiresIn * 1000,
      username: username.trim(),
      loginAt: Date.now(),
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    set({ session })
  },
  clearSession: () => {
    removeStoredSession()
    set({ session: null })
  },
}))
