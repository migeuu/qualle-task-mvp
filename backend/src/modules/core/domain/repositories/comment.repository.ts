import { Comment } from '../entities/comment.entity';

export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  findByTaskId(taskId: string): Promise<Comment[]>;
  create(comment: Comment): Promise<Comment>;
}
