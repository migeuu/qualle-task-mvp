import { Task } from '../../domain/entities/task.entity';
import { TaskDto } from '../dtos/task.dto';
import { UserMapper } from './user.mapper';
import { CommentMapper } from './comment.mapper';

export class TaskMapper {
  static toDto(task: Task): TaskDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      creator: task.creator ? UserMapper.toDto(task.creator) : ({} as any),
      assignees: task.assignees?.map(UserMapper.toDto) ?? [],
      comments: task.comments?.map(CommentMapper.toDto) ?? [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
