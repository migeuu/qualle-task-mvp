import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getSubscriptionClient, reconnectSubscriptionClient, disconnectSubscriptionClient } from '../lib/graphql-ws-client'
import { getToken } from '../lib/auth'

interface TaskUpdatedData {
  taskUpdated: {
    taskUpdated: {
      id: string
      title: string
      status: string
      priority: string
    }
  }
}

interface TaskAssignedData {
  taskAssigned: {
    taskAssigned: {
      id: string
      title: string
    }
  }
}

interface NewCommentData {
  newComment: {
    newComment: {
      id: string
      content: string
      task: { id: string }
    }
  }
}

const TASK_UPDATED_SUB = /* GraphQL */ `
  subscription TaskUpdated {
    taskUpdated {
      taskUpdated {
        id
        title
        status
        priority
      }
    }
  }
`

const TASK_ASSIGNED_SUB = /* GraphQL */ `
  subscription TaskAssigned {
    taskAssigned {
      taskAssigned {
        id
        title
      }
    }
  }
`

const NEW_COMMENT_SUB = /* GraphQL */ `
  subscription NewComment {
    newComment {
      newComment {
        id
        content
        task {
          id
        }
      }
    }
  }
`

const sinkComplete = { complete: () => {} }

export function useGraphQLSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = getToken()
    if (!token) {
      return
    }

    reconnectSubscriptionClient()
    const client = getSubscriptionClient()

    const taskUpdatedCleanup = client.subscribe<TaskUpdatedData>(
      { query: TASK_UPDATED_SUB },
      {
        next: () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          queryClient.invalidateQueries({ queryKey: ['task'] })
        },
        error: (err: unknown) => {
          console.error('taskUpdated subscription error:', err)
        },
        ...sinkComplete,
      },
    )

    const taskAssignedCleanup = client.subscribe<TaskAssignedData>(
      { query: TASK_ASSIGNED_SUB },
      {
        next: (data) => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          const title = data.data?.taskAssigned?.taskAssigned?.title
          if (title) {
            toast(`You have been assigned to "${title}"`)
          }
        },
        error: (err: unknown) => {
          console.error('taskAssigned subscription error:', err)
        },
        ...sinkComplete,
      },
    )

    const newCommentCleanup = client.subscribe<NewCommentData>(
      { query: NEW_COMMENT_SUB },
      {
        next: (data) => {
          const taskId = data.data?.newComment?.newComment?.task?.id
          if (taskId) {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] })
          }
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        },
        error: (err: unknown) => {
          console.error('newComment subscription error:', err)
        },
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
