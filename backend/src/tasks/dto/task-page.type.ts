import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Task } from '../domain/task.entity';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class TaskPage {
  @ApiProperty({ type: () => [Task] })
  @Field(() => [Task])
  items: Task[];

  @ApiProperty({ example: 10 })
  @Field(() => Int)
  total: number;
}
