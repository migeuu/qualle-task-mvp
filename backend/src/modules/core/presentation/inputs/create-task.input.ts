import { InputType, Field } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../domain/enums/task.enum';

@InputType()
export class CreateTaskInput {
  @Field()
  @MaxLength(200)
  title: string;

  @Field({ nullable: true })
  @MaxLength(5000)
  description?: string;

  @Field(() => String, { nullable: true, defaultValue: TaskStatus.TODO })
  status?: TaskStatus;

  @Field(() => String, { nullable: true, defaultValue: TaskPriority.MEDIUM })
  priority?: TaskPriority;

  @Field({ nullable: true })
  dueDate?: Date;
}
