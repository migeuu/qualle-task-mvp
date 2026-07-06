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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
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
  async create(
    @Body() input: CreateTaskInput,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.createTaskUC.execute({ ...input, creatorId: userId });
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with pagination and filters' })
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
  async findOne(@Param('id') id: string): Promise<any> {
    return this.findTaskDetailsUC.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
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
  async assign(
    @Body() input: AssignTaskInput,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.assignTaskUC.execute({ ...input, loggedUserId: userId });
  }
}
