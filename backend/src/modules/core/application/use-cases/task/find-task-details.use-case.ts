import { Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { TaskDto } from '../../dtos/task.dto';
import { TaskMapper } from '../../mappers/task.mapper';
import { TaskNotFoundException } from '../../../../../shared/exceptions/business.exceptions';

@Injectable()
export class FindTaskDetailsUseCase {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(taskId: string): Promise<TaskDto> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new TaskNotFoundException();
    }
    return TaskMapper.toDto(task);
  }
}
