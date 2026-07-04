import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './domain/user.entity';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.type';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { GetProfileUseCase } from './use-cases/get-profile.use-case';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { Public } from '../shared/decorators/public.decorator';
import { UserRepository } from './repositories/user.repository';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly userRepository: UserRepository,
  ) {}

  @Mutation(() => AuthPayload)
  @Public()
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.registerUseCase.execute(input);
  }

  @Mutation(() => AuthPayload)
  @Public()
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.loginUseCase.execute(input);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { sub: string }): Promise<User> {
    return this.getProfileUseCase.execute(user.sub);
  }

  @Query(() => [User])
  @UseGuards(JwtAuthGuard)
  async users(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
