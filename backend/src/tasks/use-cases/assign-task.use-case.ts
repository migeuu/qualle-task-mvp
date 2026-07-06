import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { UserRepository } from '../../auth/repositories/user.repository';
import { EventsService } from '../../events/events.service';
import { Task } from '../domain/task.entity';
import {
  TaskNotFoundException,
  UserNotFoundException,
  NotAuthorizedToAssignException,
} from '../../shared/exceptions/business.exceptions';

@Injectable()
export class AssignTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
    private readonly eventsService: EventsService,
  ) {}

  async execute(taskId: string, userId: string, currentUserId: string): Promise<Task> {
    const task = await this.taskRepository.findByIdWithAssignees(taskId);

    if (!task) {
      throw new TaskNotFoundException();
    }

    if (task.creatorId !== currentUserId) {
      throw new NotAuthorizedToAssignException();
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const alreadyAssigned = task.assignees.some((u) => u.id === userId);

    if (!alreadyAssigned) {
      task.assignees.push(user);
      await this.taskRepository.save(task);
    }

    const fullTask = (await this.taskRepository.findById(taskId))!;

    if (!alreadyAssigned) {
      this.eventsService.taskAssigned(fullTask, userId);
    }

    return fullTask;
  }
}
