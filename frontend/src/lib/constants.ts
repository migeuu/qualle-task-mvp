import type { TaskStatus, TaskPriority } from '../types'

export const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: '#9e9e9e',
  IN_PROGRESS: '#3b82f6',
  DONE: '#10b981',
  CANCELLED: '#ef4444',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: '#9ca3af',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
}
