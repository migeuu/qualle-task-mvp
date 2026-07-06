import { InputType, Field, Int } from '@nestjs/graphql';
import { Min } from 'class-validator';

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @Min(1)
  limit?: number;
}
