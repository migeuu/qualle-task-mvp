import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../repositories/comment.repository';
import { TaskRepository } from '../../tasks/repositories/task.repository';
import { UserRepository } from '../../auth/repositories/user.repository';
import { EventsService } from '../../events/events.service';
import { Comment } from '../domain/comment.entity';
import { CreateCommentInput } from '../dto/create-comment.input';
import {
  TaskNotFoundException,
  UserNotFoundException,
} from '../../shared/exceptions/business.exceptions';

@Injectable()
export class AddCommentUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
    private readonly eventsService: EventsService,
  ) {}

  async execute(input: CreateCommentInput, userId: string): Promise<Comment> {
    const task = await this.taskRepository.findByIdWithAssignees(input.taskId);

    if (!task) {
      throw new TaskNotFoundException();
    }

    const author = await this.userRepository.findById(userId);

    if (!author) {
      throw new UserNotFoundException();
    }

    const saved = await this.commentRepository.create({
      content: input.content,
      taskId: input.taskId,
      authorId: userId,
    });

    const comment = (await this.commentRepository.findById(saved.id))!;

    this.eventsService.newComment(comment);

    return comment;
  }
}
