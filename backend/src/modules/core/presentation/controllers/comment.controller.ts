import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { AddTaskCommentUseCase } from '../../application/use-cases/task/add-task-comment.use-case';
import { CommentTypeormRepository } from '../../infra/orm/repositories/comment.typeorm-repository';
import { CreateCommentInput } from '../inputs/create-comment.input';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentController {
  constructor(
    private readonly addCommentUC: AddTaskCommentUseCase,
    private readonly commentRepo: CommentTypeormRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a task' })
  async create(
    @Body() input: CreateCommentInput,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.addCommentUC.execute({ ...input, userId });
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'List comments for a task' })
  async findByTask(@Param('taskId') taskId: string): Promise<any> {
    return this.commentRepo.findByTaskId(taskId);
  }
}
