import { Field, ObjectType } from '@nestjs/graphql';
import { Comment } from '../domain/comment.entity';

@ObjectType()
export class NewCommentPayload {
  @Field(() => Comment)
  newComment: Comment;
}
