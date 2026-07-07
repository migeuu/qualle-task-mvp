import { Inject, Injectable } from '@nestjs/common';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { AuthorizationService } from '../../services/authorization.service';

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject('ITaskRepository') private readonly taskRepo: ITaskRepository,
    private readonly authz: AuthorizationService,
  ) {}

  async execute(input: { taskId: string; userId: string }): Promise<void> {
    await this.authz.ensureTaskOwner(input.taskId, input.userId);
    await this.taskRepo.delete(input.taskId);
  }
}
