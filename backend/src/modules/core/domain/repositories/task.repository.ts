import { Task } from '../entities/task.entity';
import { TaskStatus } from '../enums/task.enum';
import { TaskPriority } from '../enums/task.enum';

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByIdWithAssignees(id: string): Promise<Task | null>;
  findAll(
    page: number,
    limit: number,
    filter?: TaskFilterParams,
  ): Promise<{ data: Task[]; total: number }>;
  create(task: Task): Promise<Task>;
  save(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
  replaceAssignees(taskId: string, assigneeIds: string[]): Promise<void>;
}
