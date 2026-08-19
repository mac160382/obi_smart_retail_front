import { Route, Routes } from 'react-router-dom'
import { AuthSessionManager } from '../features/auth/components/AuthSessionManager'
import { HomeRedirect, ProtectedRoute, PublicOnlyRoute } from '../features/auth/components/ProtectedRoute'
import { DashboardPage } from '../pages/DashboardPage'
import { CsvImportsPage } from '../pages/CsvImportsPage'
import { InventoryPage } from '../pages/InventoryPage'
import { LoginPage } from '../pages/LoginPage'
import { SuggestedOrderEventsManager } from '../features/suggestedOrders/components/SuggestedOrderEventsManager'

export default function App() {
  return (
    <>
      <AuthSessionManager />
      <SuggestedOrderEventsManager />
      <Routes>
        <Route path='/' element={<HomeRedirect />} />
        <Route path='/login' element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route element={<ProtectedRoute />}>
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/inventory' element={<InventoryPage />} />
          <Route path='/imports' element={<CsvImportsPage />} />
        </Route>
        <Route path='*' element={<HomeRedirect />} />
      </Routes>
    </>
  )
}
