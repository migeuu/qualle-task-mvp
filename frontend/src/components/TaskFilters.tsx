import type { TaskFilterInput, PaginationInput } from '../types'

interface TaskFiltersProps {
  filter: TaskFilterInput
  pagination: PaginationInput
  total: number
  onFilterChange: (f: TaskFilterInput) => void
  onPageChange: (p: number) => void
}

export function TaskFilters({
  filter,
  pagination,
  total,
  onFilterChange,
  onPageChange,
}: TaskFiltersProps) {
  const totalPages = Math.max(1, Math.ceil(total / (pagination.limit || 10)))
  const currentPage = pagination.page || 1

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      <select
        value={filter.status ?? ''}
        onChange={(e) =>
          onFilterChange({ ...filter, status: (e.target.value || undefined) as TaskFilterInput['status'] })
        }
        style={{
          padding: '6px 12px',
          borderRadius: 4,
          border: '1px solid #ccc',
          fontSize: 14,
          background: 'white',
        }}
      >
        <option value="">All Statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <select
        value={filter.priority ?? ''}
        onChange={(e) =>
          onFilterChange({ ...filter, priority: (e.target.value || undefined) as TaskFilterInput['priority'] })
        }
        style={{
          padding: '6px 12px',
          borderRadius: 4,
          border: '1px solid #ccc',
          fontSize: 14,
          background: 'white',
        }}
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: '6px 12px',
            borderRadius: 4,
            border: '1px solid #ccc',
            background: currentPage <= 1 ? '#f5f5f5' : 'white',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          Previous
        </button>
        <span style={{ fontSize: 14, color: '#555' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '6px 12px',
            borderRadius: 4,
            border: '1px solid #ccc',
            background: currentPage >= totalPages ? '#f5f5f5' : 'white',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
