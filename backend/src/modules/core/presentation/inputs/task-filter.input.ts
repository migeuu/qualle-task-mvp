import { InputType, Field } from '@nestjs/graphql';
import { TaskStatus, TaskPriority } from '../../domain/enums/task.enum';

@InputType()
export class TaskFilterInput {
  @Field(() => String, { nullable: true })
  status?: TaskStatus;

  @Field(() => String, { nullable: true })
  priority?: TaskPriority;

  @Field({ nullable: true })
  dueDate?: Date;
}
