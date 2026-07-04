import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class CreateCommentInput {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Field(() => ID)
  @IsString()
  taskId: string;

  @ApiProperty({ example: 'Great work on this task!' })
  @Field()
  @IsString()
  @MaxLength(1000)
  content: string;
}
