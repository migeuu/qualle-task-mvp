import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getSocket } from '../lib/socket'
import { getToken } from '../lib/auth'
import type { NotificationPayload } from '../types'

export function useSocketEffect() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!getToken()) {
      return
    }

    const socket = getSocket()

    function handleNotification(payload: NotificationPayload) {
      toast(payload.message)
    }

    function handleTaskUpdate() {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
    }

    socket.on('notification', handleNotification)
    socket.on('task.update', handleTaskUpdate)

    return () => {
      socket.off('notification', handleNotification)
      socket.off('task.update', handleTaskUpdate)
    }
  }, [queryClient])
}
