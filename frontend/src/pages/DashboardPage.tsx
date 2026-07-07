import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasksQuery } from '../hooks/useTasks'
import { TaskCard } from '../components/TaskCard'
import { TaskFilters } from '../components/TaskFilters'
import { TaskForm } from '../components/TaskForm'
import { Spinner } from '../components/Spinner'
import type { TaskFilterInput, PaginationInput, Task } from '../types'

export function DashboardPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<TaskFilterInput>({})
  const [pagination, setPagination] = useState<PaginationInput>({ page: 1, limit: 10 })
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, error } = useTasksQuery(filter, pagination)

  const tasks = data?.data ?? []
  const total = data?.total ?? 0

  const handleFilterChange = (newFilter: TaskFilterInput) => {
    setFilter(newFilter)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleNewTask = () => {
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.heading}>Tasks</h1>
        <button onClick={handleNewTask} style={styles.newButton}>
          + New Task
        </button>
      </header>

      <TaskFilters
        filter={filter}
        pagination={pagination}
        total={total}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
      />

      {isLoading && <Spinner />}

      {error && !isLoading && (
        <div style={styles.errorBox}>
          <p>Failed to load tasks. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && total === 0 && (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No tasks found. Create your first task!</p>
        </div>
      )}

      {!isLoading && !error && total > 0 && (
        <div style={styles.grid}>
          {tasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}

      {showForm && <TaskForm mode="create" onClose={handleCloseForm} />}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem',
    maxWidth: 1200,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  newButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#fff',
    background: '#4f46e5',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  errorBox: {
    padding: '2rem',
    textAlign: 'center',
    color: '#e53e3e',
    background: '#fff5f5',
    borderRadius: 8,
    border: '1px solid #fed7d7',
  },
  empty: {
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '1.1rem',
    color: '#888',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
  },
}
