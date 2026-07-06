import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TaskGateway } from './task.gateway';
import { UserTypeormRepository } from '../modules/core/infra/orm/repositories/user.typeorm-repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypeormEntity } from '../modules/core/infra/orm/entities/user.typeorm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeormEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '1h' } as any,
    }),
  ],
  providers: [TaskGateway, UserTypeormRepository],
  exports: [TaskGateway],
})
export class GatewayModule {}
