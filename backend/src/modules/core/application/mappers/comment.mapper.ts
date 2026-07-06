import { Comment } from '../../domain/entities/comment.entity';
import { CommentDto } from '../dtos/comment.dto';

export class CommentMapper {
  static toDto(comment: Comment): CommentDto {
    return {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      taskId: comment.taskId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
