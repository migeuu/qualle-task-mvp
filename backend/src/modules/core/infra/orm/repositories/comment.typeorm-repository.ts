import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ICommentRepository } from '../../../domain/repositories/comment.repository';
import { Comment } from '../../../domain/entities/comment.entity';
import { CommentTypeormEntity } from '../entities/comment.typeorm-entity';

@Injectable()
export class CommentTypeormRepository implements ICommentRepository {
  constructor(
    @InjectEntityManager()
    private readonly em: EntityManager,
  ) {}

  async findById(id: string): Promise<Comment | null> {
    const orm = await this.em.findOne(CommentTypeormEntity, {
      where: { id },
      relations: ['author', 'task', 'task.creator', 'task.assignees'],
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    const items = await this.em.find(CommentTypeormEntity, {
      where: { taskId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
    return items.map((i) => this.toDomain(i));
  }

  async create(comment: Comment): Promise<Comment> {
    const orm = this.em.create(CommentTypeormEntity, {
      id: comment.id || uuid(),
      content: comment.content,
      taskId: comment.taskId,
      authorId: comment.authorId,
      createdAt: comment.createdAt || new Date(),
      updatedAt: comment.updatedAt || new Date(),
    });
    const saved = await this.em.save(orm);
    return this.toDomain(saved);
  }

  private toDomain(orm: CommentTypeormEntity): Comment {
    return new Comment(
      orm.id,
      orm.content,
      orm.taskId,
      orm.authorId,
      orm.createdAt,
      orm.updatedAt,
    );
  }
}
