import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType('User')
@Entity('users')
export class UserTypeormEntity {
  @Field(() => ID)
  @ApiProperty()
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Field()
  @ApiProperty()
  @Column({ unique: true, type: 'varchar' })
  email: string;

  @Column({ select: false, type: 'varchar' })
  password: string;

  @Field()
  @ApiProperty()
  @Column({ type: 'varchar' })
  name: string;

  @Field()
  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
