import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Task,
  TaskPage,
  TaskFilterInput,
  PaginationInput,
  CreateTaskInput,
  UpdateTaskInput,
  User,
} from '../types'
import { gqlRequest } from '../lib/graphql'
import { getToken } from '../lib/auth'

const TASK_FIELDS = `
  id title description status priority dueDate
  creator { id name email }
  assignees { id name email }
  comments { id }
  createdAt updatedAt
`

export function useTasksQuery(
  filter: TaskFilterInput,
  pagination: PaginationInput,
) {
  return useQuery<TaskPage>({
    queryKey: ['tasks', filter, pagination],
    queryFn: () =>
      gqlRequest<{ tasks: TaskPage }>(
        `query Tasks($filter: TaskFilterInput, $pagination: PaginationInput) {
          tasks(filter: $filter, pagination: $pagination) {
            items { ${TASK_FIELDS} }
            total
          }
        }`,
        { filter, pagination },
      ).then((r) => r.tasks),
    staleTime: 30_000,
    enabled: !!getToken(),
  })
}

export function useTaskQuery(id: string) {
  return useQuery<Task>({
    queryKey: ['task', id],
    queryFn: () =>
      gqlRequest<{ task: Task }>(
        `query Task($id: ID!) {
          task(id: $id) {
            id title description status priority dueDate
            creator { id name email }
            assignees { id name email }
            comments { id content author { id name email } createdAt }
            createdAt updatedAt
          }
        }`,
        { id },
      ).then((r) => r.task),
    staleTime: 30_000,
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      gqlRequest<{
        createTask: Task
      }>(
        `mutation CreateTask($input: CreateTaskInput!) {
          createTask(input: $input) {
            id title description status priority dueDate createdAt
          }
        }`,
        { input },
      ).then((r) => r.createTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateTaskInput) =>
      gqlRequest<{
        updateTask: Task
      }>(
        `mutation UpdateTask($input: UpdateTaskInput!) {
          updateTask(input: $input) {
            id title description status priority dueDate
          }
        }`,
        { input },
      ).then((r) => r.updateTask),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deleteTask: boolean }>(
        `mutation DeleteTask($id: ID!) {
          deleteTask(id: $id)
        }`,
        { id },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUsersQuery() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () =>
      gqlRequest<{ users: User[] }>(
        `query Users {
          users { id name email }
        }`,
      ).then((r) => r.users),
    staleTime: 60_000,
    enabled: !!getToken(),
  })
}
