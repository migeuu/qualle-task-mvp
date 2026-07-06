import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserDto } from '../../dtos/user.dto';
import { UserMapper } from '../../mappers/user.mapper';

@Injectable()
export class FindUserDetailsUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<UserDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('Resource not found');
    }
    return UserMapper.toDto(user);
  }
}
