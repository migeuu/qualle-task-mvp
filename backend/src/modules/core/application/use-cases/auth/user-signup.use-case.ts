import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { QueryFailedError } from 'typeorm';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IHashService } from '../../services/hash.service';
import { User } from '../../../domain/entities/user.entity';
import { EmailAlreadyInUseException } from '../../../../../shared/exceptions/business.exceptions';

@Injectable()
export class UserSignupUseCase {
  private readonly logger = new Logger(UserSignupUseCase.name);

  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    @Inject('IHashService') private readonly hashService: IHashService,
  ) {}

  async execute(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyInUseException();
    }

    const hashedPassword = await this.hashService.hash(input.password);

    const user = new User(
      randomUUID(),
      input.email,
      hashedPassword,
      input.name,
      new Date(),
      new Date(),
    );

    try {
      await this.userRepo.create(user);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        err.driverError?.code === '23505'
      ) {
        this.logger.warn(
          `Race condition caught: email ${input.email} already exists`,
        );
        throw new EmailAlreadyInUseException();
      }
      throw err;
    }
  }
}
