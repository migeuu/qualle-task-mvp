import { Field, ObjectType, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { User } from '../../auth/domain/user.entity';
import { Comment } from '../../comments/domain/comment.entity';
import { TaskStatus, TaskPriority } from './task.enums';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';

@ObjectType()
@Entity('tasks')
export class Task {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Hire Miguel Marquiori' })
  @Field()
  @Column({ length: 200 })
  title: string;

  @ApiPropertyOptional({ example: 'He is the perfect fit' })
  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  @Field(() => TaskStatus)
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  @Field(() => TaskPriority)
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @ApiPropertyOptional()
  @Field({ nullable: true })
  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;

  @ApiProperty({ type: () => User })
  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @ApiHideProperty()
  @Column({ name: 'creator_id' })
  creatorId: string;

  @ApiProperty({ type: () => [User] })
  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable({
    name: 'task_assignees',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignees: User[];

  @ApiProperty({ type: () => [Comment] })
  @Field(() => [Comment])
  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @ApiProperty()
  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
