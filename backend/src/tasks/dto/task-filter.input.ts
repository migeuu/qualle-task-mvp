import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum } from 'class-validator';
import { TaskStatus, TaskPriority } from '../domain/task.enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class TaskFilterInput {
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
