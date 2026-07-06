import { Injectable } from '@nestjs/common';
import { ITaskRepository, TaskFilterParams } from '../../../domain/repositories/task.repository';
import { TaskDto } from '../../dtos/task.dto';
import { PaginatedResult } from '../../dtos/paginated-result.dto';
import { TaskMapper } from '../../mappers/task.mapper';

@Injectable()
export class FindTasksPaginatedUseCase {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(
    page: number,
    limit: number,
    filter?: TaskFilterParams,
  ): Promise<PaginatedResult<TaskDto>> {
    const result = await this.taskRepo.findAll(page, limit, filter);
    return {
      data: result.data.map(TaskMapper.toDto),
      total: result.total,
      page,
      limit,
    };
  }
}
