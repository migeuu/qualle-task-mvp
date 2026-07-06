import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class DeleteTaskInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;
}
