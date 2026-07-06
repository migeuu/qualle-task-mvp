import { Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { ITaskEventBus } from '../../services/task-event-bus.service';
import { AuthorizationService } from '../../services/authorization.service';
import { Task } from '../../../domain/entities/task.entity';
import { TaskDto } from '../../dtos/task.dto';
import { TaskMapper } from '../../mappers/task.mapper';
import { TaskStatus, TaskPriority } from '../../../domain/enums/task.enum';
import { TaskEventVO } from '../../../domain/value-objects/task-event.vo';

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly taskEventBus: ITaskEventBus,
    private readonly authz: AuthorizationService,
  ) {}

  async execute(input: {
    taskId: string;
    userId: string;
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
  }): Promise<TaskDto> {
    await this.authz.ensureTaskOwner(input.taskId, input.userId);

    const task = await this.taskRepo.findById(input.taskId);
    if (!task) {
      throw new Error('Resource not found');
    }

    const updated = new Task(
      task.id,
      input.title ?? task.title,
      input.description !== undefined ? input.description : task.description,
      input.status ?? task.status,
      input.priority ?? task.priority,
      input.dueDate !== undefined ? input.dueDate : task.dueDate,
      task.creatorId,
      task.createdAt,
      new Date(),
      task.assigneeIds,
      task.commentIds,
    );

    const saved = await this.taskRepo.save(updated);

    const affectedUsers = [...new Set([task.creatorId, ...task.assigneeIds])];
    this.taskEventBus.publish(
      new TaskEventVO(saved.id, input.userId, 'TASK_UPDATED', affectedUsers),
    );

    return TaskMapper.toDto(saved);
  }
}
