export type TaskEventType = 'TASK_UPDATED' | 'TASK_ASSIGNED' | 'TASK_NEW_COMMENT';

export class TaskEventVO {
  constructor(
    public readonly taskId: string,
    public readonly eventAuthorId: string,
    public readonly eventType: TaskEventType,
    public readonly affectedUserIds: string[],
  ) {}
}
