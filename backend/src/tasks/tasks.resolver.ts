import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Task } from './domain/task.entity';
import { TaskPage } from './dto/task-page.type';
import { TaskUpdatedPayload, TaskAssignedPayload } from './dto/task-subscription.types';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { TaskFilterInput } from './dto/task-filter.input';
import { PaginationInput } from './dto/pagination.input';
import { AssignTaskInput } from './dto/assign-task.input';
import { CreateTaskUseCase } from './use-cases/create-task.use-case';
import { UpdateTaskUseCase } from './use-cases/update-task.use-case';
import { DeleteTaskUseCase } from './use-cases/delete-task.use-case';
import { GetTaskUseCase } from './use-cases/get-task.use-case';
import { ListTasksUseCase } from './use-cases/list-tasks.use-case';
import { AssignTaskUseCase } from './use-cases/assign-task.use-case';
import { EventsService } from '../events/events.service';
import { UUIDValidationPipe } from '../shared/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';

@Resolver(() => Task)
export class TasksResolver {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly assignTaskUseCase: AssignTaskUseCase,
    private readonly eventsService: EventsService,
  ) {}

  @Query(() => TaskPage)
  @UseGuards(JwtAuthGuard)
  async tasks(
    @Args('filter', { nullable: true }) filter?: TaskFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<TaskPage> {
    return this.listTasksUseCase.execute(filter, pagination);
  }

  @Query(() => Task)
  @UseGuards(JwtAuthGuard)
  async task(@Args('id', { type: () => ID }, UUIDValidationPipe) id: string): Promise<Task> {
    return this.getTaskUseCase.execute(id);
  }

  @Mutation(() => Task)
  @UseGuards(JwtAuthGuard)
  async createTask(
    @Args('input') input: CreateTaskInput,
    @CurrentUser() user: { sub: string },
  ): Promise<Task> {
    return this.createTaskUseCase.execute(input, user.sub);
  }

  @Mutation(() => Task)
  @UseGuards(JwtAuthGuard)
  async updateTask(
    @Args('input') input: UpdateTaskInput,
    @CurrentUser() user: { sub: string },
  ): Promise<Task> {
    return this.updateTaskUseCase.execute(input, user.sub);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteTask(
    @Args('id', { type: () => ID }, UUIDValidationPipe) id: string,
    @CurrentUser() user: { sub: string },
  ): Promise<boolean> {
    return this.deleteTaskUseCase.execute(id, user.sub);
  }

  @Mutation(() => Task)
  @UseGuards(JwtAuthGuard)
  async assignTask(
    @Args('input') input: AssignTaskInput,
  ): Promise<Task> {
    return this.assignTaskUseCase.execute(input.taskId, input.userId);
  }

  @Subscription(() => TaskUpdatedPayload)
  @UseGuards(JwtAuthGuard)
  taskUpdated(@CurrentUser() user: { sub: string }) {
    return this.eventsService.filterTaskUpdated(user.sub);
  }

  @Subscription(() => TaskAssignedPayload)
  @UseGuards(JwtAuthGuard)
  taskAssigned(@CurrentUser() user: { sub: string }) {
    return this.eventsService.filterTaskAssigned(user.sub);
  }
}
