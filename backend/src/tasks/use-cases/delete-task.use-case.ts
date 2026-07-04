import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { TaskNotFoundException, NotTaskOwnerException } from '../../shared/exceptions/business.exceptions';

@Injectable()
export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, userId: string): Promise<boolean> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new TaskNotFoundException();
    }

    if (task.creatorId !== userId) {
      throw new NotTaskOwnerException();
    }

    return this.taskRepository.delete(id);
  }
}
