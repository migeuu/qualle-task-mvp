import { Module } from '@nestjs/common';
import { TaskGateway } from './task.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TaskGateway],
  exports: [TaskGateway],
})
export class GatewayModule {}
