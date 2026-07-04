import { Field, ObjectType } from '@nestjs/graphql';
import { Task } from '../domain/task.entity';

@ObjectType()
export class TaskUpdatedPayload {
  @Field(() => Task)
  taskUpdated: Task;
}

@ObjectType()
export class TaskAssignedPayload {
  @Field(() => Task)
  taskAssigned: Task;
}
