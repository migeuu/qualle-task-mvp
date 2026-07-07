import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/entities/user.entity';
import { UserTypeormEntity } from '../entities/user.typeorm-entity';

@Injectable()
export class UserTypeormRepository implements IUserRepository {
  constructor(private readonly dataSource: DataSource) {}

  private get em() {
    return this.dataSource.manager;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.em.findOne(UserTypeormEntity, { where: { email } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const orm = await this.em
      .createQueryBuilder(UserTypeormEntity, 'user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    return orm ? this.toDomain(orm) : null;
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.em.findOne(UserTypeormEntity, { where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(
    page: number,
    limit: number,
    name?: string,
  ): Promise<{ data: User[]; total: number }> {
    const qb = this.em.createQueryBuilder(UserTypeormEntity, 'user');
    if (name) {
      qb.where('user.name ILIKE :name', { name: `%${name}%` });
    }
    qb.orderBy('user.name', 'ASC');
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { data: items.map((i) => this.toDomain(i)), total };
  }

  async findAllSimple(): Promise<User[]> {
    const items = await this.em.find(UserTypeormEntity, {
      order: { name: 'ASC' },
    });
    return items.map((i) => this.toDomain(i));
  }

  async create(user: User): Promise<User> {
    const orm = this.em.create(UserTypeormEntity, {
      id: user.id || uuid(),
      email: user.email,
      password: user.password,
      name: user.name,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    });
    const saved = await this.em.save(orm);
    return this.toDomain(saved);
  }

  async count(): Promise<number> {
    return this.em.count(UserTypeormEntity);
  }

  private toDomain(orm: UserTypeormEntity): User {
    return new User(
      orm.id,
      orm.email,
      orm.password,
      orm.name,
      orm.createdAt,
      orm.updatedAt,
    );
  }
}
