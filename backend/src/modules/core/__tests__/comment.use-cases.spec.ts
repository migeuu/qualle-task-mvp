import { AddTaskCommentUseCase } from '../application/use-cases/task/add-task-comment.use-case';
import { CommentMapper } from '../application/mappers/comment.mapper';
import { Comment } from '../domain/entities/comment.entity';
import { Task } from '../domain/entities/task.entity';
import { User } from '../domain/entities/user.entity';
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

describe('AddTaskCommentUseCase', () => {
  const mockTaskRepo = { findByIdWithAssignees: vi.fn(), findById: vi.fn() };
  const mockUserRepo = { findById: vi.fn() };
  const mockCommentRepo = { create: vi.fn() };
  const mockEventBus = { publish: vi.fn() };

  let useCase: AddTaskCommentUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new AddTaskCommentUseCase(mockTaskRepo as any, mockUserRepo as any, mockCommentRepo as any, mockEventBus as any);
  });

  it('should add a comment to a task and return updated task DTO', async () => {
    const task = makeTask({ creatorId: 'creator-1', assigneeIds: ['user-b'] });
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(task);
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));
    const persistedComment = new Comment('comment-1', 'Nice work!', 'task-1', 'user-a', new Date(), new Date());
    mockCommentRepo.create.mockResolvedValue(persistedComment);
    mockTaskRepo.findById.mockResolvedValue(makeTask());

    const result = await useCase.execute({ taskId: 'task-1', userId: 'user-a', content: 'Nice work!' });

    expect(result).toBeDefined();
    expect(mockCommentRepo.create).toHaveBeenCalledTimes(1);
    const comment: Comment = mockCommentRepo.create.mock.calls[0][0];
    expect(comment.content).toBe('Nice work!');
    expect(comment.authorId).toBe('user-a');
    expect(comment.taskId).toBe('task-1');
    expect(comment.id).toBeDefined();
  });

  it('should publish TASK_NEW_COMMENT event', async () => {
    const task = makeTask();
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(task);
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));
    mockCommentRepo.create.mockResolvedValue(new Comment('c1', 'Test', 'task-1', 'user-a', new Date(), new Date()));
    mockTaskRepo.findById.mockResolvedValue(makeTask());

    await useCase.execute({ taskId: 'task-1', userId: 'user-a', content: 'Test' });

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event: TaskEventVO = mockEventBus.publish.mock.calls[0][0];
    expect(event.eventType).toBe('TASK_NEW_COMMENT');
    expect(event.taskId).toBe('task-1');
    expect(event.eventAuthorId).toBe('user-a');
  });

  it('should include creator and assignees in affected users', async () => {
    const task = makeTask({ creatorId: 'creator-1', assigneeIds: ['user-b', 'user-c'] });
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(task);
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));
    mockCommentRepo.create.mockResolvedValue(new Comment('c1', 'Test', 'task-1', 'user-a', new Date(), new Date()));
    mockTaskRepo.findById.mockResolvedValue(makeTask());

    await useCase.execute({ taskId: 'task-1', userId: 'user-a', content: 'Test' });

    const event: TaskEventVO = mockEventBus.publish.mock.calls[0][0];
    expect(event.affectedUserIds).toContain('creator-1');
    expect(event.affectedUserIds).toContain('user-b');
    expect(event.affectedUserIds).toContain('user-c');
  });

  it('should deduplicate affected users', async () => {
    const task = makeTask({ creatorId: 'creator-1', assigneeIds: ['creator-1'] });
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(task);
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));
    mockCommentRepo.create.mockResolvedValue(new Comment('c1', 'Test', 'task-1', 'user-a', new Date(), new Date()));
    mockTaskRepo.findById.mockResolvedValue(makeTask());

    await useCase.execute({ taskId: 'task-1', userId: 'user-a', content: 'Test' });

    const event: TaskEventVO = mockEventBus.publish.mock.calls[0][0];
    const occurrences = event.affectedUserIds.filter((id) => id === 'creator-1').length;
    expect(occurrences).toBe(1);
  });

  it('should throw when task is not found', async () => {
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(null);

    await expect(
      useCase.execute({ taskId: 'nonexistent', userId: 'user-a', content: 'Test' }),
    ).rejects.toThrow('Resource not found');
  });

  it('should throw when comment author does not exist', async () => {
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(makeTask());
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ taskId: 'task-1', userId: 'nonexistent', content: 'Test' }),
    ).rejects.toThrow('Resource not found');
  });

  it('should refetch task after creating comment', async () => {
    const task = makeTask();
    mockTaskRepo.findByIdWithAssignees.mockResolvedValue(task);
    mockUserRepo.findById.mockResolvedValue(makeUser('user-a'));
    mockCommentRepo.create.mockResolvedValue(new Comment('c1', 'Test', 'task-1', 'user-a', new Date(), new Date()));
    const updatedTask = makeTask();
    mockTaskRepo.findById.mockResolvedValue(updatedTask);

    const result = await useCase.execute({ taskId: 'task-1', userId: 'user-a', content: 'Test' });

    expect(mockTaskRepo.findById).toHaveBeenCalledWith('task-1');
    expect(result).toBeDefined();
  });
});

describe('CommentMapper', () => {
  it('should map Comment entity to CommentDto', () => {
    const comment = new Comment(
      'comment-1',
      'Great work!',
      'task-1',
      'user-a',
      new Date('2024-01-15'),
      new Date('2024-01-16'),
    );

    const dto = CommentMapper.toDto(comment);

    expect(dto.id).toBe('comment-1');
    expect(dto.content).toBe('Great work!');
    expect(dto.taskId).toBe('task-1');
    expect(dto.authorId).toBe('user-a');
    expect(dto.createdAt).toEqual(new Date('2024-01-15'));
    expect(dto.updatedAt).toEqual(new Date('2024-01-16'));
  });

  it('should map Comment with different values', () => {
    const comment = new Comment('c2', 'Another note', 'task-2', 'user-b', new Date('2024-06-01'), new Date('2024-06-01'));

    const dto = CommentMapper.toDto(comment);

    expect(dto.id).toBe('c2');
    expect(dto.content).toBe('Another note');
  });
});
