import { CreateTaskUseCase } from '../application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from '../application/use-cases/task/update-task.use-case';
import { DeleteTaskUseCase } from '../application/use-cases/task/delete-task.use-case';
import { AssignTaskUseCase } from '../application/use-cases/task/assign-task.use-case';
import { AddTaskCommentUseCase } from '../application/use-cases/task/add-task-comment.use-case';
import { FindTaskDetailsUseCase } from '../application/use-cases/task/find-task-details.use-case';
import { FindTasksPaginatedUseCase } from '../application/use-cases/task/find-tasks-paginated.use-case';
import { Task } from '../domain/entities/task.entity';
import { User } from '../domain/entities/user.entity';
import { Comment } from '../domain/entities/comment.entity';
import { TaskStatus, TaskPriority } from '../domain/enums/task.enum';
import { TaskEventVO } from '../domain/value-objects/task-event.vo';

const makeUser = (id: string): User =>
  new User(id, `${id}@test.com`, 'pw', id, new Date(), new Date());

const makeTask = (overrides: Partial<Task> = {}): Task =>
  new Task(
    overrides.id ?? 'task-1',
    overrides.title ?? 'Test Task',
    overrides.description ?? null,
    overrides.status ?? TaskStatus.TODO,
    overrides.priority ?? TaskPriority.MEDIUM,
    overrides.dueDate ?? null,
    overrides.creatorId ?? 'creator-1',
    overrides.createdAt ?? new Date(),
    overrides.updatedAt ?? new Date(),
    overrides.assigneeIds ?? [],
    overrides.commentIds ?? [],
    overrides.creator ?? makeUser('creator-1'),
    overrides.assignees ?? [],
    overrides.comments ?? [],
  );

describe('CreateTaskUseCase', () => {
  const mockTaskRepo = { create: vi.fn(), findById: vi.fn(), findAll: vi.fn() };
  const mockUserRepo = { findById: vi.fn() };
  const mockEventBus = { publish: vi.fn() };

  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateTaskUseCase(
      mockTaskRepo as any,
      mockUserRepo as any,
      mockEventBus,
    );
  });

  it('should create a task with default status and priority', async () => {
    mockUserRepo.findById.mockResolvedValue(makeUser('creator-1'));
    const savedTask = makeTask();
    mockTaskRepo.create.mockResolvedValue(savedTask);

    const result = await useCase.execute({
      creatorId: 'creator-1',
      title: 'New Task',
    });

    expect(result.title).toBe('Test Task');
    expect(result.status).toBe('TODO');
    expect(result.priority).toBe('MEDIUM');
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event: TaskEventVO = mockEventBus.publish.mock.calls[0][0];
    expect(event.eventType).toBe('TASK_UPDATED');
    expect(event.taskId).toBe('task-1');
  });

  it('should throw when creator not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ creatorId: 'nonexistent', title: 'Task' }),
    ).rejects.toThrow('User not found');
  });

  it('should create a task with custom status and priority', async () => {
    mockUserRepo.findById.mockResolvedValue(makeUser('creator-1'));
    const savedTask = makeTask({
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
    });
    mockTaskRepo.create.mockResolvedValue(savedTask);

    const result = await useCase.execute({
      creatorId: 'creator-1',
      title: 'Important',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
    });

    expect(result.status).toBe('DONE');
    expect(result.priority).toBe('HIGH');
  });
});

