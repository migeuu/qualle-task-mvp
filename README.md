# Qualle Task MVP

Task management API built with NestJS, GraphQL, PostgreSQL, and real-time WebSockets.

## Quickstart

```bash
# Backend
cd backend && npm install && docker compose up -d && npm run start:dev
# → http://localhost:3000/graphql

# Frontend (optional)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### Seed database

```bash
curl -X POST http://localhost:3000/seed
```

Creates 4 users (password: `123456`) and 10 demo tasks. Only works on empty DB.

## Interfaces

| Interface | URL |
|---|---|
| GraphQL Playground | http://localhost:3000/graphql |
| Swagger (REST) | http://localhost:3000/api/docs |
| Frontend SPA | http://localhost:5173 |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript |
| API | GraphQL (code-first) + REST (Swagger) |
| Database | PostgreSQL 16 (TypeORM) |
| Auth | JWT (bcryptjs) |
| Real-time | graphql-ws subscriptions + Socket.IO |
| Event Bus | @nestjs/event-emitter |
| Validation | class-validator + class-transformer |
| Testing | Vitest (unit + e2e) |

## Architecture

```
Controller/Resolver → Use Case → Repository → TypeORM → PostgreSQL
                         ↓
                     EventBus → PubSub (GraphQL subscriptions)
                             → EventEmitter2 → TaskGateway (Socket.IO)
```

- **Clean Architecture** — domain entities, repository interfaces, use cases, infrastructure adapters
- **Resource-level authorization** — centralized `AuthorizationService` enforcing ownership and participation checks on task mutations
- **Global exception handling** — custom `HttpException` subclasses (409, 401, 403, 404), `GlobalExceptionFilter` with JSON responses, `TypeOrmExceptionFilter` mapping PostgreSQL errors
- **Global JWT guard** — `APP_GUARD` in `AppModule` protects all endpoints by default; `@Public()` opt-out
- **Dual real-time** — same events published to both GraphQL subscriptions (per-user filtering) and Socket.IO rooms

## Endpoints

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Get JWT token |
| GET | `/auth/me` | Bearer | Current user profile |
| GET | `/auth/users` | Bearer | List all users |

### Tasks (`/tasks`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/tasks` | Bearer | Create task |
| GET | `/tasks` | Bearer | List tasks (filters: `?status=&priority=&page=&limit=`) |
| GET | `/tasks/:id` | Bearer | Get task details |
| PUT | `/tasks/:id` | Bearer | Update task (owner only) |
| DELETE | `/tasks/:id` | Bearer | Delete task (owner only) |
| POST | `/tasks/assign` | Bearer | Assign users (owner only) |

### Comments (`/comments`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/comments` | Bearer | Add comment (participants only) |
| GET | `/comments/task/:taskId` | Bearer | List comments |

### Seed (`/seed`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/seed` | Public | Populate demo data |

## GraphQL Operations

Ready-to-paste operations in [`backend/playground-ops.graphql`](backend/playground-ops.graphql).

### Quick examples

```graphql
# Register & login
mutation { register(input: { email: "a@q.com", password: "123456", name: "A" }) }

mutation { login(input: { email: "alice@qualle.com", password: "123456" }) { accessToken user { id email name } } }

# Tasks (add Authorization: Bearer <token> header)
query { tasks(pagination: { page: 1, limit: 10 }) { data { id title status } total page limit } }

query { task(taskId: "uuid") { id title creator { name } assignees { name } } }

mutation { createTask(input: { title: "New task", priority: HIGH }) { id title status } }

mutation { updateTask(input: { taskId: "uuid", title: "Updated", status: IN_PROGRESS }) { id title } }

mutation { deleteTask(input: { taskId: "uuid" }) }

mutation { assignTask(input: { taskId: "uuid", assigneeIds: ["user-uuid"] }) { id assignees { name } } }

mutation { addComment(input: { taskId: "uuid", content: "Looks good!" }) { id content author { name } } }

# Real-time
subscription { taskUpdated { taskId eventAuthorId eventType } }
subscription { taskAssigned { taskId eventAuthorId eventType } }
subscription { newComment { taskId eventAuthorId eventType } }
```

## Testing

```bash
cd backend

# Unit tests (72 tests, 9 suites)
npm run test

# E2E tests (10 tests, SQLite in-memory)
npm run test:e2e

# Coverage
npm run test:cov
```

### What tests cover

| Layer | Tests | Coverage |
|---|---|---|
| Use Cases (auth, tasks, users, comments) | 46 | Full business logic including authorization checks |
| Guards & Filters (JWT, exceptions) | 12 | Auth flow, error formatting |
| Decorators (CurrentUser, Public) | 8 | Context extraction, metadata |
| WebSocket Gateway (Socket.IO) | 11 | Connection auth, event emission, ping |
| **Unit total** | **72** | |
| E2E REST | 10 | Input validation, error status codes |

## Migrations

```bash
# Show pending migrations
npm run migration:show

# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

> Development uses `synchronize: true` (auto-creates tables). In production, set `DB_SYNCHRONIZE=false` and run migrations explicitly.

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts              # Root module (APP_GUARD, GraphQL config)
│   ├── main.ts                    # Bootstrap (ValidationPipe, filters)
│   ├── shared/                    # Cross-cutting: guards, filters, decorators, exceptions
│   ├── modules/core/
│   │   ├── domain/                # Entities, enums, repository interfaces, value objects
│   │   ├── application/           # Use cases, DTOs, mappers, authorization service
│   │   ├── infra/                 # TypeORM entities, repositories, external services
│   │   └── presentation/          # Controllers (REST), resolvers (GraphQL), inputs/outputs
│   ├── database/                   # DataSource config + migrations
│   │   └── migrations/              # TypeORM migration files
│   ├── gateway/                   # Socket.IO gateway with JWT auth
│   └── seed/                      # Demo data seeder
├── test/                          # E2E tests (SQLite in-memory)
└── playground-ops.graphql         # Ready-to-use GraphQL operations
```

## Requirements

- Node.js >= 20
- Docker & Docker Compose
