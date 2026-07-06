import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CurrentUser, extractUserFromContext } from '../current-user.decorator';

vi.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: vi.fn(),
  },
}));

describe('CurrentUser', () => {
  const mockExecutionContext = {
    getType: vi.fn().mockReturnValue('graphql'),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a param decorator created by createParamDecorator', () => {
    expect(CurrentUser).toBeDefined();
    expect(typeof CurrentUser).toBe('function');
  });
});

describe('extractUserFromContext', () => {
  const mockExecutionContext = {
    getType: vi.fn().mockReturnValue('graphql'),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract user from GQL context request', () => {
    const mockUser = { sub: 'user-1', email: 'test@qualle.com' };
    const mockGqlContext = {
      getContext: vi.fn().mockReturnValue({
        req: { user: mockUser },
      }),
    };
    vi.mocked(GqlExecutionContext.create).mockReturnValue(mockGqlContext as any);

    const result = extractUserFromContext(undefined, mockExecutionContext);

    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
    expect(result).toEqual(mockUser);
  });

  it('should return undefined when user is not set', () => {
    const mockGqlContext = {
      getContext: vi.fn().mockReturnValue({
        req: {},
      }),
    };
    vi.mocked(GqlExecutionContext.create).mockReturnValue(mockGqlContext as any);

    const result = extractUserFromContext(undefined, mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should return undefined when req is missing', () => {
    const mockGqlContext = {
      getContext: vi.fn().mockReturnValue({}),
    };
    vi.mocked(GqlExecutionContext.create).mockReturnValue(mockGqlContext as any);

    const result = extractUserFromContext(undefined, mockExecutionContext);

    expect(result).toBeUndefined();
  });
});
