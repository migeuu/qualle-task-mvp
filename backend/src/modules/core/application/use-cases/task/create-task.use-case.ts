import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { ITaskEventBus } from '../../services/task-event-bus.service';
import { Task } from '../../../domain/entities/task.entity';
import { TaskDto } from '../../dtos/task.dto';
import { TaskMapper } from '../../mappers/task.mapper';
import { TaskStatus, TaskPriority } from '../../../domain/enums/task.enum';
import { TaskEventVO } from '../../../domain/value-objects/task-event.vo';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly userRepo: IUserRepository,
    private readonly taskEventBus: ITaskEventBus,
  ) {}

  async execute(input: {
    creatorId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
  }): Promise<TaskDto> {
    const creator = await this.userRepo.findById(input.creatorId);
    if (!creator) {
      throw new Error('Resource not found');
    }

    const task = new Task(
      uuid(),
      input.title,
      input.description ?? null,
      input.status ?? TaskStatus.TODO,
      input.priority ?? TaskPriority.MEDIUM,
      input.dueDate ?? null,
      input.creatorId,
      new Date(),
      new Date(),
      [],
      [],
    );

    const created = await this.taskRepo.create(task);

    this.taskEventBus.publish(
      new TaskEventVO(created.id, input.creatorId, 'TASK_UPDATED', []),
    );

    return TaskMapper.toDto(created);
  }
}
