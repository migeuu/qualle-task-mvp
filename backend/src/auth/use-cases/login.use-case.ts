import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { LoginInput } from '../dto/login.input';
import { AuthPayload } from '../dto/auth-payload.type';
import { InvalidCredentialsException } from '../../shared/exceptions/business.exceptions';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginInput): Promise<AuthPayload> {
    const user = await this.userRepository.findByEmailWithPassword(input.email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new InvalidCredentialsException();
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return AuthPayload.fromUser(user, token);
  }
}
