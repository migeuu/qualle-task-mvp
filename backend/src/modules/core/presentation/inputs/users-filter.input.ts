import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UsersFilterInput {
  @Field({ nullable: true })
  name?: string;
}
