import { FindUserDetailsUseCase } from '../application/use-cases/user/find-user-details.use-case';
import { FindUsersPaginatedUseCase } from '../application/use-cases/user/find-users-paginated.use-case';
import { User } from '../domain/entities/user.entity';

const makeUser = (id: string): User =>
  new User(id, `${id}@test.com`, 'pw', id, new Date(), new Date());

describe('FindUserDetailsUseCase', () => {
  const mockUserRepo = { findById: vi.fn() };

  let useCase: FindUserDetailsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new FindUserDetailsUseCase(mockUserRepo as any);
  });

  it('should return user DTO', async () => {
    mockUserRepo.findById.mockResolvedValue(makeUser('user-1'));

    const result = await useCase.execute('user-1');

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('user-1@test.com');
    expect(result.name).toBe('user-1');
    expect((result as any).password).toBeUndefined();
  });

  it('should throw when user not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toThrow('Resource not found');
  });
});

describe('FindUsersPaginatedUseCase', () => {
  const mockUserRepo = { findAll: vi.fn() };

  let useCase: FindUsersPaginatedUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new FindUsersPaginatedUseCase(mockUserRepo as any);
  });

  it('should return paginated users', async () => {
    mockUserRepo.findAll.mockResolvedValue({ data: [makeUser('user-1'), makeUser('user-2')], total: 2 });

    const result = await useCase.execute(1, 10);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should pass name filter to repository', async () => {
    mockUserRepo.findAll.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute(1, 10, 'Alice');

    expect(mockUserRepo.findAll).toHaveBeenCalledWith(1, 10, 'Alice');
  });

  it('should return empty results', async () => {
    mockUserRepo.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute(1, 10);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
