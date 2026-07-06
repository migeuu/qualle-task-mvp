import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { Public } from '../../../../shared/decorators/public.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { UserSignupUseCase } from '../../application/use-cases/auth/user-signup.use-case';
import { UserLoginUseCase } from '../../application/use-cases/auth/user-login.use-case';
import { FindUserDetailsUseCase } from '../../application/use-cases/user/find-user-details.use-case';
import { FindUsersPaginatedUseCase } from '../../application/use-cases/user/find-users-paginated.use-case';
import { UserTypeormRepository } from '../../infra/orm/repositories/user.typeorm-repository';
import { UserTypeormEntity } from '../../infra/orm/entities/user.typeorm-entity';
import { RegisterInput } from '../inputs/register.input';
import { LoginInput } from '../inputs/login.input';
import { AuthPayload } from '../outputs/auth-payload.type';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly signupUC: UserSignupUseCase,
    private readonly loginUC: UserLoginUseCase,
    private readonly findUserDetailsUC: FindUserDetailsUseCase,
    private readonly findUsersPaginatedUC: FindUsersPaginatedUseCase,
    private readonly userRepo: UserTypeormRepository,
  ) {}

  @Public()
  @Mutation(() => Boolean)
  async register(@Args('input') input: RegisterInput): Promise<boolean> {
    await this.signupUC.execute(input);
    return true;
  }

  @Public()
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.loginUC.execute(input);
  }

  @Query(() => UserTypeormEntity)
  async me(@CurrentUser() user: any): Promise<UserTypeormEntity> {
    const dto = await this.findUserDetailsUC.execute(user.sub);
    const found = await this.userRepo.findById(dto.id);
    return found as unknown as UserTypeormEntity;
  }

  @Query(() => [UserTypeormEntity])
  async users(
    @Args('input', { nullable: true })
    input?: {
      page?: number;
      limit?: number;
      name?: string;
    },
  ): Promise<UserTypeormEntity[]> {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 10;
    const result = await this.findUsersPaginatedUC.execute(
      page,
      limit,
      input?.name,
    );
    const entities: UserTypeormEntity[] = [];
    for (const dto of result.data) {
      const orm = new UserTypeormEntity();
      orm.id = dto.id;
      orm.name = dto.name;
      orm.email = dto.email;
      orm.createdAt = dto.createdAt;
      orm.updatedAt = dto.updatedAt;
      entities.push(orm);
    }
    return entities;
  }
}
