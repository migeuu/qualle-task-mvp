export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  task?: Task;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  creator: User;
  assignees: User[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  accessToken: string;
  user: User;
}

export interface TaskPage {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface TaskFilterInput {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface AssignTaskInput {
  taskId: string;
  assigneeIds: string[];
}

export interface CreateCommentInput {
  taskId: string;
  content: string;
}

export interface TaskUpdatedPayload {
  taskUpdated: Task;
}

export interface TaskAssignedPayload {
  taskAssigned: Task;
}

export interface NewCommentPayload {
  newComment: Comment;
}

export interface NotificationPayload {
  message: string;
  timestamp: string;
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: {
    message: string;
    extensions?: {
      originalError?: {
        message?: string;
      };
    };
  }[];
}
