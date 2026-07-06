import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IHashService } from '../../application/services/hash.service';

@Injectable()
export class BcryptHashService implements IHashService {
  private readonly rounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
