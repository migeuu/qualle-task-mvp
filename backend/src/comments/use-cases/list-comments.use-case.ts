import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../repositories/comment.repository';
import { Comment } from '../domain/comment.entity';

@Injectable()
export class ListCommentsUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(taskId: string): Promise<Comment[]> {
    return this.commentRepository.findByTaskId(taskId);
  }
}
