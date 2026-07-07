import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class UsersFilterInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  limit?: number;

  @Field({ nullable: true })
  name?: string;
}
