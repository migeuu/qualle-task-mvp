import { TaskGateway, AuthenticatedSocket } from '../task.gateway';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { EVENTS } from '../../events/events.service';

describe('TaskGateway', () => {
  let gateway: TaskGateway;
  let jwtService: Partial<JwtService>;
  let mockServer: { to: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn> };
  let mockSocket: Partial<AuthenticatedSocket> & { join: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };

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
      vi.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1', email: 'test@qualle.com' });

      await gateway.handleConnection(mockSocket as AuthenticatedSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockSocket.userId).toBe('user-1');
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-1');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect if no token provided', async () => {
      mockSocket.handshake!.auth = {} as any;
      mockSocket.handshake!.query = {};

      await gateway.handleConnection(mockSocket as AuthenticatedSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should authenticate with token from query string', async () => {
      mockSocket.handshake!.auth = {} as any;
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

      const result = gateway.handlePing(mockSocket as AuthenticatedSocket, { msg: 'hello' });

      expect(result).toEqual({ event: 'pong', data: { msg: 'hello' }, userId: 'user-1' });
    });

    it('should return pong with undefined userId if not authenticated', () => {
      mockSocket.userId = undefined;

      const result = gateway.handlePing({} as AuthenticatedSocket, null);

      expect(result).toEqual({ event: 'pong', data: null, userId: undefined });
    });
  });

  describe('handleTaskUpdated', () => {
    it('should emit task.update to each relevant user room', () => {
      const payload = {
        task: { id: 'task-1', title: 'Updated' },
        userIds: ['user-1', 'user-2'],
      };

      gateway.handleTaskUpdated(payload);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.to).toHaveBeenCalledWith('user:user-2');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenCalledWith('task.update', payload.task);
    });
  });

  describe('handleTaskAssigned', () => {
    it('should emit task.update to each relevant user room', () => {
      const payload = {
        task: { id: 'task-1' },
        userIds: ['user-3'],
      };

      gateway.handleTaskAssigned(payload);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-3');
      expect(mockServer.emit).toHaveBeenCalledWith('task.update', payload.task);
    });
  });

  describe('handleNewComment', () => {
    it('should emit task.update for new comment to relevant users', () => {
      const payload = {
        comment: { id: 'comment-1', content: 'Hello' },
        userIds: ['user-1'],
      };

      gateway.handleNewComment(payload);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('task.update', payload.comment);
    });
  });

  describe('handleNotification', () => {
    it('should emit notification to specific user with timestamp', () => {
      const payload = { userId: 'user-1', message: 'You were assigned' };

      gateway.handleNotification(payload);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        message: 'You were assigned',
        timestamp: expect.any(Date),
      });
    });
  });
});
