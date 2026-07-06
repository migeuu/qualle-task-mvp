import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { Task } from '../tasks/domain/task.entity';
import { Comment } from '../comments/domain/comment.entity';
import { EVENTS } from './event.constants';
export { EVENTS };

@Injectable()
export class EventsService {
  constructor(
    private eventEmitter: EventEmitter2,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  taskUpdated(task: Task) {
    const payload = { taskUpdated: task };
    const relevantUsers = this.getRelevantUserIds(task);

    // Publica no EventEmitter2 para listeners internos (Gateway)
    this.eventEmitter.emit(EVENTS.TASK_UPDATED, { task, userIds: relevantUsers });

    // Publica no PubSub para GraphQL Subscriptions
    this.pubSub.publish(EVENTS.TASK_UPDATED, payload);
  }

  taskAssigned(task: Task, assignedUserId: string) {
    const payload = { taskAssigned: task };

    this.eventEmitter.emit(EVENTS.TASK_ASSIGNED, {
      task,
      userIds: [...this.getRelevantUserIds(task), assignedUserId],
    });

    this.pubSub.publish(EVENTS.TASK_ASSIGNED, payload);

    // Notificacao especifica para o usuario atribuido
    this.eventEmitter.emit(EVENTS.NOTIFICATION, {
      userId: assignedUserId,
      message: `You have been assigned to task "${task.title}"`,
    });
  }

  newComment(comment: Comment) {
    const payload = { newComment: comment };
    const task = comment.task;

    if (task) {
      const relevantUsers = this.getRelevantUserIds(task);

      this.eventEmitter.emit(EVENTS.NEW_COMMENT, {
        comment,
        userIds: relevantUsers,
      });

      this.pubSub.publish(EVENTS.NEW_COMMENT, payload);

      // Notifica todos os envolvidos exceto o autor do comentario
      relevantUsers
        .filter((id) => id !== comment.authorId)
        .forEach((userId) => {
          this.eventEmitter.emit(EVENTS.NOTIFICATION, {
            userId,
            message: `New comment on task "${task.title}"`,
          });
        });
    }
  }

  // GraphQL Subscriptions - AsyncIterators filtrados por usuario
  async *filterTaskUpdated(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iterator = this.pubSub.asyncIterableIterator<any>(EVENTS.TASK_UPDATED);
    while (true) {
      const result = await iterator.next();
      if (result.done) break;
      const payload = result.value as { taskUpdated: Task };
      const task = payload.taskUpdated;
      const relevantUserIds = this.getRelevantUserIds(task);
      if (relevantUserIds.includes(userId)) {
        yield { taskUpdated: task };
      }
    }
  }

  async *filterTaskAssigned(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iterator = this.pubSub.asyncIterableIterator<any>(EVENTS.TASK_ASSIGNED);
    while (true) {
      const result = await iterator.next();
      if (result.done) break;
      const payload = result.value as { taskAssigned: Task };
      const task = payload.taskAssigned;
      const relevantUserIds = this.getRelevantUserIds(task);
      if (relevantUserIds.includes(userId)) {
        yield { taskAssigned: task };
      }
    }
  }

  async *filterNewComment(userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iterator = this.pubSub.asyncIterableIterator<any>(EVENTS.NEW_COMMENT);
    while (true) {
      const result = await iterator.next();
      if (result.done) break;
      const payload = result.value as { newComment: Comment };
      const comment = payload.newComment;
      if (comment?.task) {
        const relevantUserIds = this.getRelevantUserIds(comment.task);
        if (relevantUserIds.includes(userId)) {
          yield { newComment: comment };
        }
      }
    }
  }

  private getRelevantUserIds(task: Task): string[] {
    const ids = new Set<string>();
    if (task.creatorId) ids.add(task.creatorId);
    if (task.assignees) {
      task.assignees.forEach((a) => ids.add(a.id));
    }
    return [...ids];
  }
}
