import { UserDto } from './user.dto';
import { CommentDto } from './comment.dto';

export class TaskDto {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  creator: UserDto;
  assignees: UserDto[];
  comments: CommentDto[];
  createdAt: Date;
  updatedAt: Date;
}
