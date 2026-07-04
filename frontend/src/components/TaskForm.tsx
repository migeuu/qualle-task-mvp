import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import type { CreateTaskInput, UpdateTaskInput } from '../types'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  initial?: Partial<CreateTaskInput & { id: string }>
  onClose: () => void
  mode: 'create' | 'edit'
}

export function TaskForm({ initial, onClose, mode }: TaskFormProps) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      status: (initial?.status as TaskFormData['status']) || undefined,
      priority: (initial?.priority as TaskFormData['priority']) || undefined,
      dueDate: initial?.dueDate ? initial.dueDate.substring(0, 16) : '',
    },
  })

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (mode === 'create') {
        await createTask.mutateAsync(data as CreateTaskInput)
        toast.success('Task created')
      } else {
        await updateTask.mutateAsync({ id: initial!.id, ...data } as UpdateTaskInput & { id: string })
        toast.success('Task updated')
      }
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          padding: 24,
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
          {mode === 'create' ? 'New Task' : 'Edit Task'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Title *</label>
            <input
              {...register('title')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
            {errors.title && (
              <span style={{ color: '#d32f2f', fontSize: 12 }}>{errors.title.message}</span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Description</label>
            <textarea
              {...register('description')}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Status</label>
            <select
              {...register('status', { setValueAs: (v: string) => v || undefined })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box',
                background: 'white',
              }}
            >
              <option value="">Select status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Priority</label>
            <select
              {...register('priority', { setValueAs: (v: string) => v || undefined })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box',
                background: 'white',
              }}
            >
              <option value="">Select priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Due Date</label>
            <input
              type="datetime-local"
              {...register('dueDate')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                borderRadius: 4,
                border: '1px solid #ccc',
                background: 'white',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 20px',
                borderRadius: 4,
                border: 'none',
                background: '#1a1a2e',
                color: 'white',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: 14,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
