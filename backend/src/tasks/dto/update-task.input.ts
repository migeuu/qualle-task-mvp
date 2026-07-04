import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { TaskStatus, TaskPriority } from '../domain/task.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class UpdateTaskInput {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Field(() => ID)
  @IsString()
  id: string;

  @ApiPropertyOptional({ example: 'Updated title' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @Field(() => TaskStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @Field(() => TaskPriority, { nullable: true })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @Field({ nullable: true })
  @IsOptional()
  dueDate?: Date;
}
