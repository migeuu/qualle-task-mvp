import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CreateTaskUseCase } from '../../application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from '../../application/use-cases/task/update-task.use-case';
import { DeleteTaskUseCase } from '../../application/use-cases/task/delete-task.use-case';
import { FindTaskDetailsUseCase } from '../../application/use-cases/task/find-task-details.use-case';
import { FindTasksPaginatedUseCase } from '../../application/use-cases/task/find-tasks-paginated.use-case';
import { AssignTaskUseCase } from '../../application/use-cases/task/assign-task.use-case';
import { CreateTaskInput } from '../inputs/create-task.input';
import { UpdateTaskInput } from '../inputs/update-task.input';
import { AssignTaskInput } from '../inputs/assign-task.input';
import { TaskStatus, TaskPriority } from '../../domain/enums/task.enum';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTaskUC: CreateTaskUseCase,
    private readonly updateTaskUC: UpdateTaskUseCase,
    private readonly deleteTaskUC: DeleteTaskUseCase,
    private readonly findTaskDetailsUC: FindTaskDetailsUseCase,
    private readonly findTasksPaginatedUC: FindTasksPaginatedUseCase,
    private readonly assignTaskUC: AssignTaskUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(
    @Body() input: CreateTaskInput,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.createTaskUC.execute({ ...input, creatorId: userId });
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated task list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('dueDate') dueDate?: string,
  ): Promise<any> {
    return this.findTasksPaginatedUC.execute(
      parseInt(page || '1', 10),
      parseInt(limit || '10', 10),
      {
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string): Promise<any> {
    return this.findTaskDetailsUC.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the task owner' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id') id: string,
    @Body() input: UpdateTaskInput,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.updateTaskUC.execute({ ...input, taskId: id, userId });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the task owner' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ success: boolean }> {
    const userId = (req as any).user?.sub;
    await this.deleteTaskUC.execute({ taskId: id, userId });
    return { success: true };
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign users to a task' })
  @ApiResponse({ status: 200, description: 'Users assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the task creator can assign users' })
  @ApiResponse({ status: 404, description: 'Task or user not found' })
  async assign(
    @Body() input: AssignTaskInput,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.assignTaskUC.execute({ ...input, loggedUserId: userId });
  }
}
