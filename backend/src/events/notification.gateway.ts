import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { Task } from '../tasks/domain/task.entity';
import { Comment } from '../comments/domain/comment.entity';
import { EVENTS } from './event.constants';

@Injectable()
export class NotificationGateway {
  constructor(
    private eventEmitter: EventEmitter2,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  notifyTaskUpdated(task: Task, userIds: string[]) {
    this.eventEmitter.emit(EVENTS.TASK_UPDATED, { task, userIds });
    this.pubSub.publish(EVENTS.TASK_UPDATED, { taskUpdated: task });
  }

  notifyTaskAssigned(task: Task, userIds: string[], assignedUserId: string) {
    this.eventEmitter.emit(EVENTS.TASK_ASSIGNED, { task, userIds });
    this.pubSub.publish(EVENTS.TASK_ASSIGNED, { taskAssigned: task });
    this.sendDirectNotification(
      assignedUserId,
      `You have been assigned to task "${task.title}"`,
    );
  }

  notifyNewComment(comment: Comment, userIds: string[]) {
    this.eventEmitter.emit(EVENTS.NEW_COMMENT, { comment, userIds });
    this.pubSub.publish(EVENTS.NEW_COMMENT, { newComment: comment });
  }

  sendDirectNotification(userId: string, message: string) {
    this.eventEmitter.emit(EVENTS.NOTIFICATION, { userId, message });
  }
}
