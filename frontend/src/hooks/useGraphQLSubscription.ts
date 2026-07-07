import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getSubscriptionClient, reconnectSubscriptionClient, disconnectSubscriptionClient } from '../lib/graphql-ws-client'
import { getToken } from '../lib/auth'

interface TaskNotification {
  taskId: string
  eventAuthorId: string
  eventType: string
}

const TASK_UPDATED_SUB = /* GraphQL */ `
  subscription TaskUpdated {
    taskUpdated { taskId eventAuthorId eventType }
  }
`

const TASK_ASSIGNED_SUB = /* GraphQL */ `
  subscription TaskAssigned {
    taskAssigned { taskId eventAuthorId eventType }
  }
`

const NEW_COMMENT_SUB = /* GraphQL */ `
  subscription NewComment {
    newComment { taskId eventAuthorId eventType }
  }
`

const sinkComplete = { complete: () => {} }

const invalidateTask = (queryClient: ReturnType<typeof useQueryClient>, notification: TaskNotification) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
  if (notification?.taskId) {
    queryClient.invalidateQueries({ queryKey: ['task', notification.taskId] })
  }
}

export function useGraphQLSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = getToken()
    if (!token) return

    reconnectSubscriptionClient()
    const client = getSubscriptionClient()

    const taskUpdatedCleanup = client.subscribe<{ taskUpdated: TaskNotification }>(
      { query: TASK_UPDATED_SUB },
      {
        next: ({ data }) => {
          invalidateTask(queryClient, data.taskUpdated)
          toast('A task was updated', { icon: '🔄' })
        },
        error: () => {},
        ...sinkComplete,
      },
    )

    const taskAssignedCleanup = client.subscribe<{ taskAssigned: TaskNotification }>(
      { query: TASK_ASSIGNED_SUB },
      {
        next: () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          toast('You have been assigned to a task', { icon: '👤' })
        },
        error: () => {},
        ...sinkComplete,
      },
    )

    const newCommentCleanup = client.subscribe<{ newComment: TaskNotification }>(
      { query: NEW_COMMENT_SUB },
      {
        next: ({ data }) => {
          invalidateTask(queryClient, data.newComment)
          toast('New comment on a task', { icon: '💬' })
        },
        error: () => {},
        ...sinkComplete,
      },
    )

    return () => {
      taskUpdatedCleanup()
      taskAssignedCleanup()
      newCommentCleanup()
      disconnectSubscriptionClient()
    }
  }, [queryClient])
}
