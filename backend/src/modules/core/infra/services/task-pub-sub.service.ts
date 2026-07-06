import { Injectable, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { ITaskPubSub } from '../../application/services/task-pub-sub.service';
import { TaskEventVO } from '../../domain/value-objects/task-event.vo';

@Injectable()
export class TaskPubSubService implements ITaskPubSub {
  constructor(@Inject('PUB_SUB') private readonly pubSub: PubSub) {}

  publishEvent(event: TaskEventVO): void {
    const trigger = this.eventTypeToTrigger(event.eventType);
    this.pubSub.publish(trigger, { [trigger]: event });
  }

  asyncIterator<T>(trigger: string, _userId: string): AsyncIterator<T> {
    return (this.pubSub as any).asyncIterator(trigger);
  }

  private eventTypeToTrigger(type: string): string {
    const map: Record<string, string> = {
      TASK_UPDATED: 'taskUpdated',
      TASK_ASSIGNED: 'taskAssigned',
      TASK_NEW_COMMENT: 'taskNewComment',
    };
    return map[type] || type;
  }
}
