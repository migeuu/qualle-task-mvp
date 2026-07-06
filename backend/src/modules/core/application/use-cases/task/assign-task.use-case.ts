import { Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { ITaskEventBus } from '../../services/task-event-bus.service';
import { AuthorizationService } from '../../services/authorization.service';
import { TaskDto } from '../../dtos/task.dto';
import { TaskMapper } from '../../mappers/task.mapper';
import { TaskEventVO } from '../../../domain/value-objects/task-event.vo';

@Injectable()
export class AssignTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly userRepo: IUserRepository,
    private readonly taskEventBus: ITaskEventBus,
    private readonly authz: AuthorizationService,
  ) {}

  async execute(input: {
    taskId: string;
    loggedUserId: string;
    assigneeIds: string[];
  }): Promise<TaskDto> {
    await this.authz.ensureCanAssign(input.taskId, input.loggedUserId);

    const task = await this.taskRepo.findByIdWithAssignees(input.taskId);
    if (!task) {
      throw new Error('Resource not found');
    }

    for (const assigneeId of input.assigneeIds) {
      const user = await this.userRepo.findById(assigneeId);
      if (!user) {
        throw new Error('Resource not found');
      }
    }

    await this.taskRepo.replaceAssignees(input.taskId, input.assigneeIds);

    const updated = await this.taskRepo.findByIdWithAssignees(input.taskId);

    const affectedUsers = [...new Set([task.creatorId, ...input.assigneeIds])];
    this.taskEventBus.publish(
      new TaskEventVO(
        input.taskId,
        input.loggedUserId,
        'TASK_ASSIGNED',
        affectedUsers,
      ),
    );

    return TaskMapper.toDto(updated!);
  }
}
