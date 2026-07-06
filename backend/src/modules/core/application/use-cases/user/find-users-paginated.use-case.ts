import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { UserDto } from '../../dtos/user.dto';
import { PaginatedResult } from '../../dtos/paginated-result.dto';
import { UserMapper } from '../../mappers/user.mapper';

@Injectable()
export class FindUsersPaginatedUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    page: number,
    limit: number,
    name?: string,
  ): Promise<PaginatedResult<UserDto>> {
    const result = await this.userRepo.findAll(page, limit, name);
    return {
      data: result.data.map(UserMapper.toDto),
      total: result.total,
      page,
      limit,
    };
  }
}
