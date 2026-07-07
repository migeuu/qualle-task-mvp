import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { AddTaskCommentUseCase } from '../../application/use-cases/task/add-task-comment.use-case';
import { TaskTypeormEntity } from '../../infra/orm/entities/task.typeorm-entity';
import { CreateCommentInput } from '../inputs/create-comment.input';

@Resolver()
export class CommentResolver {
  constructor(
    @Inject(AddTaskCommentUseCase) private readonly addCommentUC: AddTaskCommentUseCase,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  @Mutation(() => TaskTypeormEntity)
  async addComment(
    @Args('input', { type: () => CreateCommentInput }) input: CreateCommentInput,
    @CurrentUser() user: any,
  ): Promise<TaskTypeormEntity> {
    const dto = await this.addCommentUC.execute({
      taskId: input.taskId,
      userId: user.sub,
      content: input.content,
    });
    return (await this.dataSource.manager.findOne(TaskTypeormEntity, {
      where: { id: dto.id },
      relations: ['creator', 'assignees', 'comments', 'comments.author'],
    }))!;
  }
}
