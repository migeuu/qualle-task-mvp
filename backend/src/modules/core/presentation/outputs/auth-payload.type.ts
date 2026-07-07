import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType('AuthUser')
export class AuthUser {
  @Field(() => ID)
  @ApiProperty()
  id: string;

  @Field()
  @ApiProperty()
  email: string;

  @Field()
  @ApiProperty()
  name: string;

  @Field()
  @ApiProperty()
  createdAt: Date;

  @Field()
  @ApiProperty()
  updatedAt: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  @ApiProperty()
  accessToken: string;

  @Field()
  @ApiProperty()
  refreshToken: string;

  @Field(() => AuthUser)
  @ApiProperty()
  user: AuthUser;
}
