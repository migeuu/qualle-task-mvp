import { User } from '../entities/user.entity';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(
    page: number,
    limit: number,
    name?: string,
  ): Promise<{ data: User[]; total: number }>;
  findAllSimple(): Promise<User[]>;
  create(user: User): Promise<User>;
  count(): Promise<number>;
}
