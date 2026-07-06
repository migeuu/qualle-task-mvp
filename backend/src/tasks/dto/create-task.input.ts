import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
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
  @MaxLength(5000)
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
  @Type(() => Date)
  dueDate?: Date;
}
