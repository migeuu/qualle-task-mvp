import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailAlreadyInUseException extends HttpException {
  constructor() {
    super('Email already in use', HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super('Invalid credentials', HttpStatus.UNAUTHORIZED);
  }
}

export class UserNotFoundException extends HttpException {
  constructor() {
    super('User not found', HttpStatus.NOT_FOUND);
  }
}

export class TaskNotFoundException extends HttpException {
  constructor() {
    super('Task not found', HttpStatus.NOT_FOUND);
  }
}

export class NotTaskOwnerException extends HttpException {
  constructor() {
    super('You are not the owner of this task', HttpStatus.FORBIDDEN);
  }
}

export class CommentNotFoundException extends HttpException {
  constructor() {
    super('Comment not found', HttpStatus.NOT_FOUND);
  }
}

export class NotAuthorizedToAssignException extends HttpException {
  constructor() {
    super('Only the task creator can assign users to this task', HttpStatus.FORBIDDEN);
  }
}