describe('UpdateTaskUseCase', () => {
  const mockTaskRepo = { findById: vi.fn(), save: vi.fn() };
  const mockEventBus = { publish: vi.fn() };
  const mockAuthz = { ensureTaskOwner: vi.fn() };

  let useCase: UpdateTaskUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthz.ensureTaskOwner.mockResolvedValue(undefined);
    useCase = new UpdateTaskUseCase(mockTaskRepo as any, mockEventBus, mockAuthz as any);
  });

  it('should update task title', async () => {
    const original = makeTask();
    mockTaskRepo.findById.mockResolvedValue(original);
    const updated = makeTask({ title: 'Updated Title' });
    mockTaskRepo.save.mockResolvedValue(updated);

    const result = await useCase.execute({
      taskId: 'task-1',
      userId: 'creator-1',
      title: 'Updated Title',
    });

    expect(result.title).toBe('Updated Title');
    expect(mockTaskRepo.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('should throw when task not found', async () => {
    mockAuthz.ensureTaskOwner.mockRejectedValueOnce(new Error('Task not found'));

    await expect(
      useCase.execute({ taskId: 'nonexistent', userId: 'user-1', title: 'X' }),
    ).rejects.toThrow('Task not found');
  });

  it('should throw when user is not the owner', async () => {
    mockAuthz.ensureTaskOwner.mockRejectedValueOnce(new Error('Not authorized'));

    await expect(
      useCase.execute({ taskId: 'task-1', userId: 'intruder', title: 'X' }),
    ).rejects.toThrow('Not authorized');
  });

  it('should preserve unchanged fields', async () => {
    const original = makeTask({
      description: 'Original desc',
      priority: TaskPriority.LOW,
    });
    mockTaskRepo.findById.mockResolvedValue(original);
    const saved = makeTask({
      title: 'New Title',
      description: 'Original desc',
      priority: TaskPriority.LOW,
    });
    mockTaskRepo.save.mockResolvedValue(saved);

    const result = await useCase.execute({
      taskId: 'task-1',
      userId: 'creator-1',
      title: 'New Title',
    });

    expect(result.description).toBe('Original desc');
    expect(result.priority).toBe('LOW');
  });

  it('should include assignees in affected users for event', async () => {
    const original = makeTask({ assigneeIds: ['user-a', 'user-b'] });
    mockTaskRepo.findById.mockResolvedValue(original);
    mockTaskRepo.save.mockResolvedValue(makeTask());

    await useCase.execute({
      taskId: 'task-1',
      userId: 'creator-1',
      title: 'New Title',
    });

    const event: TaskEventVO = mockEventBus.publish.mock.calls[0][0];
    expect(event.affectedUserIds).toContain('creator-1');
    expect(event.affectedUserIds).toContain('user-a');
    expect(event.affectedUserIds).toContain('user-b');
  });
});

describe('DeleteTaskUseCase', () => {
  const mockTaskRepo = { findById: vi.fn(), delete: vi.fn() };
  const mockAuthz = { ensureTaskOwner: vi.fn() };

  let useCase: DeleteTaskUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthz.ensureTaskOwner.mockResolvedValue(undefined);
    useCase = new DeleteTaskUseCase(mockTaskRepo as any, mockAuthz as any);
  });

  it('should delete a task', async () => {
    await useCase.execute({ taskId: 'task-1', userId: 'creator-1' });

    expect(mockTaskRepo.delete).toHaveBeenCalledWith('task-1');
  });

  it('should throw when task not found', async () => {
    mockAuthz.ensureTaskOwner.mockRejectedValueOnce(new Error('Task not found'));

    await expect(
      useCase.execute({ taskId: 'nonexistent', userId: 'user-1' }),
    ).rejects.toThrow('Task not found');
  });
});

describe('AssignTaskUseCase', () => {
  const mockTaskRepo = {
    findByIdWithAssignees: vi.fn(),
    replaceAssignees: vi.fn(),
  };
  const mockUserRepo = { findById: vi.fn() };
  const mockEventBus = { publish: vi.fn() };
  const mockAuthz = { ensureCanAssign: vi.fn() };

  let useCase: AssignTaskUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthz.ensureCanAssign.mockResolvedValue(undefined);
    useCase = new AssignTaskUseCase(
      mockTaskRepo as any,
      mockUserRepo as any,
      mockEventBus,
      mockAuthz as any,
    );
  });

  it('should assign users to a task', async () => {
    const task = makeTask({ creatorId: 'creator-1' });
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(task);
    mockTaskRepo.findByIdWithAssignees.mockResolvedValueOnce(task);
    mockTaskRepo.findByIdWithAssignees.mockResolvedValueOnce(
      makeTask({ assigneeIds: ['user-a'] }),
    );
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));

    const result = await useCase.execute({
      taskId: 'task-1',
      loggedUserId: 'creator-1',
      assigneeIds: ['user-a'],
    });

    expect(result).toBeDefined();
    expect(mockTaskRepo.replaceAssignees).toHaveBeenCalledWith('task-1', [
      'user-a',
    ]);
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event: TaskEventVO = mockEventBus.publish.mock.calls[0][0];
    expect(event.eventType).toBe('TASK_ASSIGNED');
  });

  it('should throw when task not found', async () => {
    mockAuthz.ensureCanAssign.mockRejectedValueOnce(new Error('Task not found'));

    await expect(
      useCase.execute({
        taskId: 'nonexistent',
        loggedUserId: 'user-1',
        assigneeIds: ['user-a'],
      }),
    ).rejects.toThrow('Task not found');
  });

  it('should throw when assignee user does not exist', async () => {
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(makeTask());
    mockUserRepo.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        taskId: 'task-1',
        loggedUserId: 'user-1',
        assigneeIds: ['nonexistent'],
      }),
    ).rejects.toThrow('User not found');
  });
});

