import { TaskEventVO } from '../../domain/value-objects/task-event.vo';

export interface ITaskEventBus {
  publish(event: TaskEventVO): void;
}
