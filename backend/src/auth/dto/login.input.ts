import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class LoginInput {
  @ApiProperty({ example: 'alice@qualle.com' })
  @Field()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @Field()
  @IsString()
  password: string;
}
