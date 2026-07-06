import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class AssignTaskInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field(() => [ID])
  assigneeIds: string[];
}
