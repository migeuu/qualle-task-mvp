import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ITaskPubSub } from '../../services/task-pub-sub.service';
import { TaskEventVO } from '../../../domain/value-objects/task-event.vo';

@Injectable()
export class NotifyTaskAssignUseCase {
  constructor(@Inject('ITaskPubSub') private readonly pubSub: ITaskPubSub) {}

  @OnEvent('task.assigned')
  handleTaskAssigned(event: TaskEventVO): void {
    this.pubSub.publishEvent(event);
  }
}
