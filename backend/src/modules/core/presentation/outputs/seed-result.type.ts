import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class SeedResult {
  @Field()
  message: string;

  @Field(() => Int)
  usersCreated: number;

  @Field(() => Int)
  tasksCreated: number;
}
