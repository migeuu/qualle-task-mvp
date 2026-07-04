import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../domain/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repo: Repository<Comment>,
  ) {}

  async findById(id: string): Promise<Comment | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['author', 'task', 'task.creator', 'task.assignees'],
    });
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    return this.repo.find({
      where: { taskId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Comment>): Promise<Comment> {
    const comment = this.repo.create(data);
    return this.repo.save(comment);
  }
}
