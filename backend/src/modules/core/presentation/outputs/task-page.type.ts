import { ObjectType, Field, Int } from '@nestjs/graphql';
import { TaskTypeormEntity } from '../../infra/orm/entities/task.typeorm-entity';

@ObjectType()
export class TaskPage {
  @Field(() => [TaskTypeormEntity])
  data: TaskTypeormEntity[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
