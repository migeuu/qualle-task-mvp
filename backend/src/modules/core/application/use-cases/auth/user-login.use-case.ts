import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IHashService } from '../../services/hash.service';
import { IAuthService } from '../../services/auth.service';
import { InvalidCredentialsException } from '../../../../../shared/exceptions/business.exceptions';
import { UserDto } from '../../dtos/user.dto';
import { UserMapper } from '../../mappers/user.mapper';

@Injectable()
export class UserLoginUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    @Inject('IHashService') private readonly hashService: IHashService,
    @Inject('IAuthService') private readonly authService: IAuthService,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: UserDto }> {
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

    return { accessToken, refreshToken, user: UserMapper.toDto(user) };
  }
}
