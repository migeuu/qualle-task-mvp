import { TaskEventVO } from '../../domain/value-objects/task-event.vo';

export interface ITaskPubSub {
  publishEvent(event: TaskEventVO): void;
  asyncIterator<T>(trigger: string, userId: string): AsyncIterator<T>;
}
