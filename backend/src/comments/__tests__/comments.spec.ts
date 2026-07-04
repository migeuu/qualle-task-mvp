import { Test, TestingModule } from '@nestjs/testing';
import { CommentRepository } from '../repositories/comment.repository';
import { TaskRepository } from '../../tasks/repositories/task.repository';
import { UserRepository } from '../../auth/repositories/user.repository';
import { EventsService } from '../../events/events.service';
import { AddCommentUseCase } from '../use-cases/add-comment.use-case';
import { ListCommentsUseCase } from '../use-cases/list-comments.use-case';
import { Comment } from '../domain/comment.entity';
import { Task } from '../../tasks/domain/task.entity';
import { User } from '../../auth/domain/user.entity';
import { TaskStatus, TaskPriority } from '../../tasks/domain/task.enums';
import { TaskNotFoundException, UserNotFoundException } from '../../shared/exceptions/business.exceptions';

const mockUser: User = {
  id: 'user-1',
  email: 'author@qualle.com',
  password: 'hash',
  name: 'Author',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: null,
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
  content: 'This is a comment',
  task: mockTask,
  taskId: mockTask.id,
  author: mockUser,
  authorId: mockUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Comments Use Cases', () => {
  let addCommentUseCase: AddCommentUseCase;
  let listCommentsUseCase: ListCommentsUseCase;
  let commentRepository: CommentRepository;
  let taskRepository: TaskRepository;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddCommentUseCase,
        ListCommentsUseCase,
        {
          provide: CommentRepository,
          useValue: {
            findById: vi.fn(),
            findByTaskId: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: TaskRepository,
          useValue: {
            findByIdWithAssignees: vi.fn(),
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
            newComment: vi.fn(),
          },
        },
      ],
    }).compile();

    addCommentUseCase = module.get<AddCommentUseCase>(AddCommentUseCase);
    listCommentsUseCase = module.get<ListCommentsUseCase>(ListCommentsUseCase);
    commentRepository = module.get<CommentRepository>(CommentRepository);
    taskRepository = module.get<TaskRepository>(TaskRepository);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('AddCommentUseCase', () => {
    const input = { taskId: mockTask.id, content: 'This is a comment' };

    it('should add a comment and emit event', async () => {
      vi.spyOn(taskRepository, 'findByIdWithAssignees').mockResolvedValue(mockTask);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      vi.spyOn(commentRepository, 'create').mockResolvedValue(mockComment);
      vi.spyOn(commentRepository, 'findById').mockResolvedValue(mockComment);

      const result = await addCommentUseCase.execute(input, mockUser.id);

      expect(result).toEqual(mockComment);
    });

    it('should throw TaskNotFoundException', async () => {
      vi.spyOn(taskRepository, 'findByIdWithAssignees').mockResolvedValue(null);

      await expect(
        addCommentUseCase.execute(input, mockUser.id),
      ).rejects.toThrow(TaskNotFoundException);
    });

    it('should throw UserNotFoundException', async () => {
      vi.spyOn(taskRepository, 'findByIdWithAssignees').mockResolvedValue(mockTask);
      vi.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(
        addCommentUseCase.execute(input, 'bad-user'),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('ListCommentsUseCase', () => {
    it('should return comments for a task', async () => {
      vi.spyOn(commentRepository, 'findByTaskId').mockResolvedValue([mockComment]);

      const result = await listCommentsUseCase.execute(mockTask.id);

      expect(result).toHaveLength(1);
    });

    it('should return empty array', async () => {
      vi.spyOn(commentRepository, 'findByTaskId').mockResolvedValue([]);

      const result = await listCommentsUseCase.execute('empty');

      expect(result).toEqual([]);
    });
  });
});
