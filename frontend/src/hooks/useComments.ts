import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task, CreateCommentInput } from '../types'
import { gqlRequest } from '../lib/graphql'

export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      gqlRequest<{ addComment: Task }>(
        `mutation AddComment($input: CreateCommentInput!) {
          addComment(input: $input) {
            id
            comments { id content author { id name email } createdAt }
          }
        }`,
        { input },
      ).then((r) => r.addComment),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
    },
  })
}
