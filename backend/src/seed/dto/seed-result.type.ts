import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class SeedResult {
  @ApiProperty({ example: 'Seed applied successfully' })
  @Field()
  message: string;

  @ApiProperty({ example: 4 })
  @Field(() => Int)
  usersCreated: number;

  @ApiProperty({ example: 10 })
  @Field(() => Int)
  tasksCreated: number;
}
