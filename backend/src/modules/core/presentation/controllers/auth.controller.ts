import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { Public } from '../../../../shared/decorators/public.decorator';
import { UserSignupUseCase } from '../../application/use-cases/auth/user-signup.use-case';
import { UserLoginUseCase } from '../../application/use-cases/auth/user-login.use-case';
import { FindUserDetailsUseCase } from '../../application/use-cases/user/find-user-details.use-case';
import { FindUsersPaginatedUseCase } from '../../application/use-cases/user/find-users-paginated.use-case';
import { RegisterInput } from '../inputs/register.input';
import { LoginInput } from '../inputs/login.input';
import { AuthPayload } from '../outputs/auth-payload.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signupUC: UserSignupUseCase,
    private readonly loginUC: UserLoginUseCase,
    private readonly findUserDetailsUC: FindUserDetailsUseCase,
    private readonly findUsersPaginatedUC: FindUsersPaginatedUseCase,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() input: RegisterInput): Promise<{ success: boolean }> {
    await this.signupUC.execute(input);
    return { success: true };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns accessToken and refreshToken',
    type: AuthPayload,
  })
  async login(@Body() input: LoginInput): Promise<AuthPayload> {
    return this.loginUC.execute(input);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@Req() req: Request): Promise<any> {
    const userId = (req as any).user?.sub;
    return this.findUserDetailsUC.execute(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users (paginated)' })
  async users(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('name') name?: string,
  ): Promise<any> {
    return this.findUsersPaginatedUC.execute(
      parseInt(page || '1', 10),
      parseInt(limit || '10', 10),
      name,
    );
  }
}
