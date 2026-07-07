import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserDto } from '../../dtos/user.dto';
import { UserMapper } from '../../mappers/user.mapper';
import { UserNotFoundException } from '../../../../../shared/exceptions/business.exceptions';

@Injectable()
export class FindUserDetailsUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string): Promise<UserDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    return UserMapper.toDto(user);
  }
}
