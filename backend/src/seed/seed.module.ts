import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypeormEntity } from '../modules/core/infra/orm/entities/user.typeorm-entity';
import { TaskTypeormEntity } from '../modules/core/infra/orm/entities/task.typeorm-entity';
import { SeedService } from './seed.service';
import { SeedResolver } from './seed.resolver';
import { SeedController } from './seed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeormEntity, TaskTypeormEntity])],
  controllers: [SeedController],
  providers: [SeedService, SeedResolver],
})
export class SeedModule {}
