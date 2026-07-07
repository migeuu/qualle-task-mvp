import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTaskQuery, useUsersQuery, useUpdateTask } from '../hooks/useTasks'
import { useAssignTask } from '../hooks/useAssign'
import { CommentSection } from '../components/CommentSection'
import { Spinner } from '../components/Spinner'
import { STATUS_COLORS, PRIORITY_COLORS } from '../lib/constants'
import type { TaskStatus, TaskPriority } from '../types'

const ALL_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']
const ALL_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH']

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: task, isLoading, error } = useTaskQuery(id!)
  const { data: users } = useUsersQuery()
  const assignMutation = useAssignTask()
  const updateMutation = useUpdateTask()
  const queryClient = useQueryClient()
  const [assignUserId, setAssignUserId] = useState('')
  const [editing, setEditing] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setAssignUserId('')
  }, [id])

  const assignedIds = new Set(task?.assignees?.map((a) => a.id) ?? [])
  const isAlreadyAssigned = assignUserId ? assignedIds.has(assignUserId) : false

  const handleAssign = async () => {
    if (!assignUserId.trim() || !id) return
    try {
      const currentIds = task?.assignees?.map((a) => a.id) ?? []
      const newIds = [...new Set([...currentIds, assignUserId.trim()])]
      await assignMutation.mutateAsync({ taskId: id, assigneeIds: newIds })
      toast.success('User assigned')
      setAssignUserId('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign user')
    }
  }

  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !formRef.current) return
    const fd = new FormData(formRef.current)
    const payload = {
      taskId: id,
      title: (fd.get('title') as string) || task!.title,
      description: (fd.get('description') as string) || undefined,
      status: (fd.get('status') as TaskStatus) || task!.status,
      priority: (fd.get('priority') as TaskPriority) || task!.priority,
      dueDate: (fd.get('dueDate') as string) || undefined,
    }
    try {
      const result = await updateMutation.mutateAsync(payload)
      queryClient.setQueryData(['task', id], (old: typeof task) => old ? { ...old, ...result } : result)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated')
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task')
    }
  }, [id, updateMutation, queryClient, task])

  if (isLoading) return <Spinner />

  if (error || !task) {
    return (
      <div style={styles.page}>
        <button onClick={() => navigate('/dashboard')} style={styles.backLink}>← Back to Dashboard</button>
        <div style={styles.errorBox}>
          <h2>Task not found</h2>
          <p>The task you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <button onClick={() => navigate('/dashboard')} style={styles.backLink}>← Back to Dashboard</button>

      <article style={styles.article}>
        {editing ? (
          <form ref={formRef} onSubmit={handleUpdate}>
            <header style={styles.articleHeader}>
              <input name="title" defaultValue={task.title}
                style={{ ...styles.editInput, fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }} />
              <div style={styles.badges}>
                <select name="status" defaultValue={task.status}
                  style={{ ...styles.editSelect, background: STATUS_COLORS[task.status] ?? '#9ca3af' }}>
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <select name="priority" defaultValue={task.priority}
                  style={{ ...styles.editSelect, background: PRIORITY_COLORS[task.priority] ?? '#9ca3af' }}>
                  {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </header>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Description</h2>
              <textarea name="description" defaultValue={task.description ?? ''}
                style={{ ...styles.editInput, minHeight: 100, width: '100%', resize: 'vertical' }} />
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Details</h2>
              <dl style={styles.detailList}>
                <div style={styles.detailRow}>
                  <dt style={styles.detailLabel}>Due Date</dt>
                  <dd style={styles.detailValue}>
                    <input type="date" name="dueDate" defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                      style={styles.editInput} />
                  </dd>
                </div>
                <div style={styles.detailRow}>
                  <dt style={styles.detailLabel}>Created by</dt>
                  <dd style={styles.detailValue}>{task.creator?.name ?? task.creator?.email ?? 'Unknown'}</dd>
                </div>
                <div style={styles.detailRow}>
                  <dt style={styles.detailLabel}>Assignees</dt>
                  <dd style={styles.detailValue}>
                    {task.assignees && task.assignees.length > 0
                      ? task.assignees.map((a) => a.name ?? a.email).join(', ')
                      : 'No assignees'}
                  </dd>
                </div>
              </dl>
            </section>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={updateMutation.isPending}
                style={{ ...styles.editBtn, background: '#22c55e' }}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{ ...styles.editBtn, background: '#9ca3af' }}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <header style={styles.articleHeader}>
              <h1 style={styles.taskTitle}>{task.title}</h1>
              <div style={styles.badges}>
                <span style={{ ...styles.badge, background: STATUS_COLORS[task.status] ?? '#9ca3af' }}>
                  {task.status?.replace('_', ' ') ?? 'Unknown'}
                </span>
                <span style={{ ...styles.badge, background: PRIORITY_COLORS[task.priority] ?? '#9ca3af' }}>
                  {task.priority ?? 'No priority'}
                </span>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <button onClick={() => setEditing(true)} style={{ ...styles.editBtn, background: '#4f46e5' }}>Edit Task</button>
              </div>
            </header>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Description</h2>
              {task.description ? <p style={styles.description}>{task.description}</p> : <p style={{ color: '#999', fontStyle: 'italic' }}>No description</p>}
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Details</h2>
              <dl style={styles.detailList}>
                <div style={styles.detailRow}>
                  <dt style={styles.detailLabel}>Due Date</dt>
                  <dd style={styles.detailValue}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</dd>
                </div>
                <div style={styles.detailRow}>
                  <dt style={styles.detailLabel}>Created by</dt>
                  <dd style={styles.detailValue}>{task.creator?.name ?? task.creator?.email ?? 'Unknown'}</dd>
                </div>
                <div style={styles.detailRow}>
                  <dt style={styles.detailLabel}>Assignees</dt>
                  <dd style={styles.detailValue}>
                    {task.assignees && task.assignees.length > 0
                      ? task.assignees.map((a) => a.name ?? a.email).join(', ')
                      : 'No assignees'}
                  </dd>
                </div>
              </dl>
            </section>
          </>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Assign User</h2>
          <div style={styles.assignRow}>
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} style={styles.assignInput}>
              <option value="">Select a user...</option>
              {users?.map((u) => {
                const alreadyAssigned = assignedIds.has(u.id)
                return (
                  <option key={u.id} value={u.id} disabled={alreadyAssigned}>
                    {u.name} ({u.email}){alreadyAssigned ? ' — assigned' : ''}
                  </option>
                )
              })}
            </select>
            <button onClick={handleAssign}
              disabled={assignMutation.isPending || !assignUserId.trim() || isAlreadyAssigned}
              style={{ ...styles.assignButton, opacity: assignMutation.isPending || !assignUserId.trim() ? 0.6 : 1 }}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Comments</h2>
          <CommentSection taskId={task.id} comments={task.comments} />
        </section>
      </article>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' },
  backLink: { background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '1.5rem', display: 'inline-block' },
  article: { background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  articleHeader: { marginBottom: '1.5rem' },
  taskTitle: { fontSize: '1.75rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.75rem' },
  badges: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  badge: { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.025em' },
  section: { marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' },
  sectionTitle: { fontSize: '1.05rem', fontWeight: 600, color: '#555', marginBottom: '0.75rem' },
  description: { fontSize: '1rem', lineHeight: 1.7, color: '#444', whiteSpace: 'pre-wrap' as const },
  detailList: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  detailRow: { display: 'flex', gap: '0.5rem' },
  detailLabel: { fontWeight: 600, color: '#666', minWidth: 120, fontSize: '0.9rem' },
  detailValue: { color: '#333', fontSize: '0.9rem' },
  assignRow: { display: 'flex', gap: '0.5rem' },
  assignInput: { flex: 1, padding: '0.625rem 0.75rem', fontSize: '0.95rem', border: '1px solid #ddd', borderRadius: 8, outline: 'none' },
  assignButton: { padding: '0.625rem 1.25rem', fontSize: '0.95rem', fontWeight: 600, color: '#fff', background: '#4f46e5', border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  editBtn: { padding: '0.4rem 1rem', fontSize: '0.9rem', fontWeight: 600, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  editInput: { padding: '0.5rem 0.75rem', fontSize: '0.95rem', border: '1px solid #ddd', borderRadius: 6, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  editSelect: { padding: '0.35rem 0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer', textTransform: 'uppercase' as const, letterSpacing: '0.025em' },
  errorBox: { textAlign: 'center', padding: '3rem 1rem', color: '#999' },
}
