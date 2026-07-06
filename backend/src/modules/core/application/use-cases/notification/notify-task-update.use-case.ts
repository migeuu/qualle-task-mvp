import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ITaskPubSub } from '../../services/task-pub-sub.service';
import { TaskEventVO } from '../../../domain/value-objects/task-event.vo';

@Injectable()
export class NotifyTaskUpdateUseCase {
  constructor(private readonly pubSub: ITaskPubSub) {}

  @OnEvent('task.updated')
  handleTaskUpdated(event: TaskEventVO): void {
    this.pubSub.publishEvent(event);
  }
}
