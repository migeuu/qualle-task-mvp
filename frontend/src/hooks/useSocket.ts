import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getSocket } from '../lib/socket'
import { getToken } from '../lib/auth'
import type { NotificationPayload } from '../types'

export function useSocketEffect() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!getToken()) return

    const socket = getSocket()

    function handleNotification(payload: NotificationPayload) {
      toast(payload.message)
    }

    function handleTaskUpdate(data: { taskId: string; eventAuthorId: string; eventType: string }) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (data?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', data.taskId] })
      }
      if (data?.eventType === 'TASK_NEW_COMMENT') {
        toast('New comment on a task', { icon: '💬' })
      } else {
        toast('A task was updated', { icon: '🔄' })
      }
    }

    socket.on('notification', handleNotification)
    socket.on('task.update', handleTaskUpdate)

    return () => {
      socket.off('notification', handleNotification)
      socket.off('task.update', handleTaskUpdate)
    }
  }, [queryClient])
}
