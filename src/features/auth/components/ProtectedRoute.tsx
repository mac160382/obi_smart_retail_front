import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSessionValid, useAuthStore } from '../store/authStore'

export function ProtectedRoute() {
  const session = useAuthStore((state) => state.session)
  const location = useLocation()

  if (!isSessionValid(session)) {
    return <Navigate to='/login' replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session)

  if (isSessionValid(session)) {
    return <Navigate to='/dashboard' replace />
  }

  return children
}

export function HomeRedirect() {
  const session = useAuthStore((state) => state.session)
  return <Navigate to={isSessionValid(session) ? '/dashboard' : '/login'} replace />
}
