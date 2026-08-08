import axios, { AxiosError } from 'axios'
import { isSessionValid, useAuthStore } from '../../features/auth/store/authStore'

const LOGIN_PATH = '/auth/login'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    Accept: 'application/json',
  },
})

function isLoginRequest(url?: string) {
  return Boolean(url?.split('?')[0].endsWith(LOGIN_PATH))
}

apiClient.interceptors.request.use((config) => {
  if (isLoginRequest(config.url)) return config

  const { session, clearSession } = useAuthStore.getState()
  if (session && !isSessionValid(session)) {
    clearSession()
    return Promise.reject(
      new AxiosError('La sesión expiró.', 'AUTH_SESSION_EXPIRED', config),
    )
  }

  if (session) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !isLoginRequest(error.config?.url)) {
      useAuthStore.getState().clearSession()
    }

    return Promise.reject(error)
  },
)
