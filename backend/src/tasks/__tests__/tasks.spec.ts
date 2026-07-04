import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepository } from '../repositories/task.repository';
import { UserRepository } from '../../auth/repositories/user.repository';
import { EventsService } from '../../events/events.service';
import { CreateTaskUseCase } from '../use-cases/create-task.use-case';
import { UpdateTaskUseCase } from '../use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../use-cases/delete-task.use-case';
import { GetTaskUseCase } from '../use-cases/get-task.use-case';
import { ListTasksUseCase } from '../use-cases/list-tasks.use-case';
import { AssignTaskUseCase } from '../use-cases/assign-task.use-case';
import { Task } from '../domain/task.entity';
import { User } from '../../auth/domain/user.entity';
import { TaskStatus, TaskPriority } from '../domain/task.enums';
import { TaskNotFoundException, NotTaskOwnerException, UserNotFoundException } from '../../shared/exceptions/business.exceptions';

const mockUser: User = {
  id: 'user-1',
  email: 'creator@qualle.com',
  password: 'hash',
  name: 'Creator',
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

describe('Tasks Use Cases', () => {
  let createTaskUseCase: CreateTaskUseCase;
  let updateTaskUseCase: UpdateTaskUseCase;
  let deleteTaskUseCase: DeleteTaskUseCase;
  let getTaskUseCase: GetTaskUseCase;
  let listTasksUseCase: ListTasksUseCase;
  let assignTaskUseCase: AssignTaskUseCase;
  let taskRepository: TaskRepository;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskUseCase,
        UpdateTaskUseCase,
        DeleteTaskUseCase,
        GetTaskUseCase,
        ListTasksUseCase,
        AssignTaskUseCase,
        {
          provide: TaskRepository,
          useValue: {
            findById: vi.fn(),
            findByIdWithAssignees: vi.fn(),
            findAll: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            delete: vi.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findById: vi.fn(),
          },
        },
        {
          provide: EventsService,
          useValue: {
            taskUpdated: vi.fn(),
            taskAssigned: vi.fn(),
          },
        },
      ],
    }).compile();

    createTaskUseCase = module.get<CreateTaskUseCase>(CreateTaskUseCase);
    updateTaskUseCase = module.get<UpdateTaskUseCase>(UpdateTaskUseCase);
    deleteTaskUseCase = module.get<DeleteTaskUseCase>(DeleteTaskUseCase);
    getTaskUseCase = module.get<GetTaskUseCase>(GetTaskUseCase);
    listTasksUseCase = module.get<ListTasksUseCase>(ListTasksUseCase);
    assignTaskUseCase = module.get<AssignTaskUseCase>(AssignTaskUseCase);
    taskRepository = module.get<TaskRepository>(TaskRepository);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('CreateTaskUseCase', () => {
    it('should create a task', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      vi.spyOn(taskRepository, 'create').mockResolvedValue(mockTask);
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(mockTask);

      const result = await createTaskUseCase.execute({ title: 'New Task' }, mockUser.id);

      expect(result).toEqual(mockTask);
    });

    it('should throw UserNotFoundException', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(
        createTaskUseCase.execute({ title: 'New Task' }, 'bad-id'),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('UpdateTaskUseCase', () => {
    it('should update a task', async () => {
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(mockTask);
      vi.spyOn(taskRepository, 'save').mockResolvedValue(mockTask);

      const result = await updateTaskUseCase.execute({ id: mockTask.id, title: 'Updated' }, mockUser.id);

      expect(result.title).toBe('Updated');
    });

    it('should throw TaskNotFoundException', async () => {
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(null);

      await expect(
        updateTaskUseCase.execute({ id: 'bad' }, mockUser.id),
      ).rejects.toThrow(TaskNotFoundException);
    });

    it('should throw NotTaskOwnerException', async () => {
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(mockTask);

      await expect(
        updateTaskUseCase.execute({ id: mockTask.id }, 'other-user'),
      ).rejects.toThrow(NotTaskOwnerException);
    });
  });

  describe('DeleteTaskUseCase', () => {
    it('should delete a task', async () => {
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(mockTask);
      vi.spyOn(taskRepository, 'delete').mockResolvedValue(true);

      const result = await deleteTaskUseCase.execute(mockTask.id, mockUser.id);

      expect(result).toBe(true);
    });
  });

  describe('GetTaskUseCase', () => {
    it('should return a task', async () => {
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(mockTask);

      const result = await getTaskUseCase.execute(mockTask.id);

      expect(result).toEqual(mockTask);
    });

    it('should throw TaskNotFoundException', async () => {
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(null);

      await expect(getTaskUseCase.execute('bad')).rejects.toThrow(TaskNotFoundException);
    });
  });

  describe('ListTasksUseCase', () => {
    it('should return paginated tasks', async () => {
      vi.spyOn(taskRepository, 'findAll').mockResolvedValue({ items: [mockTask], total: 1 });

      const result = await listTasksUseCase.execute();

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('AssignTaskUseCase', () => {
    it('should assign a user to a task', async () => {
      const taskNoAssignee = { ...mockTask, assignees: [] };
      vi.spyOn(taskRepository, 'findByIdWithAssignees').mockResolvedValue(taskNoAssignee);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      vi.spyOn(taskRepository, 'save').mockResolvedValue({} as Task);
      vi.spyOn(taskRepository, 'findById').mockResolvedValue({ ...mockTask, assignees: [mockUser] });

      const result = await assignTaskUseCase.execute(mockTask.id, mockUser.id);

      expect(result.assignees).toHaveLength(1);
    });

    it('should not duplicate assignee', async () => {
      const taskWithAssignee = { ...mockTask, assignees: [mockUser] };
      vi.spyOn(taskRepository, 'findByIdWithAssignees').mockResolvedValue(taskWithAssignee);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      vi.spyOn(taskRepository, 'findById').mockResolvedValue(taskWithAssignee);

      await assignTaskUseCase.execute(mockTask.id, mockUser.id);

      expect(taskRepository.save).not.toHaveBeenCalled();
    });
  });
});
