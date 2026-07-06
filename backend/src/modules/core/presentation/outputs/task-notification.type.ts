import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class TaskNotificationOutput {
  @Field(() => ID)
  taskId: string;

  @Field(() => ID)
  eventAuthorId: string;

  @Field()
  eventType: string;
}
