import { Resolver, Query, Mutation, Args, Subscription, ID } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { DataSource } from 'typeorm';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { CreateTaskUseCase } from '../../application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from '../../application/use-cases/task/update-task.use-case';
import { DeleteTaskUseCase } from '../../application/use-cases/task/delete-task.use-case';
import { FindTaskDetailsUseCase } from '../../application/use-cases/task/find-task-details.use-case';
import { FindTasksPaginatedUseCase } from '../../application/use-cases/task/find-tasks-paginated.use-case';
import { AssignTaskUseCase } from '../../application/use-cases/task/assign-task.use-case';
import { TaskTypeormRepository } from '../../infra/orm/repositories/task.typeorm-repository';
import { TaskTypeormEntity } from '../../infra/orm/entities/task.typeorm-entity';
import { CreateTaskInput } from '../inputs/create-task.input';
import { UpdateTaskInput } from '../inputs/update-task.input';
import { DeleteTaskInput } from '../inputs/delete-task.input';
import { AssignTaskInput } from '../inputs/assign-task.input';
import { PaginationInput } from '../inputs/pagination.input';
import { TaskFilterInput } from '../inputs/task-filter.input';
import { TaskPage } from '../outputs/task-page.type';
import { TaskNotificationOutput } from '../outputs/task-notification.type';
import { TaskEventVO } from '../../domain/value-objects/task-event.vo';

@Resolver()
export class TaskResolver {
  constructor(
    @Inject(CreateTaskUseCase) private readonly createTaskUC: CreateTaskUseCase,
    @Inject(UpdateTaskUseCase) private readonly updateTaskUC: UpdateTaskUseCase,
    @Inject(DeleteTaskUseCase) private readonly deleteTaskUC: DeleteTaskUseCase,
    @Inject(FindTaskDetailsUseCase) private readonly findTaskDetailsUC: FindTaskDetailsUseCase,
    @Inject(FindTasksPaginatedUseCase) private readonly findTasksPaginatedUC: FindTasksPaginatedUseCase,
    @Inject(AssignTaskUseCase) private readonly assignTaskUC: AssignTaskUseCase,
    @Inject(TaskTypeormRepository) private readonly taskRepo: TaskTypeormRepository,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  @Query(() => TaskPage)
  async tasks(
    @Args('pagination', { nullable: true, type: () => PaginationInput }) pagination?: PaginationInput,
    @Args('filter', { nullable: true, type: () => TaskFilterInput }) filter?: TaskFilterInput,
  ): Promise<TaskPage> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const result = await this.findTasksPaginatedUC.execute(page, limit, {
      status: filter?.status,
      priority: filter?.priority,
      dueDate: filter?.dueDate,
    });

    const ormTasks: TaskTypeormEntity[] = [];
    for (const dto of result.data) {
      const orm = new TaskTypeormEntity();
      orm.id = dto.id;
      orm.title = dto.title;
      orm.description = dto.description;
      orm.status = dto.status as any;
      orm.priority = dto.priority as any;
      orm.dueDate = dto.dueDate;
      orm.creatorId = dto.creator.id;
      orm.creator = {
        id: dto.creator.id,
        email: dto.creator.email,
        name: dto.creator.name,
        createdAt: dto.creator.createdAt,
        updatedAt: dto.creator.updatedAt,
      } as any;
      orm.assignees = dto.assignees.map(
        (a) =>
          ({
            id: a.id,
            email: a.email,
            name: a.name,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          }) as any,
      );
      orm.comments = dto.comments.map(
        (c) =>
          ({
            id: c.id,
            content: c.content,
            taskId: c.taskId,
            authorId: c.authorId,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }) as any,
      );
      orm.createdAt = dto.createdAt;
      orm.updatedAt = dto.updatedAt;
      ormTasks.push(orm);
    }

    return {
      data: ormTasks,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Query(() => TaskTypeormEntity)
  async task(@Args('taskId', { type: () => ID }) taskId: string): Promise<TaskTypeormEntity | null> {
    return this.findOrm(taskId);
  }

  @Mutation(() => TaskTypeormEntity)
  async createTask(
    @Args('input', { type: () => CreateTaskInput }) input: CreateTaskInput,
    @CurrentUser() user: any,
  ): Promise<TaskTypeormEntity> {
    const dto = await this.createTaskUC.execute({
      creatorId: user.sub,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
    });
    return (await this.findOrm(dto.id))!;
  }

  @Mutation(() => TaskTypeormEntity)
  async updateTask(
    @Args('input', { type: () => UpdateTaskInput }) input: UpdateTaskInput,
    @CurrentUser() user: any,
  ): Promise<TaskTypeormEntity> {
    const dto = await this.updateTaskUC.execute({
      taskId: input.taskId,
      userId: user.sub,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
    });
    return (await this.findOrm(dto.id))!;
  }

  @Mutation(() => Boolean)
  async deleteTask(
    @Args('input', { type: () => DeleteTaskInput }) input: DeleteTaskInput,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    await this.deleteTaskUC.execute({ taskId: input.taskId, userId: user.sub });
    return true;
  }

  @Mutation(() => TaskTypeormEntity)
  async assignTask(
    @Args('input', { type: () => AssignTaskInput }) input: AssignTaskInput,
    @CurrentUser() user: any,
  ): Promise<TaskTypeormEntity> {
    const dto = await this.assignTaskUC.execute({
      taskId: input.taskId,
      loggedUserId: user.sub,
      assigneeIds: input.assigneeIds,
    });
    return (await this.findOrm(dto.id))!;
  }

  @Subscription(() => TaskNotificationOutput, {
    filter: (payload: any, _variables: any, context: any) => {
      const event =
        payload.taskUpdated || payload.taskAssigned || payload.taskNewComment;
      if (!event) return false;
      return event.affectedUserIds?.includes(context?.user?.sub) ?? false;
    },
  })
  async taskUpdated(): Promise<AsyncIterator<TaskNotificationOutput>> {
    return (this.pubSub as any).asyncIterator('taskUpdated');
  }

  @Subscription(() => TaskNotificationOutput, {
    filter: (payload: any, _variables: any, context: any) => {
      const event =
        payload.taskUpdated || payload.taskAssigned || payload.taskNewComment;
      if (!event) return false;
      return event.affectedUserIds?.includes(context?.user?.sub) ?? false;
    },
  })
  async taskAssigned(): Promise<AsyncIterator<TaskNotificationOutput>> {
    return (this.pubSub as any).asyncIterator('taskAssigned');
  }

  @Subscription(() => TaskNotificationOutput, {
    filter: (payload: any, _variables: any, context: any) => {
      const event =
        payload.taskUpdated || payload.taskAssigned || payload.taskNewComment;
      if (!event) return false;
      return event.affectedUserIds?.includes(context?.user?.sub) ?? false;
    },
  })
  async taskNewComment(): Promise<AsyncIterator<TaskNotificationOutput>> {
    return (this.pubSub as any).asyncIterator('taskNewComment');
  }

  private async findOrm(taskId: string): Promise<TaskTypeormEntity | null> {
    return this.dataSource.manager.findOne(TaskTypeormEntity, {
      where: { id: taskId },
      relations: ['creator', 'assignees', 'comments', 'comments.author'],
    });
  }
}
