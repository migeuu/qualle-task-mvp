import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class RegisterInput {
  @ApiProperty({ example: 'alice@qualle.com' })
  @Field()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'Alice Oliveira' })
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
