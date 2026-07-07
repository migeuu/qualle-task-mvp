import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { ICommentRepository } from '../../../domain/repositories/comment.repository';
import { ITaskEventBus } from '../../services/task-event-bus.service';
import { AuthorizationService } from '../../services/authorization.service';
import { UserNotFoundException } from '../../../../../shared/exceptions/business.exceptions';
import { Task } from '../../../domain/entities/task.entity';
import { Comment } from '../../../domain/entities/comment.entity';
import { TaskDto } from '../../dtos/task.dto';
import { TaskMapper } from '../../mappers/task.mapper';
import { TaskEventVO } from '../../../domain/value-objects/task-event.vo';

@Injectable()
export class AddTaskCommentUseCase {
  constructor(
    @Inject('ITaskRepository') private readonly taskRepo: ITaskRepository,
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    @Inject('ICommentRepository') private readonly commentRepo: ICommentRepository,
    @Inject('ITaskEventBus') private readonly taskEventBus: ITaskEventBus,
    private readonly authz: AuthorizationService,
  ) {}

  async execute(input: {
    taskId: string;
    userId: string;
    content: string;
  }): Promise<TaskDto> {
    await this.authz.ensureTaskParticipant(input.taskId, input.userId);

    const task = await this.taskRepo.findByIdWithAssignees(input.taskId);
    if (!task) {
      throw new Error('Task not found after authorization check');
    }

    const author = await this.userRepo.findById(input.userId);
    if (!author) {
      throw new UserNotFoundException();
    }

    const comment = new Comment(
      uuid(),
      input.content,
      input.taskId,
      input.userId,
      new Date(),
      new Date(),
    );

    await this.commentRepo.create(comment);

    const updatedTask = await this.taskRepo.findById(input.taskId);

    const affectedUsers = [...new Set([task.creatorId, ...task.assigneeIds])];
    this.taskEventBus.publish(
      new TaskEventVO(
        input.taskId,
        input.userId,
        'TASK_NEW_COMMENT',
        affectedUsers,
      ),
    );

    return TaskMapper.toDto(updatedTask as Task);
  }
}
