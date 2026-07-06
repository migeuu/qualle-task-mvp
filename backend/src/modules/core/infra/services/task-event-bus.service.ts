import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ITaskEventBus } from '../../application/services/task-event-bus.service';
import { TaskEventVO } from '../../domain/value-objects/task-event.vo';

const EVENT_MAP: Record<string, string> = {
  TASK_UPDATED: 'task.updated',
  TASK_ASSIGNED: 'task.assigned',
  TASK_NEW_COMMENT: 'task.newComment',
};

@Injectable()
export class TaskEventBusService implements ITaskEventBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: TaskEventVO): void {
    const eventName = EVENT_MAP[event.eventType] || event.eventType;
    this.eventEmitter.emit(eventName, event);

    for (const userId of event.affectedUserIds) {
      this.eventEmitter.emit(`notification.${userId}`, {
        type: 'notification',
        userId,
        payload: event,
      });
    }
  }
}
