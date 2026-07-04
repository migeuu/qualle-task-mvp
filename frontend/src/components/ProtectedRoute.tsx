import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './Spinner'

export function ProtectedRoute() {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return <Spinner />
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Outlet />
    </div>
  )
}
