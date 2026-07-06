import { TaskGateway, AuthenticatedSocket } from '../task.gateway';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { TaskEventVO } from '../../modules/core/domain/value-objects/task-event.vo';

describe('TaskGateway', () => {
  let gateway: TaskGateway;
  let jwtService: Partial<JwtService>;
  let mockServer: {
    to: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };
  let mockSocket: Partial<AuthenticatedSocket> & {
    join: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    jwtService = { verify: vi.fn() };

    mockServer = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    mockSocket = {
      id: 'socket-1',
      userId: undefined,
      handshake: {
        auth: { token: 'valid-token' },
        query: {},
        headers: {},
      } as any,
      join: vi.fn(),
      disconnect: vi.fn(),
    };

    gateway = new TaskGateway(jwtService as JwtService);
    (gateway as any).server = mockServer;
  });

  describe('handleConnection', () => {
    it('should authenticate and join user room with valid token', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'user-1',
        email: 'test@qualle.com',
      });

      await gateway.handleConnection(mockSocket as AuthenticatedSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockSocket.userId).toBe('user-1');
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-1');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect if no token provided', async () => {
      mockSocket.handshake!.auth = {};
      mockSocket.handshake!.query = {};

      await gateway.handleConnection(mockSocket as AuthenticatedSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should authenticate with token from query string', async () => {
      mockSocket.handshake!.auth = {};
      mockSocket.handshake!.query = { token: 'query-token' };
      vi.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-2' });

      await gateway.handleConnection(mockSocket as AuthenticatedSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('query-token');
      expect(mockSocket.userId).toBe('user-2');
    });

    it('should disconnect on invalid token', async () => {
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket as AuthenticatedSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection', () => {
      mockSocket.userId = 'user-1';

      gateway.handleDisconnect(mockSocket as AuthenticatedSocket);

      expect(true).toBe(true);
    });
  });

  describe('handlePing', () => {
    it('should return pong with data and userId', () => {
      mockSocket.userId = 'user-1';

      const result = gateway.handlePing(mockSocket as AuthenticatedSocket, {
        msg: 'hello',
      });

      expect(result).toEqual({
        event: 'pong',
        data: { msg: 'hello' },
        userId: 'user-1',
      });
    });

    it('should return pong with undefined userId if not authenticated', () => {
      mockSocket.userId = undefined;

      const result = gateway.handlePing({} as AuthenticatedSocket, null);

      expect(result).toEqual({ event: 'pong', data: null, userId: undefined });
    });
  });

  describe('handleTaskUpdated', () => {
    it('should emit task.update to each relevant user room', () => {
      const event = new TaskEventVO('task-1', 'author-1', 'TASK_UPDATED', [
        'user-1',
        'user-2',
      ]);

      gateway.handleTaskUpdated(event);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.to).toHaveBeenCalledWith('user:user-2');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledWith('task.update', {
        taskId: 'task-1',
        eventAuthorId: 'author-1',
        eventType: 'TASK_UPDATED',
      });
    });
  });

  describe('handleTaskAssigned', () => {
    it('should emit task.update to each relevant user room', () => {
      const event = new TaskEventVO('task-1', 'author-1', 'TASK_ASSIGNED', [
        'user-3',
      ]);

      gateway.handleTaskAssigned(event);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-3');
      expect(mockServer.emit).toHaveBeenCalledWith('task.update', {
        taskId: 'task-1',
        eventAuthorId: 'author-1',
        eventType: 'TASK_ASSIGNED',
      });
    });
  });

  describe('handleNewComment', () => {
    it('should emit task.update for new comment to relevant users', () => {
      const event = new TaskEventVO('task-1', 'author-1', 'TASK_NEW_COMMENT', [
        'user-1',
      ]);

      gateway.handleNewComment(event);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('task.update', {
        taskId: 'task-1',
        eventAuthorId: 'author-1',
        eventType: 'TASK_NEW_COMMENT',
      });
    });
  });

  describe('handleNotification', () => {
    it('should emit notification to specific user with timestamp', () => {
      const event = new TaskEventVO('task-1', 'author-1', 'TASK_ASSIGNED', [
        'user-1',
      ]);
      const payload = {
        type: 'notification',
        userId: 'user-1',
        payload: event,
      };

      gateway.handleNotification(payload);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        taskId: 'task-1',
        eventAuthorId: 'author-1',
        eventType: 'TASK_ASSIGNED',
        timestamp: expect.any(Date),
      });
    });
  });
});
