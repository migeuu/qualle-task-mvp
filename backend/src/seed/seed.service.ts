import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeormEntity } from '../modules/core/infra/orm/entities/user.typeorm-entity';
import { TaskTypeormEntity } from '../modules/core/infra/orm/entities/task.typeorm-entity';
import { TaskStatus, TaskPriority } from '../modules/core/domain/enums/task.enum';
import { SeedResult } from './dto/seed-result.type';

export class SeedAlreadyAppliedException extends HttpException {
  constructor() {
    super('Seed has already been applied to this database', HttpStatus.CONFLICT);
  }
}

interface SeedUser {
  name: string;
  email: string;
  password: string;
}

interface SeedTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  creatorIndex: number;
  assigneeIndices: number[];
  dueDate?: Date;
}

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(UserTypeormEntity)
    private readonly userRepo: Repository<UserTypeormEntity>,
    @InjectRepository(TaskTypeormEntity)
    private readonly taskRepo: Repository<TaskTypeormEntity>,
  ) {}

  async execute(): Promise<SeedResult> {
    const userCount = await this.userRepo.count();

    if (userCount > 0) {
      throw new SeedAlreadyAppliedException();
    }

    const users = await this.createUsers();
    const tasks = await this.createTasks(users);

    return {
      message: 'Seed applied successfully',
      usersCreated: users.length,
      tasksCreated: tasks.length,
    };
  }

  private async createUsers(): Promise<UserTypeormEntity[]> {
    const seedUsers: SeedUser[] = [
      { name: 'Alice Oliveira', email: 'alice@qualle.com', password: '123456' },
      { name: 'Bruno Santos', email: 'bruno@qualle.com', password: '123456' },
      { name: 'Carla Mendes', email: 'carla@qualle.com', password: '123456' },
      { name: 'Diego Ferreira', email: 'diego@qualle.com', password: '123456' },
    ];

    const users: UserTypeormEntity[] = [];

    for (const su of seedUsers) {
      const hash = await bcrypt.hash(su.password, 10);
      const user = this.userRepo.create({
        name: su.name,
        email: su.email,
        password: hash,
      });
      users.push(await this.userRepo.save(user));
    }

    return users;
  }

  private async createTasks(users: UserTypeormEntity[]): Promise<TaskTypeormEntity[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const seedTasks: SeedTask[] = [
      {
        title: 'Hire Miguel Marquiori',
        description: "He's the perfect fit for this role. Seriously, look at that resume — it's basically a love letter to clean code.",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        creatorIndex: 0,
        assigneeIndices: [0],
        dueDate: yesterday,
      },
      {
        title: 'Convince the coffee machine to make espresso faster',
        description: 'The machine takes 47 seconds. We benchmarked it. This is unacceptable for a team that runs on caffeine and bad decisions.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        creatorIndex: 1,
        assigneeIndices: [1, 2],
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Figure out why the bug only happens on Fridays at 4:59 PM',
        description: 'Production has been crashing every Friday right before the weekend. Coincidence? We think not. Suspect: the universe hates us.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        creatorIndex: 2,
        assigneeIndices: [0, 2, 3],
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Rename all variables to emojis for maximum readability',
        description: 'Who needs descriptive names when you have 🔥, 💀, and 🚀? The future is now. Also Diego suggested this and we are concerned.',
        status: TaskStatus.CANCELLED,
        priority: TaskPriority.LOW,
        creatorIndex: 3,
        assigneeIndices: [3],
        dueDate: yesterday,
      },
      {
        title: 'Write documentation that nobody will ever read',
        description: 'We need at least 3 pages of docs so we can say "it\'s in the docs" when someone asks a question. Actually make it 5 pages. Go big.',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        creatorIndex: 0,
        assigneeIndices: [1, 3],
        dueDate: nextWeek,
      },
      {
        title: 'Add a dark mode that is just the screen turned off',
        description: 'Maximum contrast. Infinite battery life. Users will love it. It\'s also the most accessible dark mode ever conceived.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        creatorIndex: 1,
        assigneeIndices: [2],
      },
      {
        title: 'Implement a button that does nothing but sparks joy',
        description: 'Marie Kondo meets UX design. The button won\'t trigger any action — it just sits there, looking beautiful, bringing happiness to the dashboard.',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        creatorIndex: 2,
        assigneeIndices: [0, 1, 2, 3],
        dueDate: yesterday,
      },
      {
        title: 'Blame the intern for the production outage',
        description: 'We don\'t actually have an intern. We\'ll need to hire one first, then blame them. This is a multi-sprint initiative.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        creatorIndex: 0,
        assigneeIndices: [0, 1],
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Optimize the loading spinner to spin 23% faster',
        description: "Users have been complaining that the spinner feels 'sluggish'. We've assembled a task force. This is our top priority now.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        creatorIndex: 3,
        assigneeIndices: [0, 3],
      },
      {
        title: 'Delete 47 lines of dead code that everyone is afraid to touch',
        description: 'Carlos wrote it in 2024. He left the company. The code has no tests. It references a database table that no longer exists. We are all scared.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        creatorIndex: 1,
        assigneeIndices: [1, 2],
        dueDate: nextWeek,
      },
    ];

    const tasks: TaskTypeormEntity[] = [];

    for (const st of seedTasks) {
      const task = this.taskRepo.create({
        title: st.title,
        description: st.description,
        status: st.status,
        priority: st.priority,
        creatorId: users[st.creatorIndex].id,
        assignees: st.assigneeIndices.map((i) => users[i]),
        dueDate: st.dueDate ?? undefined,
      });
      tasks.push(await this.taskRepo.save(task));
    }

    return tasks;
  }
}
