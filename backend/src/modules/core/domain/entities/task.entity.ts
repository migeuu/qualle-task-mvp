import { TaskStatus, TaskPriority } from '../enums/task.enum';
import { User } from './user.entity';
import { Comment } from './comment.entity';

export class Task {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly status: TaskStatus,
    public readonly priority: TaskPriority,
    public readonly dueDate: Date | null,
    public readonly creatorId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly assigneeIds: string[],
    public readonly commentIds: string[],
    public readonly creator?: User,
    public readonly assignees?: User[],
    public readonly comments?: Comment[],
  ) {}
}
