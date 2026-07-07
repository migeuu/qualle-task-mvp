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

export function useGraphQLSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = getToken()
    if (!token) return

    reconnectSubscriptionClient()
    const client = getSubscriptionClient()

    const onTaskEvent = (data: TaskNotification) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (data?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', data.taskId] })
      }
    }

    const taskUpdatedCleanup = client.subscribe<{ taskUpdated: TaskNotification }>(
      { query: TASK_UPDATED_SUB },
      {
        next: ({ data }) => onTaskEvent(data.taskUpdated),
        error: (err: unknown) => console.error('taskUpdated sub error:', err),
        ...sinkComplete,
      },
    )

    const taskAssignedCleanup = client.subscribe<{ taskAssigned: TaskNotification }>(
      { query: TASK_ASSIGNED_SUB },
      {
        next: ({ data }) => {
          onTaskEvent(data.taskAssigned)
          toast('A task was assigned')
        },
        error: (err: unknown) => console.error('taskAssigned sub error:', err),
        ...sinkComplete,
      },
    )

    const newCommentCleanup = client.subscribe<{ newComment: TaskNotification }>(
      { query: NEW_COMMENT_SUB },
      {
        next: ({ data }) => {
          if (data.newComment?.taskId) {
            queryClient.invalidateQueries({ queryKey: ['task', data.newComment.taskId] })
          }
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        },
        error: (err: unknown) => console.error('newComment sub error:', err),
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
