import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './domain/comment.entity';
import { Task } from '../tasks/domain/task.entity';
import { User } from '../auth/domain/user.entity';
import { CommentRepository } from './repositories/comment.repository';
import { AddCommentUseCase } from './use-cases/add-comment.use-case';
import { ListCommentsUseCase } from './use-cases/list-comments.use-case';
import { CommentsResolver } from './comments.resolver';
import { CommentsController } from './comments.controller';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Task, User]),
    AuthModule,
    TasksModule,
  ],
  controllers: [CommentsController],
  providers: [
    CommentRepository,
    AddCommentUseCase,
    ListCommentsUseCase,
    CommentsResolver,
  ],
  exports: [CommentRepository],
})
export class CommentsModule {}
