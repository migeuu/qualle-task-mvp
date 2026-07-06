import { User } from '../../domain/entities/user.entity';
import { UserDto } from '../dtos/user.dto';

export class UserMapper {
  static toDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
