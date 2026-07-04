import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/domain/user.entity';
import { Task } from '../tasks/domain/task.entity';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { SeedController } from './seed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Task])],
  controllers: [SeedController],
  providers: [SeedService, SeedResolver],
})
export class SeedModule {}
