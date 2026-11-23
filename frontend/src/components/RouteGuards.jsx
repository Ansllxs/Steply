import { Navigate, useLocation } from 'react-router-dom'
import LoadingIndicator from './LoadingIndicator'
import { useAuth } from '../state/useAuth'

function PendingSession() {
  return (
    <main className="auth">
      <div className="auth-frame">
        <LoadingIndicator />
      </div>
    </main>
  )
}

export function RequireAuth({ children }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PendingSession />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}

export function RedirectIfAuthenticated({ children }) {
  const { user, status, holding } = useAuth()

  if (status === 'loading') return <PendingSession />
  if (user && !holding) return <Navigate to="/dashboard" replace />

  return children
}
