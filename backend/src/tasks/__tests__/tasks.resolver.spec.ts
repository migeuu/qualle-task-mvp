import { TasksResolver } from '../tasks.resolver';
import { CreateTaskUseCase } from '../use-cases/create-task.use-case';
import { UpdateTaskUseCase } from '../use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../use-cases/delete-task.use-case';
import { GetTaskUseCase } from '../use-cases/get-task.use-case';
import { ListTasksUseCase } from '../use-cases/list-tasks.use-case';
import { AssignTaskUseCase } from '../use-cases/assign-task.use-case';
import { EventsService } from '../../events/events.service';
import { Task } from '../domain/task.entity';
import { TaskStatus, TaskPriority } from '../domain/task.enums';
import { CreateTaskInput } from '../dto/create-task.input';
import { UpdateTaskInput } from '../dto/update-task.input';
import { AssignTaskInput } from '../dto/assign-task.input';
import { TaskFilterInput } from '../dto/task-filter.input';
import { PaginationInput } from '../dto/pagination.input';

const mockTask: Task = {
  id: 'task-1',
  title: 'Test',
  description: 'A test task',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
  creatorId: 'user-1',
  creator: {
    id: 'user-1',
    email: 'test@qualle.com',
    password: 'hash',
    name: 'Creator',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  assignees: [],
  comments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTaskPage = { items: [mockTask], total: 1 };

describe('TasksResolver', () => {
  let resolver: TasksResolver;
  let createTask: CreateTaskUseCase;
  let updateTask: UpdateTaskUseCase;
  let deleteTask: DeleteTaskUseCase;
  let getTask: GetTaskUseCase;
  let listTasks: ListTasksUseCase;
  let assignTask: AssignTaskUseCase;
  let eventsService: EventsService;

  beforeEach(() => {
    createTask = { execute: vi.fn() } as unknown as CreateTaskUseCase;
    updateTask = { execute: vi.fn() } as unknown as UpdateTaskUseCase;
    deleteTask = { execute: vi.fn() } as unknown as DeleteTaskUseCase;
    getTask = { execute: vi.fn() } as unknown as GetTaskUseCase;
    listTasks = { execute: vi.fn() } as unknown as ListTasksUseCase;
    assignTask = { execute: vi.fn() } as unknown as AssignTaskUseCase;
    eventsService = {
      filterTaskUpdated: vi.fn(),
      filterTaskAssigned: vi.fn(),
    } as unknown as EventsService;

    resolver = new TasksResolver(
      createTask,
      updateTask,
      deleteTask,
      getTask,
      listTasks,
      assignTask,
      eventsService,
    );
  });

  describe('tasks', () => {
    it('should delegate to ListTasksUseCase with filter and pagination', async () => {
      vi.spyOn(listTasks, 'execute').mockResolvedValue(mockTaskPage);
      const filter: TaskFilterInput = { status: TaskStatus.TODO };
      const pagination: PaginationInput = { page: 1, limit: 10 };

      const result = await resolver.tasks(filter, pagination);

      expect(listTasks.execute).toHaveBeenCalledWith(filter, pagination);
      expect(result).toEqual(mockTaskPage);
    });

    it('should work without filter and pagination', async () => {
      vi.spyOn(listTasks, 'execute').mockResolvedValue(mockTaskPage);

      const result = await resolver.tasks();

      expect(listTasks.execute).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(mockTaskPage);
    });
  });

  describe('task', () => {
    it('should delegate to GetTaskUseCase', async () => {
      vi.spyOn(getTask, 'execute').mockResolvedValue(mockTask);

      const result = await resolver.task('task-1');

      expect(getTask.execute).toHaveBeenCalledWith('task-1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('createTask', () => {
    it('should delegate to CreateTaskUseCase', async () => {
      const input: CreateTaskInput = { title: 'New Task' };
      vi.spyOn(createTask, 'execute').mockResolvedValue(mockTask);

      const result = await resolver.createTask(input, { sub: 'user-1' });

      expect(createTask.execute).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('updateTask', () => {
    it('should delegate to UpdateTaskUseCase', async () => {
      const input: UpdateTaskInput = { id: 'task-1', title: 'Updated' };
      vi.spyOn(updateTask, 'execute').mockResolvedValue(mockTask);

      const result = await resolver.updateTask(input, { sub: 'user-1' });

      expect(updateTask.execute).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('deleteTask', () => {
    it('should delegate to DeleteTaskUseCase', async () => {
      vi.spyOn(deleteTask, 'execute').mockResolvedValue(true);

      const result = await resolver.deleteTask('task-1', { sub: 'user-1' });

      expect(deleteTask.execute).toHaveBeenCalledWith('task-1', 'user-1');
      expect(result).toBe(true);
    });
  });

  describe('assignTask', () => {
    it('should delegate to AssignTaskUseCase', async () => {
      const input: AssignTaskInput = { taskId: 'task-1', userId: 'user-2' };
      vi.spyOn(assignTask, 'execute').mockResolvedValue(mockTask);

      const result = await resolver.assignTask(input, { sub: 'user-1' });

      expect(assignTask.execute).toHaveBeenCalledWith('task-1', 'user-2', 'user-1');
      expect(result).toEqual(mockTask);
    });
  });

  describe('taskUpdated', () => {
    it('should delegate to EventsService.filterTaskUpdated', () => {
      const mockIterator = Symbol('iterator');
      vi.spyOn(eventsService, 'filterTaskUpdated').mockReturnValue(mockIterator as any);

      const result = resolver.taskUpdated({ sub: 'user-1' });

      expect(eventsService.filterTaskUpdated).toHaveBeenCalledWith('user-1');
      expect(result).toBe(mockIterator);
    });
  });

  describe('taskAssigned', () => {
    it('should delegate to EventsService.filterTaskAssigned', () => {
      const mockIterator = Symbol('iterator');
      vi.spyOn(eventsService, 'filterTaskAssigned').mockReturnValue(mockIterator as any);

      const result = resolver.taskAssigned({ sub: 'user-1' });

      expect(eventsService.filterTaskAssigned).toHaveBeenCalledWith('user-1');
      expect(result).toBe(mockIterator);
    });
  });
});
