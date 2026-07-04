import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './domain/task.entity';
import { User } from '../auth/domain/user.entity';
import { TaskRepository } from './repositories/task.repository';
import { CreateTaskUseCase } from './use-cases/create-task.use-case';
import { UpdateTaskUseCase } from './use-cases/update-task.use-case';
import { DeleteTaskUseCase } from './use-cases/delete-task.use-case';
import { GetTaskUseCase } from './use-cases/get-task.use-case';
import { ListTasksUseCase } from './use-cases/list-tasks.use-case';
import { AssignTaskUseCase } from './use-cases/assign-task.use-case';
import { TasksResolver } from './tasks.resolver';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User]), AuthModule],
  controllers: [TasksController],
  providers: [
    TaskRepository,
    CreateTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    GetTaskUseCase,
    ListTasksUseCase,
    AssignTaskUseCase,
    TasksResolver,
  ],
  exports: [TaskRepository],
})
export class TasksModule {}
