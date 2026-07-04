import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Task } from './domain/task.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { AssignTaskInput } from './dto/assign-task.input';
import { TaskFilterInput } from './dto/task-filter.input';
import { PaginationInput } from './dto/pagination.input';
import { CreateTaskUseCase } from './use-cases/create-task.use-case';
import { UpdateTaskUseCase } from './use-cases/update-task.use-case';
import { DeleteTaskUseCase } from './use-cases/delete-task.use-case';
import { GetTaskUseCase } from './use-cases/get-task.use-case';
import { ListTasksUseCase } from './use-cases/list-tasks.use-case';
import { AssignTaskUseCase } from './use-cases/assign-task.use-case';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { TaskStatus, TaskPriority } from './domain/task.enums';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly assignTaskUseCase: AssignTaskUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created', type: Task })
  create(@Body() input: CreateTaskInput, @CurrentUser() user: { sub: string }): Promise<Task> {
    return this.createTaskUseCase.execute(input, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with filters and pagination' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TaskPriority })
  @ApiQuery({ name: 'dueDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Paginated task list' })
  findAll(
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('dueDate') dueDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: Task[]; total: number }> {
    const filter: TaskFilterInput = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (dueDate) filter.dueDate = new Date(dueDate);
    const pagination: PaginationInput = {};
    if (page) pagination.page = parseInt(page, 10);
    if (limit) pagination.limit = parseInt(limit, 10);
    return this.listTasksUseCase.execute(filter, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task details', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string): Promise<Task> {
    return this.getTaskUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated', type: Task })
  @ApiResponse({ status: 403, description: 'Not the task owner' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@Param('id') id: string, @Body() input: UpdateTaskInput, @CurrentUser() user: { sub: string }): Promise<Task> {
    return this.updateTaskUseCase.execute({ ...input, id }, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  @ApiResponse({ status: 403, description: 'Not the task owner' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  delete(@Param('id') id: string, @CurrentUser() user: { sub: string }): Promise<boolean> {
    return this.deleteTaskUseCase.execute(id, user.sub);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a user to a task' })
  @ApiResponse({ status: 200, description: 'User assigned', type: Task })
  @ApiResponse({ status: 404, description: 'Task or user not found' })
  assign(@Body() input: AssignTaskInput): Promise<Task> {
    return this.assignTaskUseCase.execute(input.taskId, input.userId);
  }
}
