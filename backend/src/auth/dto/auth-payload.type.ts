import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../domain/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class AuthPayload {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  @Field()
  accessToken: string;

  @ApiProperty({ type: () => User })
  @Field(() => User)
  user: User;

  static fromUser(user: User, accessToken: string): AuthPayload {
    return { accessToken, user };
  }
}