describe('AddTaskCommentUseCase', () => {
  const mockTaskRepo = { findByIdWithAssignees: vi.fn(), findById: vi.fn() };
  const mockUserRepo = { findById: vi.fn() };
  const mockCommentRepo = { create: vi.fn() };
  const mockEventBus = { publish: vi.fn() };
  const mockAuthz = { ensureTaskParticipant: vi.fn() };

  let useCase: AddTaskCommentUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthz.ensureTaskParticipant.mockResolvedValue(undefined);
    useCase = new AddTaskCommentUseCase(
      mockTaskRepo as any,
      mockUserRepo as any,
      mockCommentRepo as any,
      mockEventBus,
      mockAuthz as any,
    );
  });

  it('should add a comment to a task', async () => {
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(
      makeTask({ assigneeIds: ['user-b'] }),
    );
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));
    mockTaskRepo.findById.mockResolvedValue(makeTask());

    const result = await useCase.execute({
      taskId: 'task-1',
      userId: 'user-a',
      content: 'Nice work!',
    });

    expect(result).toBeDefined();
    expect(mockCommentRepo.create).toHaveBeenCalledTimes(1);
    const comment: Comment = mockCommentRepo.create.mock.calls[0][0];
    expect(comment.content).toBe('Nice work!');
    expect(comment.authorId).toBe('user-a');
    expect(comment.taskId).toBe('task-1');
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('should throw when task not found', async () => {
    mockAuthz.ensureTaskParticipant.mockRejectedValueOnce(new Error('Task not found'));

    await expect(
      useCase.execute({
        taskId: 'nonexistent',
        userId: 'user-a',
        content: 'Test',
      }),
    ).rejects.toThrow('Task not found');
  });

  it('should throw when author not found', async () => {
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(makeTask());
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        taskId: 'task-1',
        userId: 'nonexistent',
        content: 'Test',
      }),
    ).rejects.toThrow('User not found');
  });

  it('should publish event with affected users', async () => {
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(
      makeTask({ creatorId: 'creator-1', assigneeIds: ['user-b'] }),
    );
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));
    mockTaskRepo.findById.mockResolvedValue(makeTask());

    await useCase.execute({
      taskId: 'task-1',
      userId: 'user-a',
      content: 'Test',
    });

    const event: TaskEventVO = mockEventBus.publish.mock.calls[0][0];
    expect(event.eventType).toBe('TASK_NEW_COMMENT');
    expect(event.affectedUserIds).toContain('creator-1');
    expect(event.affectedUserIds).toContain('user-b');
  });
});

describe('FindTaskDetailsUseCase', () => {
  const mockTaskRepo = { findById: vi.fn() };

  let useCase: FindTaskDetailsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new FindTaskDetailsUseCase(mockTaskRepo as any);
  });

  it('should return task DTO', async () => {
    mockTaskRepo.findById.mockResolvedValue(makeTask());

    const result = await useCase.execute('task-1');

    expect(result.id).toBe('task-1');
    expect(result.title).toBe('Test Task');
  });

  it('should throw when task not found', async () => {
    mockTaskRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toThrow('Task not found');
  });
});

describe('FindTasksPaginatedUseCase', () => {
  const mockTaskRepo = { findAll: vi.fn() };

  let useCase: FindTasksPaginatedUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new FindTasksPaginatedUseCase(mockTaskRepo as any);
  });

  it('should return paginated task results', async () => {
    mockTaskRepo.findAll.mockResolvedValue({ data: [makeTask()], total: 1 });

    const result = await useCase.execute(1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should apply filter params', async () => {
    mockTaskRepo.findAll.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute(1, 10, { status: TaskStatus.DONE });

    expect(mockTaskRepo.findAll).toHaveBeenCalledWith(1, 10, {
      status: TaskStatus.DONE,
    });
  });

  it('should return empty results', async () => {
    mockTaskRepo.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute(1, 10);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
