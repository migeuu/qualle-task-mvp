import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as _supertest from 'supertest';
const request = (_supertest as any).default || _supertest;
import { CoreModule } from '../src/modules/core/core.module';
import { UserTypeormEntity } from '../src/modules/core/infra/orm/entities/user.typeorm-entity';
import { TaskTypeormEntity } from '../src/modules/core/infra/orm/entities/task.typeorm-entity';
import { CommentTypeormEntity } from '../src/modules/core/infra/orm/entities/comment.typeorm-entity';
import { TaskResolver } from '../src/modules/core/presentation/resolvers/task.resolver';
import { AuthResolver } from '../src/modules/core/presentation/resolvers/auth.resolver';
import { CommentResolver } from '../src/modules/core/presentation/resolvers/comment.resolver';
import { GlobalExceptionFilter } from '../src/shared/filters/global-exception.filter';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRATION = '1h';

describe('REST API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const m = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            UserTypeormEntity,
            TaskTypeormEntity,
            CommentTypeormEntity,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        CoreModule,
      ],
    })
      .overrideProvider(TaskResolver)
      .useValue({})
      .overrideProvider(AuthResolver)
      .useValue({})
      .overrideProvider(CommentResolver)
      .useValue({})
      .compile();

    app = m.createNestApplication();
    app.useLogger(false);
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('starts the NestJS application', () => {
    expect(app).toBeDefined();
  });

  describe('Input validation (pipe-level)', () => {
    it('rejects invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Alice', email: 'not-an-email', password: 'secret123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects password too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Alice', email: 'alice@test.com', password: 'ab' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects name too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'A', email: 'alice@test.com', password: 'secret123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects missing email on login', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'secret123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Comment validation', () => {
    it('rejects comment without taskId', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Nice work!' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects comment without content', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ taskId: '00000000-0000-0000-0000-000000000000' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects comment with invalid taskId format', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ taskId: 'not-a-uuid', content: 'Test comment' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects comment with content exceeding max length', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({
          taskId: '00000000-0000-0000-0000-000000000000',
          content: 'x'.repeat(1001),
        });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
