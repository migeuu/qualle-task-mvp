import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, MaxLength } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../domain/enums/task.enum';

@InputType()
export class UpdateTaskInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field({ nullable: true })
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @MaxLength(5000)
  description?: string;

  @Field(() => String, { nullable: true })
  status?: TaskStatus;

  @Field(() => String, { nullable: true })
  priority?: TaskPriority;

  @Field({ nullable: true })
  dueDate?: Date;
}
