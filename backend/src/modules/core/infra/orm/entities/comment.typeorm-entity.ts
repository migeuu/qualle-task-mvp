import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { TaskTypeormEntity } from './task.typeorm-entity';
import { UserTypeormEntity } from './user.typeorm-entity';

@ObjectType('Comment')
@Entity('comments')
export class CommentTypeormEntity {
  @Field(() => ID)
  @ApiProperty()
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Field()
  @ApiProperty()
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @Field(() => TaskTypeormEntity, { nullable: true })
  @ManyToOne(() => TaskTypeormEntity, (task) => task.comments)
  @JoinColumn({ name: 'taskId' })
  task: TaskTypeormEntity;

  @Field(() => UserTypeormEntity, { nullable: true })
  @ManyToOne(() => UserTypeormEntity)
  @JoinColumn({ name: 'authorId' })
  author: UserTypeormEntity;

  @Field()
  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
