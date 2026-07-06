import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { AddTaskCommentUseCase } from '../../application/use-cases/task/add-task-comment.use-case';
import { TaskTypeormRepository } from '../../infra/orm/repositories/task.typeorm-repository';
import { TaskTypeormEntity } from '../../infra/orm/entities/task.typeorm-entity';
import { CreateCommentInput } from '../inputs/create-comment.input';

@Resolver()
export class CommentResolver {
  constructor(
    private readonly addCommentUC: AddTaskCommentUseCase,
    private readonly taskRepo: TaskTypeormRepository,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => TaskTypeormEntity)
  async addComment(
    @Args('input') input: CreateCommentInput,
    @CurrentUser() user: any,
  ): Promise<TaskTypeormEntity> {
    const dto = await this.addCommentUC.execute({
      taskId: input.taskId,
      userId: user.sub,
      content: input.content,
    });
    const found = await this.taskRepo.findById(dto.id);
    return found as unknown as TaskTypeormEntity;
  }
}
