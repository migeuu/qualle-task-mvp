import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task, AssignTaskInput } from '../types'
import { gqlRequest } from '../lib/graphql'

export function useAssignTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignTaskInput) =>
      gqlRequest<{ assignTask: Task }>(
        `mutation AssignTask($input: AssignTaskInput!) {
          assignTask(input: $input) {
            id assignees { id name email }
          }
        }`,
        { input },
      ).then((r) => r.assignTask),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
