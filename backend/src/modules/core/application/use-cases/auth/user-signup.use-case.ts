import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IHashService } from '../../services/hash.service';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class UserSignupUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hashService: IHashService,
  ) {}

  async execute(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await this.hashService.hash(input.password);

    const user = new User(
      uuid(),
      input.email,
      hashedPassword,
      input.name,
      new Date(),
      new Date(),
    );

    await this.userRepo.create(user);
  }
}
