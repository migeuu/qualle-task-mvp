import { Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../domain/repositories/task.repository';
import {
  TaskNotFoundException,
  NotTaskOwnerException,
  NotAuthorizedToAssignException,
} from '../../../../shared/exceptions/business.exceptions';

@Injectable()
export class AuthorizationService {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async ensureTaskOwner(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new TaskNotFoundException();
    }
    if (task.creatorId !== userId) {
      throw new NotTaskOwnerException();
    }
  }

  async ensureCanAssign(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new TaskNotFoundException();
    }
    if (task.creatorId !== userId) {
      throw new NotAuthorizedToAssignException();
    }
  }

  async ensureTaskParticipant(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findByIdWithAssignees(taskId);
    if (!task) {
      throw new TaskNotFoundException();
    }
    const isParticipant =
      task.creatorId === userId || task.assigneeIds.includes(userId);
    if (!isParticipant) {
      throw new NotTaskOwnerException();
    }
  }
}
