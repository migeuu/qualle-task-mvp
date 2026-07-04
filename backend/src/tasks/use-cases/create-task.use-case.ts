import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { UserRepository } from '../../auth/repositories/user.repository';
import { EventsService } from '../../events/events.service';
import { Task } from '../domain/task.entity';
import { CreateTaskInput } from '../dto/create-task.input';
import { UserNotFoundException } from '../../shared/exceptions/business.exceptions';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userRepository: UserRepository,
    private readonly eventsService: EventsService,
  ) {}

  async execute(input: CreateTaskInput, userId: string): Promise<Task> {
    const creator = await this.userRepository.findById(userId);

    if (!creator) {
      throw new UserNotFoundException();
    }

    const saved = await this.taskRepository.create({
      ...input,
      creatorId: userId,
    });

    const task = (await this.taskRepository.findById(saved.id))!;

    this.eventsService.taskUpdated(task);

    return task;
  }
}
