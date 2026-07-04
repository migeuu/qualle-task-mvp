import { Resolver, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Comment } from './domain/comment.entity';
import { NewCommentPayload } from './dto/comment-subscription.types';
import { CreateCommentInput } from './dto/create-comment.input';
import { AddCommentUseCase } from './use-cases/add-comment.use-case';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly addCommentUseCase: AddCommentUseCase,
    private readonly eventsService: EventsService,
  ) {}

  @Mutation(() => Comment)
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Args('input') input: CreateCommentInput,
    @CurrentUser() user: { sub: string },
  ): Promise<Comment> {
    return this.addCommentUseCase.execute(input, user.sub);
  }

  @Subscription(() => NewCommentPayload)
  @UseGuards(JwtAuthGuard)
  newComment(@CurrentUser() user: { sub: string }) {
    return this.eventsService.filterNewComment(user.sub);
  }
}
