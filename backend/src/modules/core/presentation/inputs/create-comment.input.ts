import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @Field()
  @MaxLength(1000)
  content: string;
}
