import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { TaskStatus, TaskPriority } from '../domain/task.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class CreateTaskInput {
  @ApiProperty({ example: 'Hire Miguel Marquiori' })
  @Field()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'He is the perfect fit' })
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @Field(() => TaskStatus, { nullable: true, defaultValue: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @Field(() => TaskPriority, { nullable: true, defaultValue: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @Field({ nullable: true })
  @IsOptional()
  dueDate?: Date;
}
