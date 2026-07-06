import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { UserTypeormEntity } from './user.typeorm-entity';
import { CommentTypeormEntity } from './comment.typeorm-entity';
import { TaskStatus, TaskPriority } from '../../../domain/enums/task.enum';

@ObjectType('Task')
@Entity('tasks')
export class TaskTypeormEntity {
  @Field(() => ID)
  @ApiProperty()
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Field()
  @ApiProperty()
  @Column({ length: 200 })
  title: string;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description: string | null;

  @Field(() => String)
  @ApiProperty({ enum: TaskStatus, default: TaskStatus.TODO })
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Field(() => String)
  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Field({ nullable: true })
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  dueDate: Date | null;

  @Column({ type: 'uuid' })
  creatorId: string;

  @Field(() => UserTypeormEntity)
  @ManyToOne(() => UserTypeormEntity)
  @JoinColumn({ name: 'creatorId' })
  creator: UserTypeormEntity;

  @Field(() => [UserTypeormEntity])
  @ManyToMany(() => UserTypeormEntity)
  @JoinTable({
    name: 'task_assignees',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  assignees: UserTypeormEntity[];

  @Field(() => [CommentTypeormEntity])
  @OneToMany(() => CommentTypeormEntity, (comment) => comment.task)
  comments: CommentTypeormEntity[];

  @Field()
  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
