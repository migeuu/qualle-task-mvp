import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import {
  ITaskRepository,
  TaskFilterParams,
} from '../../../domain/repositories/task.repository';
import { Task } from '../../../domain/entities/task.entity';
import { User } from '../../../domain/entities/user.entity';
import { Comment } from '../../../domain/entities/comment.entity';
import { TaskTypeormEntity } from '../entities/task.typeorm-entity';

@Injectable()
export class TaskTypeormRepository implements ITaskRepository {
  constructor(
    @InjectEntityManager()
    private readonly em: EntityManager,
  ) {}

  async findById(id: string): Promise<Task | null> {
    const orm = await this.em.findOne(TaskTypeormEntity, {
      where: { id },
      relations: ['creator', 'assignees', 'comments', 'comments.author'],
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findByIdWithAssignees(id: string): Promise<Task | null> {
    const orm = await this.em.findOne(TaskTypeormEntity, {
      where: { id },
      relations: ['creator', 'assignees'],
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(
    page: number,
    limit: number,
    filter?: TaskFilterParams,
  ): Promise<{ data: Task[]; total: number }> {
    const qb = this.em
      .createQueryBuilder(TaskTypeormEntity, 'task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('task.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor');

    if (filter?.status) {
      qb.andWhere('task.status = :status', { status: filter.status });
    }
    if (filter?.priority) {
      qb.andWhere('task.priority = :priority', { priority: filter.priority });
    }
    if (filter?.dueDate) {
      qb.andWhere('task.dueDate = :dueDate', { dueDate: filter.dueDate });
    }

    qb.orderBy('task.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { data: items.map((i) => this.toDomain(i)), total };
  }

  async create(task: Task): Promise<Task> {
    const orm = this.em.create(TaskTypeormEntity, {
      id: task.id || uuid(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      creatorId: task.creatorId,
      createdAt: task.createdAt || new Date(),
      updatedAt: task.updatedAt || new Date(),
    });
    const saved = await this.em.save(orm);
    const full = await this.em.findOne(TaskTypeormEntity, {
      where: { id: saved.id },
      relations: ['creator', 'assignees', 'comments', 'comments.author'],
    });
    return this.toDomain(full!);
  }

  async save(task: Task): Promise<Task> {
    await this.em.update(TaskTypeormEntity, task.id, {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      updatedAt: task.updatedAt,
    });
    const full = await this.em.findOne(TaskTypeormEntity, {
      where: { id: task.id },
      relations: ['creator', 'assignees', 'comments', 'comments.author'],
    });
    return this.toDomain(full!);
  }

  async delete(id: string): Promise<void> {
    await this.em.delete(TaskTypeormEntity, id);
  }

  async replaceAssignees(taskId: string, assigneeIds: string[]): Promise<void> {
    await this.em
      .createQueryBuilder()
      .delete()
      .from('task_assignees')
      .where('taskId = :taskId', { taskId })
      .execute();

    if (assigneeIds.length > 0) {
      const values = assigneeIds.map((userId) => ({
        taskId,
        userId,
      }));
      await this.em
        .createQueryBuilder()
        .insert()
        .into('task_assignees')
        .values(values)
        .execute();
    }
  }

  private toDomain(orm: TaskTypeormEntity): Task {
    return new Task(
      orm.id,
      orm.title,
      orm.description,
      orm.status,
      orm.priority,
      orm.dueDate,
      orm.creatorId ?? orm.creator?.id,
      orm.createdAt,
      orm.updatedAt,
      orm.assignees?.map((a) => a.id) ?? [],
      orm.comments?.map((c) => c.id) ?? [],
      orm.creator
        ? new User(
            orm.creator.id,
            orm.creator.email,
            '',
            orm.creator.name,
            orm.creator.createdAt,
            orm.creator.updatedAt,
          )
        : undefined,
      orm.assignees?.map(
        (a) => new User(a.id, a.email, '', a.name, a.createdAt, a.updatedAt),
      ),
      orm.comments?.map(
        (c) =>
          new Comment(
            c.id,
            c.content,
            c.taskId,
            c.authorId,
            c.createdAt,
            c.updatedAt,
          ),
      ),
    );
  }
}
