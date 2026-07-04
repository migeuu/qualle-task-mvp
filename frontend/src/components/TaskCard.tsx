import type { Task } from '../types'
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../lib/constants'
import { formatDate } from '../lib/date'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const commentCount = task.comments?.length ?? 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        background: 'white',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1a1a2e'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e0e0e0'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' }}>
          {task.title}
        </h3>
        <span
          style={{
            background: STATUS_COLORS[task.status] ?? '#9e9e9e',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          {STATUS_LABELS[task.status] ?? task.status}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#666', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: PRIORITY_COLORS[task.priority] ?? '#9e9e9e',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {task.priority}
        </span>
        {task.creator && (
          <span>{task.creator.name ?? task.creator.email}</span>
        )}
        {task.dueDate && (
          <span>{formatDate(task.dueDate)}</span>
        )}
        {commentCount > 0 && (
          <span>
            {commentCount} comment{commentCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
