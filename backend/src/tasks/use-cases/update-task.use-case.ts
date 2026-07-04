import { Injectable } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import { EventsService } from '../../events/events.service';
import { Task } from '../domain/task.entity';
import { UpdateTaskInput } from '../dto/update-task.input';
import { TaskNotFoundException, NotTaskOwnerException } from '../../shared/exceptions/business.exceptions';

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventsService: EventsService,
  ) {}

  async execute(input: UpdateTaskInput, userId: string): Promise<Task> {
    const task = await this.taskRepository.findById(input.id);

    if (!task) {
      throw new TaskNotFoundException();
    }

    if (task.creatorId !== userId) {
      throw new NotTaskOwnerException();
    }

    Object.assign(task, input);
    const saved = await this.taskRepository.save(task);

    const updated = (await this.taskRepository.findById(saved.id))!;

    this.eventsService.taskUpdated(updated);

    return updated;
  }
}
