import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { RegisterInput } from '../dto/register.input';
import { AuthPayload } from '../dto/auth-payload.type';
import { EmailAlreadyInUseException } from '../../shared/exceptions/business.exceptions';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: RegisterInput): Promise<AuthPayload> {
    const existing = await this.userRepository.findByEmail(input.email);

    if (existing) {
      throw new EmailAlreadyInUseException();
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return AuthPayload.fromUser(user, token);
  }
}
