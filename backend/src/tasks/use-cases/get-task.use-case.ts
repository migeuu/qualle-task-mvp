import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { Task } from '../domain/task.entity';
import { TaskNotFoundException } from '../../shared/exceptions/business.exceptions';

@Injectable()
export class GetTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new TaskNotFoundException();
    }

    return task;
  }
}
