import { CommentsResolver } from '../comments.resolver';
import { AddCommentUseCase } from '../use-cases/add-comment.use-case';
import { EventsService } from '../../events/events.service';
import { Comment } from '../domain/comment.entity';
import { CreateCommentInput } from '../dto/create-comment.input';
import { TaskStatus, TaskPriority } from '../../tasks/domain/task.enums';

const mockTask = {
  id: 'task-1',
  title: 'Test',
  description: null,
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
  creatorId: 'user-1',
  creator: { id: 'user-1', email: 'test@qualle.com', password: 'hash', name: 'Creator', createdAt: new Date(), updatedAt: new Date() },
  assignees: [],
  comments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockComment: Comment = {
  id: 'comment-1',
  content: 'Test comment',
  task: mockTask as any,
  taskId: 'task-1',
  author: mockTask.creator,
  authorId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CommentsResolver', () => {
  let resolver: CommentsResolver;
  let addCommentUseCase: AddCommentUseCase;
  let eventsService: EventsService;

  beforeEach(() => {
    addCommentUseCase = { execute: vi.fn() } as unknown as AddCommentUseCase;
    eventsService = {
      filterNewComment: vi.fn(),
    } as unknown as EventsService;

    resolver = new CommentsResolver(addCommentUseCase, eventsService);
  });

  describe('addComment', () => {
    it('should delegate to AddCommentUseCase', async () => {
      const input: CreateCommentInput = { taskId: 'task-1', content: 'Test comment' };
      vi.spyOn(addCommentUseCase, 'execute').mockResolvedValue(mockComment);

      const result = await resolver.addComment(input, { sub: 'user-1' });

      expect(addCommentUseCase.execute).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toEqual(mockComment);
    });
  });

  describe('newComment', () => {
    it('should delegate to EventsService.filterNewComment', () => {
      const mockIterator = Symbol('iterator');
      vi.spyOn(eventsService, 'filterNewComment').mockReturnValue(mockIterator as any);

      const result = resolver.newComment({ sub: 'user-1' });

      expect(eventsService.filterNewComment).toHaveBeenCalledWith('user-1');
      expect(result).toBe(mockIterator);
    });
  });
});
