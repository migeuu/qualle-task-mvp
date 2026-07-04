import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { LoginUseCase } from '../use-cases/login.use-case';
import { GetProfileUseCase } from '../use-cases/get-profile.use-case';
import { User } from '../domain/user.entity';
import { RegisterInput } from '../dto/register.input';
import { LoginInput } from '../dto/login.input';
import { EmailAlreadyInUseException, InvalidCredentialsException, UserNotFoundException } from '../../shared/exceptions/business.exceptions';
import * as bcrypt from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: vi.fn(),
}));

const bcryptMock = vi.mocked(bcrypt);

const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@qualle.com',
  password: '$2a$10$hashedpassword',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Auth Use Cases', () => {
  let registerUseCase: RegisterUseCase;
  let loginUseCase: LoginUseCase;
  let getProfileUseCase: GetProfileUseCase;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        LoginUseCase,
        GetProfileUseCase,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: vi.fn(),
            findByEmailWithPassword: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: vi.fn().mockReturnValue('mock-jwt-token') },
        },
      ],
    }).compile();

    registerUseCase = module.get<RegisterUseCase>(RegisterUseCase);
    loginUseCase = module.get<LoginUseCase>(LoginUseCase);
    getProfileUseCase = module.get<GetProfileUseCase>(GetProfileUseCase);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('RegisterUseCase', () => {
    const input: RegisterInput = {
      email: 'test@qualle.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should create a new user and return auth payload', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(userRepository, 'create').mockResolvedValue(mockUser);

      const result = await registerUseCase.execute(input);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should throw EmailAlreadyInUseException if email exists', async () => {
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);

      await expect(registerUseCase.execute(input)).rejects.toThrow(EmailAlreadyInUseException);
    });
  });

  describe('LoginUseCase', () => {
    const input: LoginInput = {
      email: 'test@qualle.com',
      password: 'password123',
    };

    it('should return auth payload with valid credentials', async () => {
      vi.spyOn(userRepository, 'findByEmailWithPassword').mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true);

      const result = await loginUseCase.execute(input);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should throw InvalidCredentialsException if user not found', async () => {
      vi.spyOn(userRepository, 'findByEmailWithPassword').mockResolvedValue(null);

      await expect(loginUseCase.execute(input)).rejects.toThrow(InvalidCredentialsException);
    });

    it('should throw InvalidCredentialsException if password wrong', async () => {
      vi.spyOn(userRepository, 'findByEmailWithPassword').mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false);

      await expect(loginUseCase.execute(input)).rejects.toThrow(InvalidCredentialsException);
    });
  });

  describe('GetProfileUseCase', () => {
    it('should return user by id', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

      const result = await getProfileUseCase.execute(mockUser.id);

      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundException if user not found', async () => {
      vi.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(getProfileUseCase.execute('nonexistent')).rejects.toThrow(UserNotFoundException);
    });
  });
});
