import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class AssignTaskInput {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Field(() => ID)
  @IsString()
  taskId: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001' })
  @Field(() => ID)
  @IsString()
  userId: string;
}
