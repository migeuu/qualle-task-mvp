import { AuthResolver } from '../auth.resolver';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { LoginUseCase } from '../use-cases/login.use-case';
import { GetProfileUseCase } from '../use-cases/get-profile.use-case';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../domain/user.entity';
import { RegisterInput } from '../dto/register.input';
import { LoginInput } from '../dto/login.input';

const mockUser: User = {
  id: 'user-1',
  email: 'test@qualle.com',
  password: 'hash',
  name: 'Test',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAuthPayload = {
  accessToken: 'jwt-token',
  user: mockUser,
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let registerUseCase: RegisterUseCase;
  let loginUseCase: LoginUseCase;
  let getProfileUseCase: GetProfileUseCase;
  let userRepository: UserRepository;

  beforeEach(() => {
    registerUseCase = { execute: vi.fn() } as unknown as RegisterUseCase;
    loginUseCase = { execute: vi.fn() } as unknown as LoginUseCase;
    getProfileUseCase = { execute: vi.fn() } as unknown as GetProfileUseCase;
    userRepository = { findAll: vi.fn() } as unknown as UserRepository;

    resolver = new AuthResolver(registerUseCase, loginUseCase, getProfileUseCase, userRepository);
  });

  describe('register', () => {
    it('should delegate to RegisterUseCase', async () => {
      const input: RegisterInput = { email: 'test@qualle.com', password: '123456', name: 'Test' };
      vi.spyOn(registerUseCase, 'execute').mockResolvedValue(mockAuthPayload);

      const result = await resolver.register(input);

      expect(registerUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockAuthPayload);
    });
  });

  describe('login', () => {
    it('should delegate to LoginUseCase', async () => {
      const input: LoginInput = { email: 'test@qualle.com', password: '123456' };
      vi.spyOn(loginUseCase, 'execute').mockResolvedValue(mockAuthPayload);

      const result = await resolver.login(input);

      expect(loginUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockAuthPayload);
    });
  });

  describe('me', () => {
    it('should delegate to GetProfileUseCase with user.sub', async () => {
      vi.spyOn(getProfileUseCase, 'execute').mockResolvedValue(mockUser);

      const result = await resolver.me({ sub: 'user-1' });

      expect(getProfileUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('users', () => {
    it('should delegate to UserRepository.findAll', async () => {
      const mockUsers = [mockUser];
      vi.spyOn(userRepository, 'findAll').mockResolvedValue(mockUsers);

      const result = await resolver.users();

      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });
});
