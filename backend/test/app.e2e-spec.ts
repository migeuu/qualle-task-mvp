import * as _supertest from 'supertest';
const request = (_supertest as any).default || _supertest;
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
          entities: [UserTypeormEntity, TaskTypeormEntity, CommentTypeormEntity],
          synchronize: true,
          dropSchema: true,
        }),
        CoreModule,
      ],
    })
      .overrideProvider(TaskResolver).useValue({})
      .overrideProvider(AuthResolver).useValue({})
      .overrideProvider(CommentResolver).useValue({})
      .compile();

    app = m.createNestApplication();
    app.useLogger(false);
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  describe('Input validation', () => {
    it('rejects invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Alice', email: 'not-an-email', password: 'secret123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects short password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Alice', email: 'alice@test.com', password: 'ab' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects short name', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'A', email: 'alice@test.com', password: 'secret123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects missing fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register').send({});
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
    it('rejects without taskId', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'Nice work!' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects without content', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ taskId: '00000000-0000-0000-0000-000000000000' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects invalid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ taskId: 'not-a-uuid', content: 'Test' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects max length exceeded', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ taskId: '00000000-0000-0000-0000-000000000000', content: 'x'.repeat(1001) });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Error response format', () => {
    it('has statusCode, message, timestamp in JSON', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'A', email: 'a@t.com', password: '123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
