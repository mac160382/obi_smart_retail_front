import { Route, Routes } from 'react-router-dom'
import { AuthSessionManager } from '../features/auth/components/AuthSessionManager'
import { HomeRedirect, ProtectedRoute, PublicOnlyRoute } from '../features/auth/components/ProtectedRoute'
import { DashboardPage } from '../pages/DashboardPage'
import { CsvImportsPage } from '../pages/CsvImportsPage'
import { LoginPage } from '../pages/LoginPage'

export default function App() {
  return (
    <>
      <AuthSessionManager />
      <Routes>
        <Route path='/' element={<HomeRedirect />} />
        <Route path='/login' element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route element={<ProtectedRoute />}>
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/imports' element={<CsvImportsPage />} />
        </Route>
        <Route path='*' element={<HomeRedirect />} />
      </Routes>
    </>
  )
}
