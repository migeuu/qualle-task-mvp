import { useState } from 'react'

interface Notification {
  message: string
  timestamp: string
}

export function NotificationBadge() {
  const [notifications] = useState<Notification[]>([])
  const count = notifications.length

  return (
    <span style={{ position: 'relative', cursor: 'pointer', fontSize: 18 }}>
      {'\u{1F514}'}
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -8,
            background: '#d32f2f',
            color: 'white',
            borderRadius: '50%',
            minWidth: 18,
            height: 18,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            lineHeight: 1,
            padding: '0 3px',
            boxSizing: 'border-box',
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  )
}
