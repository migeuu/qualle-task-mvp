import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
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
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
