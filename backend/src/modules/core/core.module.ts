import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { registerEnumType } from '@nestjs/graphql';

import { UserTypeormEntity } from './infra/orm/entities/user.typeorm-entity';
import { TaskTypeormEntity } from './infra/orm/entities/task.typeorm-entity';
import { CommentTypeormEntity } from './infra/orm/entities/comment.typeorm-entity';

import { UserTypeormRepository } from './infra/orm/repositories/user.typeorm-repository';
import { TaskTypeormRepository } from './infra/orm/repositories/task.typeorm-repository';
import { CommentTypeormRepository } from './infra/orm/repositories/comment.typeorm-repository';

import { BcryptHashService } from './infra/services/bcrypt-hash.service';
import { JwtAuthService } from './infra/services/jwt-auth.service';
import { TaskEventBusService } from './infra/services/task-event-bus.service';
import { TaskPubSubService } from './infra/services/task-pub-sub.service';

import { UserSignupUseCase } from './application/use-cases/auth/user-signup.use-case';
import { UserLoginUseCase } from './application/use-cases/auth/user-login.use-case';
import { FindUserDetailsUseCase } from './application/use-cases/user/find-user-details.use-case';
import { FindUsersPaginatedUseCase } from './application/use-cases/user/find-users-paginated.use-case';

import { CreateTaskUseCase } from './application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from './application/use-cases/task/update-task.use-case';
import { DeleteTaskUseCase } from './application/use-cases/task/delete-task.use-case';
import { FindTaskDetailsUseCase } from './application/use-cases/task/find-task-details.use-case';
import { FindTasksPaginatedUseCase } from './application/use-cases/task/find-tasks-paginated.use-case';
import { AssignTaskUseCase } from './application/use-cases/task/assign-task.use-case';
import { AddTaskCommentUseCase } from './application/use-cases/task/add-task-comment.use-case';

import { NotifyTaskUpdateUseCase } from './application/use-cases/notification/notify-task-update.use-case';
import { NotifyTaskAssignUseCase } from './application/use-cases/notification/notify-task-assign.use-case';
import { NotifyTaskCommentUseCase } from './application/use-cases/notification/notify-task-comment.use-case';

import { AuthResolver } from './presentation/resolvers/auth.resolver';
import { TaskResolver } from './presentation/resolvers/task.resolver';
import { CommentResolver } from './presentation/resolvers/comment.resolver';

import { AuthController } from './presentation/controllers/auth.controller';
import { TaskController } from './presentation/controllers/task.controller';
import { CommentController } from './presentation/controllers/comment.controller';

import { TaskStatus, TaskPriority } from './domain/enums/task.enum';

registerEnumType(TaskStatus, { name: 'TaskStatus' });
registerEnumType(TaskPriority, { name: 'TaskPriority' });

const pubSubProvider = {
  provide: 'PUB_SUB',
  useValue: new PubSub(),
};

const tokenMappings = [
  { provide: 'IUserRepository', useExisting: UserTypeormRepository },
  { provide: 'ITaskRepository', useExisting: TaskTypeormRepository },
  { provide: 'ICommentRepository', useExisting: CommentTypeormRepository },
  { provide: 'IHashService', useExisting: BcryptHashService },
  { provide: 'IAuthService', useExisting: JwtAuthService },
  { provide: 'ITaskEventBus', useExisting: TaskEventBusService },
  { provide: 'ITaskPubSub', useExisting: TaskPubSubService },
];

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeormEntity, TaskTypeormEntity, CommentTypeormEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '1h' } as any,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
  ],
  controllers: [
    AuthController,
    TaskController,
    CommentController,
  ],
  providers: [
    pubSubProvider,

    UserTypeormRepository,
    TaskTypeormRepository,
    CommentTypeormRepository,

    BcryptHashService,
    JwtAuthService,
    TaskEventBusService,
    TaskPubSubService,

    UserSignupUseCase,
    UserLoginUseCase,
    FindUserDetailsUseCase,
    FindUsersPaginatedUseCase,

    CreateTaskUseCase,
    UpdateTaskUseCase,
    DeleteTaskUseCase,
    FindTaskDetailsUseCase,
    FindTasksPaginatedUseCase,
    AssignTaskUseCase,
    AddTaskCommentUseCase,

    NotifyTaskUpdateUseCase,
    NotifyTaskAssignUseCase,
    NotifyTaskCommentUseCase,

    AuthResolver,
    TaskResolver,
    CommentResolver,

    ...tokenMappings,
  ],
  exports: [
    UserTypeormRepository,
    TaskTypeormRepository,
    CommentTypeormRepository,
    pubSubProvider,
    TaskEventBusService,
    TaskPubSubService,
    JwtModule,
  ],
})
export class CoreModule {}
