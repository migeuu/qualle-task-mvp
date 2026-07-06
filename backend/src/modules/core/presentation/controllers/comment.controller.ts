import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AddTaskCommentUseCase } from '../../application/use-cases/task/add-task-comment.use-case';
import { CommentTypeormRepository } from '../../infra/orm/repositories/comment.typeorm-repository';
import { CreateCommentInput } from '../inputs/create-comment.input';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentController {
  constructor(
    private readonly addCommentUC: AddTaskCommentUseCase,
    private readonly commentRepo: CommentTypeormRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a task participant' })
  @ApiResponse({ status: 404, description: 'Task or user not found' })
  async create(
    @Body() input: CreateCommentInput,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.addCommentUC.execute({ ...input, userId });
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'List comments for a task' })
  @ApiResponse({ status: 200, description: 'Comment list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByTask(@Param('taskId') taskId: string): Promise<any> {
    return this.commentRepo.findByTaskId(taskId);
  }
}
