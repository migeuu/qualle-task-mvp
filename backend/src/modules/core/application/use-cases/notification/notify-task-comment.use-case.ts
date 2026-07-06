import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ITaskPubSub } from '../../services/task-pub-sub.service';
import { TaskEventVO } from '../../../domain/value-objects/task-event.vo';

@Injectable()
export class NotifyTaskCommentUseCase {
  constructor(private readonly pubSub: ITaskPubSub) {}

  @OnEvent('task.newComment')
  handleTaskNewComment(event: TaskEventVO): void {
    this.pubSub.publishEvent(event);
  }
}
