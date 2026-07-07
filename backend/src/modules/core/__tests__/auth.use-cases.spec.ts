import { UserSignupUseCase } from '../application/use-cases/auth/user-signup.use-case';
import { UserLoginUseCase } from '../application/use-cases/auth/user-login.use-case';
import { User } from '../domain/entities/user.entity';

describe('UserSignupUseCase', () => {
  const mockUserRepo = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };
  const mockHashService = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  let useCase: UserSignupUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UserSignupUseCase(mockUserRepo as any, mockHashService);
  });

  it('should create a new user successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockHashService.hash.mockResolvedValue('hashed-pw');
    mockUserRepo.create.mockResolvedValue(undefined);

    await useCase.execute({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'secret123',
    });

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('alice@test.com');
    expect(mockHashService.hash).toHaveBeenCalledWith('secret123');
    expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
    const createdUser: User = mockUserRepo.create.mock.calls[0][0];
    expect(createdUser.name).toBe('Alice');
    expect(createdUser.email).toBe('alice@test.com');
    expect(createdUser.password).toBe('hashed-pw');
    expect(createdUser.id).toBeDefined();
  });

  it('should throw when email is already in use', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(
      new User('id', 'alice@test.com', 'pw', 'Alice', new Date(), new Date()),
    );

    await expect(
      useCase.execute({
        name: 'Alice',
        email: 'alice@test.com',
        password: 'secret123',
      }),
    ).rejects.toThrow('Email already in use');

    expect(mockUserRepo.create).not.toHaveBeenCalled();
  });
});

describe('UserLoginUseCase', () => {
  const mockUserRepo = {
    findByEmailWithPassword: vi.fn(),
  };
  const mockHashService = {
    compare: vi.fn(),
  };
  const mockAuthService = {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
  };

  let useCase: UserLoginUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UserLoginUseCase(
      mockUserRepo as any,
      mockHashService as any,
      mockAuthService as any,
    );
  });

  it('should return tokens on valid credentials', async () => {
    const user = new User(
      'user-1',
      'alice@test.com',
      'hashed',
      'Alice',
      new Date(),
      new Date(),
    );
    mockUserRepo.findByEmailWithPassword.mockResolvedValue(user);
    mockHashService.compare.mockResolvedValue(true);
    mockAuthService.generateAccessToken.mockReturnValue('access-token');
    mockAuthService.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await useCase.execute({
      email: 'alice@test.com',
      password: 'secret123',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: expect.objectContaining({
        id: 'user-1',
        email: 'alice@test.com',
        name: 'Alice',
      }),
    });
    expect(mockHashService.compare).toHaveBeenCalledWith('secret123', 'hashed');
    expect(mockAuthService.generateAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'alice@test.com',
    });
    expect(mockAuthService.generateRefreshToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'alice@test.com',
    });
  });

  it('should throw when email not found', async () => {
    mockUserRepo.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'nope@test.com', password: 'secret123' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('should throw when password does not match', async () => {
    const user = new User(
      'user-1',
      'alice@test.com',
      'hashed',
      'Alice',
      new Date(),
      new Date(),
    );
    mockUserRepo.findByEmailWithPassword.mockResolvedValue(user);
    mockHashService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'alice@test.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid credentials');
  });
});
