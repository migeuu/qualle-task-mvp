import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IHashService } from '../../services/hash.service';
import { IAuthService } from '../../services/auth.service';
import { InvalidCredentialsException } from '../../../../../shared/exceptions/business.exceptions';

@Injectable()
export class UserLoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hashService: IHashService,
    private readonly authService: IAuthService,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmailWithPassword(input.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isValid = await this.hashService.compare(
      input.password,
      user.password,
    );
    if (!isValid) {
      throw new InvalidCredentialsException();
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.authService.generateAccessToken(payload);
    const refreshToken = this.authService.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }
}
