import { Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../../domain/repositories/task.repository';

@Injectable()
export class DeleteTaskUseCase {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new Error('Resource not found');
    }
    await this.taskRepo.delete(taskId);
  }
}
