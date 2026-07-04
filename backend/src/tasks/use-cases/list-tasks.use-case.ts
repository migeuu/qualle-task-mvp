import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { TaskFilterInput } from '../dto/task-filter.input';
import { PaginationInput } from '../dto/pagination.input';
import { Task } from '../domain/task.entity';

@Injectable()
export class ListTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(
    filter?: TaskFilterInput,
    pagination?: PaginationInput,
  ): Promise<{ items: Task[]; total: number }> {
    return this.taskRepository.findAll(filter, pagination);
  }
}
