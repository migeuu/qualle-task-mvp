import { JwtAuthGuard } from '../jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

vi.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: vi.fn(),
  },
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: Partial<JwtService>;
  let reflector: Partial<Reflector>;
  let mockContext: Partial<ExecutionContext>;
  let mockGqlContext: Record<string, unknown>;

  beforeEach(() => {
    jwtService = { verify: vi.fn() };
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };

    mockGqlContext = {
      req: {
        headers: { authorization: 'Bearer valid-token' },
        user: undefined,
      },
      authorization: undefined,
    };

    vi.mocked(GqlExecutionContext.create).mockReturnValue({
      getContext: () => mockGqlContext,
    } as any);

    mockContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      getType: vi.fn().mockReturnValue('graphql'),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
    };

    guard = new JwtAuthGuard(jwtService as JwtService, reflector as Reflector);
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should return true with valid Bearer token', async () => {
      vi.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1' });

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockGqlContext.req).toHaveProperty('user', { sub: 'user-1' });
    });

    it('should return false if no auth header', async () => {
      mockGqlContext.req = { headers: {} };

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false if auth header is not Bearer', async () => {
      mockGqlContext.req = { headers: { authorization: 'Basic xxx' } };

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false on invalid token', async () => {
      vi.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid');
      });

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should support authorization from gqlContext.authorization (WebSocket)', async () => {
      mockGqlContext.req = { headers: {} };
      mockGqlContext.authorization = 'Bearer ws-token';
      vi.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'ws-user' });

      const result = await guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('ws-token');
    });

    it('should check for IS_PUBLIC_KEY on handler and class', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      vi.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-1' });

      await guard.canActivate(mockContext as ExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler!(),
        mockContext.getClass!(),
      ]);
    });
  });
});
