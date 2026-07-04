import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocketEffect } from '../hooks/useSocket'
import { NotificationBadge } from './NotificationBadge'

export function Layout() {
  const { user, logout } = useAuth()

  useSocketEffect()

  return (
    <>
      <header
        style={{
          background: '#1a1a2e',
          color: 'white',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 60,
        }}
      >
        <Link
          to="/dashboard"
          style={{ color: 'white', textDecoration: 'none', fontSize: 20, fontWeight: 'bold' }}
        >
          Qualle Task
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14 }}>
            {user?.name ?? user?.email}
          </span>
          <NotificationBadge />
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid white',
              color: 'white',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <Outlet />
      </main>
    </>
  )
}
