import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Comment } from './domain/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { AddCommentUseCase } from './use-cases/add-comment.use-case';
import { ListCommentsUseCase } from './use-cases/list-comments.use-case';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly addCommentUseCase: AddCommentUseCase,
    private readonly listCommentsUseCase: ListCommentsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiResponse({ status: 201, description: 'Comment added', type: Comment })
  @ApiResponse({ status: 404, description: 'Task not found' })
  addComment(@Body() input: CreateCommentInput, @CurrentUser() user: { sub: string }): Promise<Comment> {
    return this.addCommentUseCase.execute(input, user.sub);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'List comments for a task' })
  @ApiResponse({ status: 200, description: 'List of comments', type: [Comment] })
  findByTask(@Param('taskId') taskId: string): Promise<Comment[]> {
    return this.listCommentsUseCase.execute(taskId);
  }
}
