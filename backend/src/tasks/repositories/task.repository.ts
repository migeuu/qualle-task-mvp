import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Task } from '../domain/task.entity';
import { TaskFilterInput } from '../dto/task-filter.input';
import { PaginationInput } from '../dto/pagination.input';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  async findById(id: string): Promise<Task | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['creator', 'assignees', 'comments', 'comments.author'],
    });
  }

  async findByIdWithAssignees(id: string): Promise<Task | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['assignees'],
    });
  }

  async findAll(
    filter?: TaskFilterInput,
    pagination?: PaginationInput,
  ): Promise<{ items: Task[]; total: number }> {
    const { page = 1, limit = 10 } = pagination || {};
    const where: FindOptionsWhere<Task> = {};

    if (filter?.status) where.status = filter.status;
    if (filter?.priority) where.priority = filter.priority;
    if (filter?.dueDate) where.dueDate = filter.dueDate;

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: ['creator', 'assignees', 'comments'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total };
  }

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.repo.create(data);
    return this.repo.save(task);
  }

  async save(task: Task): Promise<Task> {
    return this.repo.save(task);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
