import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { NotificationGateway } from '../notification.gateway';
import { EventsService } from '../events.service';
import { EVENTS } from '../event.constants';
import { Task } from '../../tasks/domain/task.entity';
import { Comment } from '../../comments/domain/comment.entity';
import { User } from '../../auth/domain/user.entity';
import { TaskStatus, TaskPriority } from '../../tasks/domain/task.enums';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

const mockUser: User = {
  id: 'user-1',
  email: 'user@qualle.com',
  password: 'hash',
  name: 'User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'A test task',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
  creator: mockUser,
  creatorId: mockUser.id,
  assignees: [],
  comments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockComment: Comment = {
  id: 'comment-1',
  content: 'Test comment',
  task: mockTask,
  taskId: mockTask.id,
  author: mockUser,
  authorId: mockUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

@Injectable()
class EventListener {
  receivedPayloads: unknown[] = [];

  @OnEvent(EVENTS.TASK_UPDATED)
  handleTaskUpdated(payload: unknown) {
    this.receivedPayloads.push(payload);
  }

  @OnEvent(EVENTS.TASK_ASSIGNED)
  handleTaskAssigned(payload: unknown) {
    this.receivedPayloads.push(payload);
  }

  @OnEvent(EVENTS.NEW_COMMENT)
  handleNewComment(payload: unknown) {
    this.receivedPayloads.push(payload);
  }

  @OnEvent(EVENTS.NOTIFICATION)
  handleNotification(payload: unknown) {
    this.receivedPayloads.push(payload);
  }
}

describe('Decoupled Event Bus', () => {
  // -----------------------------------------------------------------------
  // EventEmitter2 (Nest native event bus)
  // -----------------------------------------------------------------------
  describe('EventEmitter2 (Nest native event bus)', () => {
    let eventEmitter: EventEmitter2;
    let listener: EventListener;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot()],
        providers: [EventListener],
      }).compile();

      await module.init();
      eventEmitter = module.get<EventEmitter2>(EventEmitter2);
      listener = module.get<EventListener>(EventListener);
    });

    it('should emit and receive an event via @OnEvent decorator', () => {
      const payload = { task: mockTask, userIds: [mockUser.id] };

      eventEmitter.emit(EVENTS.TASK_UPDATED, payload);

      expect(listener.receivedPayloads).toHaveLength(1);
      expect(listener.receivedPayloads[0]).toEqual(payload);
    });

    it('should deliver the correct payload structure', () => {
      const payload = { task: mockTask, userIds: [mockUser.id] };

      eventEmitter.emit(EVENTS.TASK_UPDATED, payload);

      const received = listener.receivedPayloads[0] as {
        task: Task;
        userIds: string[];
      };
      expect(received.task.id).toBe('task-1');
      expect(received.userIds).toContain('user-1');
    });

    it('should support listeners on different event topics', () => {
      const taskPayload = { task: mockTask, userIds: [mockUser.id] };
      const notifPayload = { userId: mockUser.id, message: 'Test notification' };

      eventEmitter.emit(EVENTS.TASK_UPDATED, taskPayload);
      eventEmitter.emit(EVENTS.NOTIFICATION, notifPayload);

      expect(listener.receivedPayloads).toHaveLength(2);
    });

    it('should not deliver event to listeners of other events', () => {
      eventEmitter.emit('unrelated.event', { message: 'something else' });

      expect(listener.receivedPayloads).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // GraphQL-ws PubSub
  // -----------------------------------------------------------------------
  describe('GraphQL-ws PubSub', () => {
    let pubSub: PubSub;

    beforeEach(() => {
      pubSub = new PubSub();
    });

    it('should publish and receive via async iterator', async () => {
      const iterator = pubSub.asyncIterableIterator(EVENTS.TASK_UPDATED);
      const nextPromise = iterator.next();
      const payload = { taskUpdated: mockTask };

      pubSub.publish(EVENTS.TASK_UPDATED, payload);

      const result = await nextPromise;
      expect(result.done).toBe(false);
      expect(result.value).toEqual(payload);
    });

    it('should support multiple subscribers on the same event', async () => {
      const iterator1 = pubSub.asyncIterableIterator(EVENTS.TASK_UPDATED);
      const iterator2 = pubSub.asyncIterableIterator(EVENTS.TASK_UPDATED);
      const next1 = iterator1.next();
      const next2 = iterator2.next();
      const payload = { taskUpdated: mockTask };

      pubSub.publish(EVENTS.TASK_UPDATED, payload);

      const [result1, result2] = await Promise.all([next1, next2]);
      expect(result1.value).toEqual(payload);
      expect(result2.value).toEqual(payload);
    });

    it('should not receive events from other topics', async () => {
      const iterator = pubSub.asyncIterableIterator(EVENTS.TASK_UPDATED);
      const nextPromise = iterator.next();

      pubSub.publish(EVENTS.NEW_COMMENT, { newComment: mockComment });

      const raceResult = await Promise.race([
        nextPromise.then(() => 'received'),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('timeout'), 200),
        ),
      ]);

      expect(raceResult).toBe('timeout');
    });

    it('should receive correct payload for subscribed topic', async () => {
      const iterator = pubSub.asyncIterableIterator(EVENTS.TASK_UPDATED);
      const nextPromise = iterator.next();

      pubSub.publish(EVENTS.NEW_COMMENT, { newComment: mockComment });
      pubSub.publish(EVENTS.TASK_UPDATED, { taskUpdated: mockTask });

      const result = await nextPromise;
      expect(result.value).toEqual({ taskUpdated: mockTask });
    });
  });

  // -----------------------------------------------------------------------
  // NotificationGateway (decoupled event bus)
  // -----------------------------------------------------------------------
  describe('NotificationGateway (decoupled event bus)', () => {
    let gateway: NotificationGateway;
    let eventEmitter: EventEmitter2;
    let pubSub: PubSub;
    let listener: EventListener;
    const userIds = [mockUser.id];

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot()],
        providers: [
          NotificationGateway,
          EventListener,
          {
            provide: 'PUB_SUB',
            useValue: new PubSub(),
          },
        ],
      }).compile();

      await module.init();
      gateway = module.get<NotificationGateway>(NotificationGateway);
      eventEmitter = module.get<EventEmitter2>(EventEmitter2);
      pubSub = module.get<PubSub>('PUB_SUB');
      listener = module.get<EventListener>(EventListener);
    });

    describe('notifyTaskUpdated', () => {
      it('should publish to EventEmitter2', () => {
        gateway.notifyTaskUpdated(mockTask, userIds);

        expect(listener.receivedPayloads).toHaveLength(1);
        const payload = listener.receivedPayloads[0] as {
          task: Task;
          userIds: string[];
        };
        expect(payload.task.id).toBe(mockTask.id);
        expect(payload.userIds).toEqual(userIds);
      });

      it('should publish to PubSub', async () => {
        const iterator = pubSub.asyncIterableIterator(EVENTS.TASK_UPDATED);
        const nextPromise = iterator.next();

        gateway.notifyTaskUpdated(mockTask, userIds);

        const result = await nextPromise;
        expect(result.value).toEqual({ taskUpdated: mockTask });
      });
    });

    describe('notifyTaskAssigned', () => {
      it('should publish to EventEmitter2', () => {
        gateway.notifyTaskAssigned(mockTask, userIds, 'assigned-user');

        expect(listener.receivedPayloads).toHaveLength(2);
        const taskUpdate = listener.receivedPayloads[0] as {
          task: Task;
          userIds: string[];
        };
        expect(taskUpdate.task.id).toBe(mockTask.id);
      });

      it('should emit direct notification to assigned user', () => {
        gateway.notifyTaskAssigned(mockTask, userIds, 'assigned-user');

        const notification = listener.receivedPayloads[1] as {
          userId: string;
          message: string;
        };
        expect(notification.userId).toBe('assigned-user');
        expect(notification.message).toBe(
          `You have been assigned to task "${mockTask.title}"`,
        );
      });

      it('should publish to PubSub', async () => {
        const iterator = pubSub.asyncIterableIterator(EVENTS.TASK_ASSIGNED);
        const nextPromise = iterator.next();

        gateway.notifyTaskAssigned(mockTask, userIds, 'assigned-user');

        const result = await nextPromise;
        expect(result.value).toEqual({ taskAssigned: mockTask });
      });
    });

    describe('notifyNewComment', () => {
      it('should publish to EventEmitter2', () => {
        gateway.notifyNewComment(mockComment, userIds);

        expect(listener.receivedPayloads).toHaveLength(1);
        const payload = listener.receivedPayloads[0] as {
          comment: Comment;
          userIds: string[];
        };
        expect(payload.comment.id).toBe(mockComment.id);
        expect(payload.userIds).toEqual(userIds);
      });

      it('should publish to PubSub', async () => {
        const iterator = pubSub.asyncIterableIterator(EVENTS.NEW_COMMENT);
        const nextPromise = iterator.next();

        gateway.notifyNewComment(mockComment, userIds);

        const result = await nextPromise;
        expect(result.value).toEqual({ newComment: mockComment });
      });
    });

    describe('sendDirectNotification', () => {
      it('should emit notification via EventEmitter2', () => {
        gateway.sendDirectNotification('user-42', 'Hello!');

        expect(listener.receivedPayloads).toHaveLength(1);
        expect(listener.receivedPayloads[0]).toEqual({
          userId: 'user-42',
          message: 'Hello!',
        });
      });
    });

    it('should dispatch to both buses simultaneously', async () => {
      const iterator = pubSub.asyncIterableIterator(EVENTS.TASK_UPDATED);
      const nextPromise = iterator.next();

      gateway.notifyTaskUpdated(mockTask, userIds);

      const pubSubResult = await nextPromise;
      expect(listener.receivedPayloads).toHaveLength(1);
      expect(pubSubResult.value).toEqual({ taskUpdated: mockTask });
    });
  });

  // -----------------------------------------------------------------------
  // EventsService - filtered subscription integration
  // -----------------------------------------------------------------------
  describe('EventsService (filtered subscriptions)', () => {
    let eventsService: EventsService;
    let pubSub: PubSub;
    let eventEmitter: EventEmitter2;

    const creatorUser: User = {
      id: 'creator-1',
      email: 'creator@qualle.com',
      password: 'hash',
      name: 'Creator',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const assigneeUser: User = {
      id: 'assignee-1',
      email: 'assignee@qualle.com',
      password: 'hash',
      name: 'Assignee',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const outsiderUser: User = {
      id: 'outsider-1',
      email: 'outsider@qualle.com',
      password: 'hash',
      name: 'Outsider',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    function buildTask(overrides: Partial<Task> = {}): Task {
      return {
        id: 'task-1',
        title: 'Test Task',
        description: null,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
        creator: creatorUser,
        creatorId: creatorUser.id,
        assignees: [assigneeUser],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    function buildComment(task: Task, author: User): Comment {
      return {
        id: 'comment-1',
        content: 'Test comment',
        task,
        taskId: task.id,
        author,
        authorId: author.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    beforeEach(() => {
      pubSub = new PubSub();
      eventEmitter = new EventEmitter2();
      eventsService = new EventsService(eventEmitter, pubSub);
    });

    describe('taskUpdated -> filterTaskUpdated', () => {
      it('should deliver to the task creator', async () => {
        const task = buildTask();
        const iterator = eventsService.filterTaskUpdated(creatorUser.id);
        const nextPromise = iterator.next();

        eventsService.taskUpdated(task);

        const result = await nextPromise;
        expect(result.done).toBe(false);
        expect(result.value).toEqual({ taskUpdated: task });
      });

      it('should deliver to the task assignee', async () => {
        const task = buildTask();
        const iterator = eventsService.filterTaskUpdated(assigneeUser.id);
        const nextPromise = iterator.next();

        eventsService.taskUpdated(task);

        const result = await nextPromise;
        expect(result.done).toBe(false);
        expect(result.value).toEqual({ taskUpdated: task });
      });

      it('should NOT deliver to an unrelated user', async () => {
        const task = buildTask();
        const iterator = eventsService.filterTaskUpdated(outsiderUser.id);
        const nextPromise = iterator.next();

        eventsService.taskUpdated(task);

        const raceResult = await Promise.race([
          nextPromise.then(() => 'received'),
          new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), 200)),
        ]);

        expect(raceResult).toBe('timeout');
      });

      it('should emit to EventEmitter2 with correct payload', async () => {
        const emitSpy = vi.spyOn(eventEmitter, 'emit');
        const task = buildTask();

        eventsService.taskUpdated(task);

        expect(emitSpy).toHaveBeenCalledWith(EVENTS.TASK_UPDATED, {
          task,
          userIds: expect.arrayContaining([creatorUser.id, assigneeUser.id]),
        });
      });
    });

    describe('taskAssigned -> filterTaskAssigned', () => {
      it('should deliver to the assigned user', async () => {
        const newAssigneeId = 'new-user';
        const task = buildTask({
          assignees: [{ ...assigneeUser, id: newAssigneeId, email: 'new@qualle.com' }],
        });
        const iterator = eventsService.filterTaskAssigned(newAssigneeId);
        const nextPromise = iterator.next();

        eventsService.taskAssigned(task, newAssigneeId);

        const result = await nextPromise;
        expect(result.done).toBe(false);
        expect(result.value).toEqual({ taskAssigned: task });
      });

      it('should NOT deliver to an unrelated user', async () => {
        const task = buildTask({ assignees: [{ ...assigneeUser, id: 'new-user', email: 'new@qualle.com' }] });
        const iterator = eventsService.filterTaskAssigned(outsiderUser.id);
        const nextPromise = iterator.next();

        eventsService.taskAssigned(task, 'new-user');

        const raceResult = await Promise.race([
          nextPromise.then(() => 'received'),
          new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), 200)),
        ]);

        expect(raceResult).toBe('timeout');
      });

      it('should emit to EventEmitter2 with userIds including the new assignee', async () => {
        const emitSpy = vi.spyOn(eventEmitter, 'emit');
        const newAssigneeId = 'new-user';
        const task = buildTask({
          assignees: [{ ...assigneeUser, id: newAssigneeId, email: 'new@qualle.com' }],
        });

        eventsService.taskAssigned(task, newAssigneeId);

        expect(emitSpy).toHaveBeenCalledWith(EVENTS.TASK_ASSIGNED, {
          task,
          userIds: expect.arrayContaining([creatorUser.id, newAssigneeId]),
        });
      });

      it('should emit a direct notification to EventEmitter2', async () => {
        const emitSpy = vi.spyOn(eventEmitter, 'emit');
        const newAssigneeId = 'new-user';
        const task = buildTask({
          assignees: [{ ...assigneeUser, id: newAssigneeId, email: 'new@qualle.com' }],
        });

        eventsService.taskAssigned(task, newAssigneeId);

        expect(emitSpy).toHaveBeenCalledWith(EVENTS.NOTIFICATION, {
          userId: newAssigneeId,
          message: `You have been assigned to task "${task.title}"`,
        });
      });
    });

    describe('newComment -> filterNewComment', () => {
      it('should deliver to the task creator', async () => {
        const task = buildTask();
        const comment = buildComment(task, assigneeUser);
        const iterator = eventsService.filterNewComment(creatorUser.id);
        const nextPromise = iterator.next();

        eventsService.newComment(comment);

        const result = await nextPromise;
        expect(result.done).toBe(false);
        expect(result.value).toEqual({ newComment: comment });
      });

      it('should deliver to other task assignees', async () => {
        const secondAssignee: User = {
          ...assigneeUser,
          id: 'assignee-2',
          email: 'assignee2@qualle.com',
        };
        const task = buildTask({
          assignees: [assigneeUser, secondAssignee],
        });
        const comment = buildComment(task, creatorUser);
        const iterator = eventsService.filterNewComment(assigneeUser.id);
        const nextPromise = iterator.next();

        eventsService.newComment(comment);

        const result = await nextPromise;
        expect(result.done).toBe(false);
        expect(result.value).toEqual({ newComment: comment });
      });

      it('should NOT deliver to an unrelated user', async () => {
        const task = buildTask();
        const comment = buildComment(task, creatorUser);
        const iterator = eventsService.filterNewComment(outsiderUser.id);
        const nextPromise = iterator.next();

        eventsService.newComment(comment);

        const raceResult = await Promise.race([
          nextPromise.then(() => 'received'),
          new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), 200)),
        ]);

        expect(raceResult).toBe('timeout');
      });

      it('should emit to EventEmitter2 with comment and relevant userIds', async () => {
        const emitSpy = vi.spyOn(eventEmitter, 'emit');
        const task = buildTask();
        const comment = buildComment(task, assigneeUser);

        eventsService.newComment(comment);

        expect(emitSpy).toHaveBeenCalledWith(EVENTS.NEW_COMMENT, {
          comment,
          userIds: expect.arrayContaining([creatorUser.id, assigneeUser.id]),
        });
      });

      it('should NOT emit notification to the comment author', async () => {
        const emitSpy = vi.spyOn(eventEmitter, 'emit');
        const task = buildTask();
        const comment = buildComment(task, assigneeUser); // author = assignee

        eventsService.newComment(comment);

        const notificationCalls = emitSpy.mock.calls.filter(
          ([event]) => event === EVENTS.NOTIFICATION,
        );
        const notifiedUserIds = notificationCalls.map(([, payload]) => (payload as { userId: string }).userId);
        expect(notifiedUserIds).not.toContain(assigneeUser.id);
      });
    });

    describe('concurrent subscriptions', () => {
      it('should deliver to multiple subscribers on the same event', async () => {
        const task = buildTask();
        const iter1 = eventsService.filterTaskUpdated(creatorUser.id);
        const iter2 = eventsService.filterTaskUpdated(creatorUser.id);
        const next1 = iter1.next();
        const next2 = iter2.next();

        eventsService.taskUpdated(task);

        const [result1, result2] = await Promise.all([next1, next2]);
        expect(result1.value).toEqual({ taskUpdated: task });
        expect(result2.value).toEqual({ taskUpdated: task });
      });
    });
  });
});
