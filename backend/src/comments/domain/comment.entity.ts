import { Field, ObjectType, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/domain/user.entity';
import { Task } from '../../tasks/domain/task.entity';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

@ObjectType()
@Entity('comments')
export class Comment {
  @ApiProperty({ example: '770e8400-e29b-41d4-a716-446655440002' })
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Great work on this task!' })
  @Field()
  @Column('text')
  content: string;

  @ApiProperty({ type: () => Task })
  @Field(() => Task)
  @ManyToOne(() => Task, (task) => task.comments)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ApiHideProperty()
  @Column({ name: 'task_id' })
  taskId: string;

  @ApiProperty({ type: () => User })
  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ApiHideProperty()
  @Column({ name: 'author_id' })
  authorId: string;

  @ApiProperty()
  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
