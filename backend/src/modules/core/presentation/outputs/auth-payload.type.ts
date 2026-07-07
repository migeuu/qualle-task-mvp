import { ObjectType, Field } from '@nestjs/graphql';
import { UserTypeormEntity } from '../../infra/orm/entities/user.typeorm-entity';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => UserTypeormEntity)
  user: UserTypeormEntity;
}
