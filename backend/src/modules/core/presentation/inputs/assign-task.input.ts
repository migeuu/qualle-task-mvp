import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, ArrayMinSize } from 'class-validator';

@InputType()
export class AssignTaskInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field(() => [ID])
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  assigneeIds: string[];
}
