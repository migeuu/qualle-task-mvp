import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class AssignTaskInput {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Field(() => ID)
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001' })
  @Field(() => ID)
  @IsUUID()
  userId: string;
}
