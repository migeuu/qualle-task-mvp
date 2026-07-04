# 🚀 Qualle Task API

Sistema de Gestão de Projetos Ágeis — API GraphQL com NestJS, TypeORM, PostgreSQL, WebSockets e Event Bus desacoplado.

---

## Sumário

- [Resumo do que foi implementado](#resumo-do-que-foi-implementado)
- [Arquitetura](#arquitetura)
  - [Estrutura de Pastas](#estrutura-de-pastas)
  - [Repository Pattern](#repository-pattern)
  - [Event Bus Desacoplado](#event-bus-desacoplado)
  - [Porquê de cada coisa](#porquê-de-cada-coisa)
- [Módulos Implementados](#módulos-implementados)
- [Seed de Dados (fillSeed)](#seed-de-dados-fillseed)
- [Requisitos vs Implementação](#requisitos-vs-implementação)
- [Cobertura de Testes](#cobertura-de-testes)
- [Como Utilizar a Aplicação](#como-utilizar-a-aplicação)
  - [Pré-requisitos](#pré-requisitos)
  - [Clonar o Repositório](#clonar-o-repositório)
  - [Instalar Dependências](#instalar-dependências)
  - [Rodar Docker Compose (Banco de Dados)](#rodar-docker-compose-banco-de-dados)
  - [Rodar as Migrations](#rodar-as-migrations)
  - [Rodar a Aplicação Localmente](#rodar-a-aplicação-localmente)
  - [Rodar os Testes](#rodar-os-testes)
- [GraphQL Playground / Exemplos](#graphql-playground--exemplos)
- [Swagger / REST API Docs](#swagger--rest-api-docs)
- [Subscriptions / WebSockets](#subscriptions--websockets)
- [Erros Comuns](#erros-comuns)

---

## Resumo do que foi implementado

API completa em **GraphQL (Code First)** com **NestJS** para gestão de tarefas ágeis, contemplando:

- **Autenticação JWT**: registro e login com senha hash (bcryptjs) e proteção de rotas via guard.
- **CRUD de Tarefas**: criação, atualização, exclusão, listagem com paginação e filtros (status, prioridade, data de vencimento).
- **Atribuição de Responsáveis**: múltiplos usuários podem ser atribuídos a uma tarefa.
- **Comentários**: adição de comentários vinculados a tarefas.
- **Tempo Real (GraphQL Subscriptions + WebSockets)**: notificações em tempo real via `graphql-ws` (Subscriptions) e `socket.io` (WebSocket Gateway) para os eventos `taskUpdated`, `taskAssigned` e `newComment`.
- **Event Bus Desacoplado**: arquitetura que separa a lógica de negócio da camada de notificações, permitindo substituir ou adicionar provedores de tempo real sem alterar os use cases.
- **REST Endpoints**: controllers REST documentados via Swagger em `/api/docs` com todos os schemas de request/response — mesmo code-first da interface GraphQL.
- **Seed de Dados**: mutation `fillSeed` com princípio Open/Closed que popula o banco com usuários e tarefas de demonstração.
- **Testes Unitários**: 40 testes com Vitest nos 4 módulos principais.
- **Persistência**: PostgreSQL com TypeORM (synchronize ou migrations).

---

## Arquitetura

### Estrutura de Pastas

```
src/
├── app.module.ts                          # Módulo raiz (importa todos os módulos)
├── main.ts                                # Bootstrap da aplicação
├── schema.gql                             # Schema GraphQL gerado automaticamente
│
├── auth/                                  # Módulo de Autenticação
│   ├── auth.module.ts                     # Configuração do módulo
│   ├── auth.resolver.ts                   # Resolver GraphQL (register, login, me)
│   ├── auth.controller.ts                 # Controller REST (Swagger)
│   ├── domain/
│   │   └── user.entity.ts                 # Entidade User (TypeORM + @ObjectType)
│   ├── dto/
│   │   ├── auth-payload.type.ts           # Tipo de retorno (token + user)
│   │   ├── login.input.ts                 # Input de login
│   │   └── register.input.ts              # Input de registro
│   ├── repositories/
│   │   └── user.repository.ts             # Repository pattern para User
│   ├── use-cases/
│   │   ├── register.use-case.ts           # Registro com hash de senha
│   │   ├── login.use-case.ts             # Login com validação de credenciais
│   │   └── get-profile.use-case.ts       # Obter perfil do usuário logado
│   └── __tests__/
│       └── auth.spec.ts                   # Testes do módulo de autenticação
│
├── tasks/                                 # Módulo de Tarefas
│   ├── tasks.module.ts                    # Configuração do módulo
│   ├── tasks.resolver.ts                  # Resolver GraphQL (queries, mutations, subscriptions)
│   ├── tasks.controller.ts                # Controller REST (Swagger)
│   ├── domain/
│   │   ├── task.entity.ts                 # Entidade Task (TypeORM + @ObjectType)
│   │   └── task.enums.ts                  # Enums TaskStatus e TaskPriority
│   ├── dto/
│   │   ├── create-task.input.ts           # Input de criação
│   │   ├── update-task.input.ts           # Input de atualização
│   │   ├── assign-task.input.ts           # Input de atribuição
│   │   ├── pagination.input.ts            # Input de paginação
│   │   ├── task-filter.input.ts           # Input de filtros (status, prioridade, data)
│   │   ├── task-page.type.ts              # Tipo paginado (items + total)
│   │   └── task-subscription.types.ts     # Tipos para subscriptions
│   ├── repositories/
│   │   └── task.repository.ts             # Repository pattern para Task
│   ├── use-cases/
│   │   ├── create-task.use-case.ts        # Criação de tarefa
│   │   ├── update-task.use-case.ts        # Atualização (só o dono)
│   │   ├── delete-task.use-case.ts        # Exclusão (só o dono)
│   │   ├── get-task.use-case.ts           # Detalhes de uma tarefa
│   │   ├── list-tasks.use-case.ts         # Listagem paginada com filtros
│   │   └── assign-task.use-case.ts        # Atribuição de responsável
│   └── __tests__/
│       └── tasks.spec.ts                  # Testes do módulo de tarefas
│
├── comments/                              # Módulo de Comentários
│   ├── comments.module.ts                 # Configuração do módulo
│   ├── comments.resolver.ts               # Resolver GraphQL (addComment, newComment)
│   ├── comments.controller.ts             # Controller REST (Swagger)
│   ├── domain/
│   │   └── comment.entity.ts              # Entidade Comment (TypeORM + @ObjectType)
│   ├── dto/
│   │   ├── create-comment.input.ts        # Input de criação
│   │   └── comment-subscription.types.ts  # Tipo para subscription
│   ├── repositories/
│   │   └── comment.repository.ts          # Repository pattern para Comment
│   ├── use-cases/
│   │   ├── add-comment.use-case.ts        # Adicionar comentário
│   │   └── list-comments.use-case.ts      # Listar comentários
│   └── __tests__/
│       └── comments.spec.ts               # Testes do módulo de comentários
│
├── seed/                                  # Módulo de Seed (dados iniciais)
│   ├── seed.module.ts                     # Configuração do módulo
│   ├── seed.service.ts                    # Lógica do seed (Open/Closed)
│   ├── seed.resolver.ts                   # Resolver GraphQL (fillSeed)
│   ├── seed.controller.ts                 # Controller REST (Swagger)
│   └── dto/
│       └── seed-result.type.ts            # Tipo de retorno do seed
│
├── events/                                # Módulo de Eventos (Event Bus)
│   ├── events.module.ts                   # Configuração (PubSub + EventEmitter2)
│   ├── events.service.ts                  # Serviço central de eventos
│   ├── notification.gateway.ts            # Gateway alternativo de notificações
│   └── __tests__/
│       └── events.spec.ts                 # Testes do event bus
│
├── gateway/                               # Módulo WebSocket (Socket.IO)
│   ├── gateway.module.ts                  # Configuração do módulo
│   └── task.gateway.ts                    # Gateway WebSocket com autenticação JWT
│
├── database/
│   └── data-source.ts                     # Configuração do DataSource (migrations)
│
└── shared/                                # Código compartilhado
    ├── decorators/
    │   └── current-user.decorator.ts      # Extrai usuário do contexto GraphQL
    ├── exceptions/
    │   └── business.exceptions.ts         # Exceções de negócio customizadas
    ├── filters/
    │   └── global-exception.filter.ts     # Filtro global de exceções
    └── guards/
        └── jwt-auth.guard.ts              # Guard JWT para rotas privadas

test/
├── app.e2e-spec.ts                        # Teste e2e (esqueleto)
└── vitest-e2e.config.ts                   # Configuração do Vitest para e2e
```

### Repository Pattern

Cada entidade possui seu próprio **Repository** que encapsula toda a lógica de acesso ao banco de dados:

```
┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│  Resolver    │────>│   Use Case   │────>│  Repository   │
│  (GraphQL)   │     │  (Regra de   │     │  (Acesso DB)  │
│              │     │   Negócio)   │     │               │
└──────────────┘     └──────────────┘     └───────┬───────┘
                                                   │
                                            ┌──────▼───────┐
                                            │   TypeORM     │
                                            │  Repository   │
                                            └──────────────┘
```

**Vantagens:**
- **Separação de responsabilidades**: a lógica de negócio fica nos Use Cases, o acesso a dados fica nos Repositories.
- **Facilidade de teste**: repositories podem ser mockados nos testes unitários.
- **Isolamento do ORM**: se um dia trocar o TypeORM por Prisma ou Drizzle, só os repositories mudam.

### Event Bus Desacoplado

```
                  ┌──────────────────────────────────────────┐
                  │          EventsService                    │
                  │                                           │
  Use Case ──────>│  taskUpdated(task)                        │
                  │  taskAssigned(task, userId)               │
                  │  newComment(comment)                      │
                  │                                           │
                  │         ┌─────────────────┐               │
                  │  ──────>│ EventEmitter2    │──────────────│────> TaskGateway (Socket.IO)
                  │         │ (Event Bus       │               │      └── emite `task.update`
                  │         │  Interno NestJS) │               │      └── emite `notification`
                  │         └─────────────────┘               │
                  │                                           │
                  │         ┌─────────────────┐               │
                  │  ──────>│ PubSub           │──────────────│────> GraphQL Subscriptions
                  │         │ (graphql-        │               │      └── taskUpdated
                  │         │  subscriptions)  │               │      └── taskAssigned
                  │         └─────────────────┘               │      └── newComment
                  └──────────────────────────────────────────┘
```

**Porquê do desacoplamento:**

1. **Independência de tecnologia**: os Use Cases chamam `eventsService.taskUpdated()` sem saber se a notificação vai por WebSocket, SSE, Kafka ou outro meio.
2. **Duas saídas simultâneas**: o mesmo evento é publicado no `EventEmitter2` (para listeners internos como o TaskGateway) e no `PubSub` (para GraphQL Subscriptions).
3. **Extensibilidade futura**: para adicionar um novo canal (ex: Kafka, RabbitMQ, Redis Pub/Sub), basta criar um listener no EventEmitter2 — os Use Cases não precisam ser alterados.
4. **Testabilidade**: o bus pode ser mockado isoladamente nos testes.

### Porquê de cada coisa

| Componente | Motivo |
|---|---|
| **NestJS** | Framework modular com injeção de dependência nativa, ideal para arquiteturas escaláveis |
| **GraphQL (Code First)** | Tipagem forte, documentação automática, subscriptions nativas, evolução sem versão |
| **TypeORM** | ORM maduro com suporte a migrations, relations e PostgreSQL |
| **PostgreSQL** | Banco relacional robusto, suporte nativo a UUID e JSON |
| **JWT** | Autenticação stateless, sem sessão no servidor |
| **bcryptjs** | Hash de senha seguro com salt |
| **Socket.IO** | WebSocket bidirecional com fallback, usado para notificações em tempo real |
| **graphql-subscriptions** | PubSub simples para GraphQL subscriptions (substituível por Redis ou Kafka) |
| **@nestjs/event-emitter** | Event bus interno para comunicação entre módulos (desacopla use cases de gateways) |
| **class-validator** | Validação declarativa de inputs |
| **Vitest** | Test runner moderno, rápido e compatível com Jest |
| **UUID** | Identificadores únicos universais, evitando auto-increment sequencial |
| **@Public() decorator** | Rotas públicas explícitas, permitindo guard global sem afetar resolvers |
| **UUIDValidationPipe** | Validação reutilizável de UUIDs em qualquer rota |
| **GlobalExceptionFilter** | Logging centralizado com formato consistente para todos os erros |

---

## Módulos Implementados

### AuthModule
- **register**: cria usuário com email único, nome e senha hash
- **login**: valida credenciais e retorna JWT
- **me**: retorna perfil do usuário autenticado
- **Proteção**: JwtAuthGuard com suporte a `@Public()` para rotas abertas (register, login)

### TasksModule
- **createTask**: cria tarefa vinculada ao usuário logado
- **updateTask**: atualiza tarefa (apenas o dono)
- **deleteTask**: exclui tarefa (apenas o dono)
- **task**: detalhes de uma tarefa específica
- **tasks**: listagem paginada com filtros (status, prioridade, dueDate)
- **assignTask**: atribui um usuário como responsável (evita duplicidade)
- **Subscriptions**: `taskUpdated`, `taskAssigned`

### CommentsModule
- **addComment**: adiciona comentário a uma tarefa
- **Subscription**: `newComment`

### EventsModule
- **EventsService**: serviço central que publica em dois canais simultaneamente
- **NotificationGateway**: gateway alternativo para testes do event bus
- **Configuração**: EventEmitter2 + PubSub (graphql-subscriptions)

### GatewayModule
- **TaskGateway**: WebSocket (Socket.IO) em `/events` com autenticação via JWT
- Cada client conectado entra em uma room `user:<userId>`
- Ouvintes: `task.updated`, `task.assigned`, `new.comment` → emite `task.update`
- Notificações individuais via evento `notification`

### SeedModule
- **fillSeed**: mutation pública que preenche o banco com dados iniciais (usuários e tarefas)
- **Princípio Open/Closed**: o seed só executa se o banco estiver vazio (sem usuários). Uma vez aplicado, não pode ser reexecutado — o serviço conta os registros existentes e rejeita com HTTP 409 (`SeedAlreadyAppliedException`) se já houver dados.
- **4 usuários** criados com senha `123456` e **10 tarefas** humoradas em inglês com diferentes status (TODO, IN_PROGRESS, DONE, CANCELLED) e prioridades
- Ideal para demonstrações, onboarding de novos devs e testes manuais no frontend

---

## Seed de Dados (fillSeed)

O módulo `SeedModule` fornece uma mutation GraphQL pública (`fillSeed`) para popular o banco de dados com dados iniciais de demonstração.

### Princípio Open/Closed

O seed segue o princípio **Open/Closed**:

- **Aberto para extensão**: novos dados podem ser adicionados ao `SeedService` sem modificar a lógica de verificação.
- **Fechado para modificação após execução**: o serviço conta os usuários existentes (`userRepo.count()`) antes de executar. Se `count > 0`, lança `SeedAlreadyAppliedException` (HTTP 409) e o seed não pode ser reaplicado.

Isso garante que o seed só rode uma vez por banco de dados, evitando duplicação de dados.

### Usuários Criados

| Nome | Email | Senha |
|------|-------|-------|
| Alice Oliveira | alice@qualle.com | 123456 |
| Bruno Santos | bruno@qualle.com | 123456 |
| Carla Mendes | carla@qualle.com | 123456 |
| Diego Ferreira | diego@qualle.com | 123456 |

### Como Executar

```graphql
mutation {
  fillSeed {
    message
    usersCreated
    tasksCreated
  }
}
```

A mutation é pública (`@Public()`) — não requer token JWT. Ideal para ser disparada por um botão "Preencher Seed" no frontend.

### Fluxo no Frontend

1. Frontend chama `fillSeed` ao clicar no botão "Preencher Seed"
2. Se o banco estiver vazio → seed é aplicado, retorna `{ usersCreated: 4, tasksCreated: 10 }`
3. Se o banco já tiver dados → retorna erro 409 com mensagem "Seed has already been applied to this database"
4. Após o seed, os usuários podem fazer login com qualquer um dos emails acima e senha `123456`

---

## Requisitos vs Implementação

### Autenticação & Segurança
| Requisito | Status |
|---|---|
| Registro com JWT | ✅ |
| Login com JWT | ✅ |
| Criptografia de senha (bcryptjs) | ✅ |
| Proteção de rotas privadas (Guards) | ✅ |

### Modelagem de Dados
| Requisito | Status |
|---|---|
| User: ID (UUID), Email (único), Senha (hash), Nome, Timestamps | ✅ |
| Task: ID (UUID), Título (máx 200), Descrição, Status, Prioridade, Data Vencimento, Criador, Responsáveis | ✅ |
| Comment: ID (UUID), Conteúdo, Vínculo com Tarefa, Vínculo com Autor | ✅ |

### Interface GraphQL
| Requisito | Status |
|---|---|
| Code First | ✅ |
| Queries: me, tasks (paginação + filtros), task | ✅ |
| Mutations: register, login, createTask, updateTask, deleteTask, assignTask, addComment | ✅ |
| Subscriptions: taskUpdated, taskAssigned, newComment | ✅ |

### Camada Real-Time
| Requisito | Status |
|---|---|
| WebSocket Gateway com eventos nomeados (task.update, notification) | ✅ |
| GraphQL Subscriptions | ✅ |

### Requisitos Técnicos
| Requisito | Status |
|---|---|
| TypeORM + PostgreSQL | ✅ |
| Validação de inputs (class-validator) | ✅ |
| Paginação e filtros (status, prioridade, data) | ✅ (dueDate corrigido) |
| Repository Pattern + Services/Use Cases | ✅ |
| Tratamento global de exceções | ✅ |
| Testes com Vitest | ✅ (91 testes) |
| Abstrações clean code | ✅ (@Public, UUIDValidationPipe, GlobalExceptionFilter) |

---

## Abstrações Clean Code

### @Public() Decorator
Marca rotas como públicas, complementando o `JwtAuthGuard`. Por padrão, o guard
verifica se a rota possui o metadado `isPublic` antes de rejeitar requisições sem
token. Isso permite que a arquitetura evolua para um guard global (`APP_GUARD`)
sem alterar os resolvers individuais.

### UUIDValidationPipe
Pipe reutilizável para validar parâmetros UUID em qualquer rota GraphQL ou REST.
Lança `BadRequestException` se o valor não for um UUID válido.

### GlobalExceptionFilter Melhorado
Filtro global que intercepta todas as exceções e faz:
- **HttpException**: logging formatado com status e mensagem, re-throw para GraphQL
- **Error**: logging de stack trace, re-throw
- **Unknown**: logging do valor como string, re-throw

### extractUserFromContext
O `CurrentUser` decorator agora exporta a função `extractUserFromContext`
separadamente, permitindo testar a lógica de extração do usuário sem depender
do `createParamDecorator` do NestJS.

---

## Tipos de Real-Time Implementados

### 1. GraphQL Subscriptions (graphql-ws / PubSub)
Comunicação server→client via **WebSocket** no protocolo `graphql-ws` através do
endpoint `/graphql`. Os use cases publicam no `PubSub` e os clients recebem via
subscriptions GraphQL: `taskUpdated`, `taskAssigned`, `newComment`.
As subscriptions são filtradas por usuário — cada client só recebe eventos de
tarefas onde é criador ou responsável.

### 2. WebSocket Gateway (Socket.IO)
Gateway Socket.IO no namespace `/events` com autenticação JWT. Cada client
conectado é colocado em uma room `user:<userId>`. Quando um evento ocorre, o
`TaskGateway` escuta via `@OnEvent` (EventEmitter2) e emite para as rooms dos
usuários envolvidos:
- `task.update` — evento de atualização de tarefa
- `notification` — notificação individual (atribuição, novo comentário)

**Porquê dois canais?** O `graphql-ws` é nativo do Apollo/GraphQL e ideal para
subscriptions tipadas. O `socket.io` é um canal mais flexível para notificações
genéricas e permite integração com frontends que não usam GraphQL. Ambos são
alimentados pelo mesmo `EventsService` — trocar um deles por Kafka, Redis
Pub/Sub ou SSE não afeta os use cases.

---

## Cobertura de Testes

### Testes Unitários (91 testes, 13 suites)

```
Use Cases (core):
✓ src/auth/__tests__/auth.spec.ts                   (7 testes)
✓ src/tasks/__tests__/tasks.spec.ts                 (11 testes)
✓ src/comments/__tests__/comments.spec.ts           (5 testes)
✓ src/events/__tests__/events.spec.ts               (17 testes)

Resolvers:
✓ src/auth/__tests__/auth.resolver.spec.ts          (3 testes)
✓ src/tasks/__tests__/tasks.resolver.spec.ts        (9 testes)
✓ src/comments/__tests__/comments.resolver.spec.ts  (2 testes)

Infra:
✓ src/shared/guards/__tests__/jwt-auth.guard.spec.ts           (7 testes)
✓ src/shared/filters/__tests__/global-exception.filter.spec.ts (5 testes)
✓ src/shared/decorators/__tests__/current-user.decorator.spec.ts (4 testes)
✓ src/shared/decorators/__tests__/public.decorator.spec.ts     (4 testes)
✓ src/shared/pipes/__tests__/uuid-validation.pipe.spec.ts      (6 testes)

Gateway:
✓ src/gateway/__tests__/task.gateway.spec.ts        (11 testes)
```

### Cobertura por camada (global: 63.65%)

| Camada | Cobertura |
|---|---|
| **Use Cases (auth, tasks, comments)** | 100% statements / 100% functions |
| **Resolvers (auth, tasks, comments)** | ~65-78% (subscriptions usam async generators) |
| **TaskGateway (Socket.IO)** | 100% statements / 75% branches |
| **JwtAuthGuard** | 100% statements / 92% branches |
| **GlobalExceptionFilter** | 100% statements / 90% branches |
| **CurrentUser / extractUserFromContext** | 100% |
| **@Public() decorator** | 100% |
| **UUIDValidationPipe** | 100% |
| **NotificationGateway** | 100% |
| **Exceções de negócio** | 83% |
| **Event Bus (EventEmitter2 + PubSub)** | 100% |
| **Entities (TypeORM)** | ~40-75% (decorators/propriedades) |
| **Repositories** | ~5-15% (mockados nos testes unitários) |
| **Modules (config)** | 0% (arquivos de configuração) |

---

## Como Utilizar a Aplicação

### Pré-requisitos

- Node.js >= 20
- Docker e Docker Compose
- NPM

### Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/qualle-task-api.git
cd qualle-task-api
```

### Instalar Dependências

```bash
npm install
```

### Rodar Docker Compose (Banco de Dados)

```bash
docker compose up -d
```

Isso sobe um container PostgreSQL 16 com as seguintes configurações (definidas no `.env`):

| Variável | Valor |
|---|---|
| DB_HOST | localhost |
| DB_PORT | 5432 |
| DB_USERNAME | qualle |
| DB_PASSWORD | qualle123 |
| DB_DATABASE | qualle_task_db |

Para parar o banco:
```bash
docker compose down
```

Para destruir os dados e recriar:
```bash
docker compose down -v && docker compose up -d
```

### Rodar a Aplicação Localmente

```bash
# Modo desenvolvimento (com watch)
npm run start:dev

# Modo produção
npm run build && npm run start:prod
```

A aplicação estará disponível em: **http://localhost:3000/graphql**

### Rodar os Testes

```bash
# Testes unitários
npm run test

# Testes com watch mode
npm run test:watch

# Cobertura de testes
npm run test:cov

# Testes e2e (requer banco rodando)
npm run test:e2e
```

### Rodar as Migrations

Se preferir usar migrations em vez de `synchronize: true`:

```bash
# Gerar migration
npm run migration:generate -- src/database/migrations/CreateTables

# Rodar migrations
npm run migration:run

# Reverter última migration
npm run migration:revert
```

> **Nota**: O projeto está configurado com `synchronize: true` no `app.module.ts` para desenvolvimento. Em produção, recomenda-se desabilitar e usar migrations.

---

## GraphQL Playground / Exemplos

Abra **http://localhost:3000/graphql** no navegador para acessar o Playground.

### 1. Registrar usuário

```graphql
mutation Register {
  register(input: { email: "user@test.com", password: "123456", name: "Test User" }) {
    accessToken
    user { id email name }
  }
}
```

### 2. Login

```graphql
mutation Login {
  login(input: { email: "user@test.com", password: "123456" }) {
    accessToken
    user { id email name }
  }
}
```

### 3. Criar tarefa (autenticado)

Adicione o header `Authorization: Bearer <token>` no Playground.

```graphql
mutation CreateTask {
  createTask(input: {
    title: "Minha primeira tarefa"
    description: "Descrição opcional"
    priority: HIGH
    status: TODO
  }) {
    id title status priority creator { name }
  }
}
```

### 4. Listar tarefas (com filtros e paginação)

```graphql
query ListTasks {
  tasks(
    filter: { status: TODO, priority: HIGH }
    pagination: { page: 1, limit: 10 }
  ) {
    items { id title status priority creator { name } assignees { name } }
    total
  }
}
```

### 5. Atualizar tarefa

```graphql
mutation UpdateTask {
  updateTask(input: { id: "uuid-da-tarefa", title: "Título atualizado", status: IN_PROGRESS }) {
    id title status
  }
}
```

### 6. Deletar tarefa

```graphql
mutation DeleteTask {
  deleteTask(id: "uuid-da-tarefa")
}
```

### 7. Atribuir responsável

```graphql
mutation AssignTask {
  assignTask(input: { taskId: "uuid-da-tarefa", userId: "uuid-do-usuario" }) {
    id assignees { id name email }
  }
}
```

### 8. Adicionar comentário

```graphql
mutation AddComment {
  addComment(input: { taskId: "uuid-da-tarefa", content: "Meu comentário" }) {
    id content author { name }
  }
}
```

### 9. Perfil do usuário logado

```graphql
query Me {
  me { id email name createdAt }
}
```

### 10. Popular banco com seed (fillSeed)

Mutation pública — não requer autenticação. Só funciona se o banco estiver vazio.

```graphql
mutation FillSeed {
  fillSeed {
    message
    usersCreated
    tasksCreated
  }
}
```

**Resposta esperada:**
```json
{
  "data": {
    "fillSeed": {
      "message": "Seed applied successfully",
      "usersCreated": 4,
      "tasksCreated": 10
    }
  }
}
```

Se o seed já foi aplicado, retorna erro 409:
```json
{
  "errors": [{
    "message": "Seed has already been applied to this database"
  }]
}
```

---

## Swagger / REST API Docs

Além da interface GraphQL, a API expõe **endpoints REST** documentados via **Swagger (OpenAPI)** em:

**http://localhost:3000/api/docs**

```
┌─────────────────────────────────────────────────────┐
│                  Swagger UI                          │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │   Auth   │  │  POST   /auth/register            │ │
│  │   Tasks  │  │  POST   /auth/login               │ │
│  │ Comments │  │  GET    /auth/me                  │ │
│  │   Seed   │  │  GET    /auth/users               │ │
│  └──────────┘  └──────────────────────────────────┘ │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │  Models  │  │  User, Task, Comment,            │ │
│  │ (Schemas)│  │  RegisterInput, LoginInput, ...  │ │
│  └──────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Endpoints REST

Todos os endpoints REST delegam para os mesmos **Use Cases** da camada GraphQL, garantindo comportamento idêntico.

#### Auth (`/auth`)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/register` | Público | Registrar novo usuário |
| `POST` | `/auth/login` | Público | Login com email e senha |
| `GET` | `/auth/me` | Bearer | Perfil do usuário logado |
| `GET` | `/auth/users` | Bearer | Listar todos os usuários |

#### Tasks (`/tasks`)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/tasks` | Bearer | Criar nova tarefa |
| `GET` | `/tasks` | Bearer | Listar tarefas (filtros: `?status=&priority=&page=&limit=`) |
| `GET` | `/tasks/:id` | Bearer | Detalhes de uma tarefa |
| `PUT` | `/tasks/:id` | Bearer | Atualizar tarefa (apenas dono) |
| `DELETE` | `/tasks/:id` | Bearer | Excluir tarefa (apenas dono) |
| `POST` | `/tasks/assign` | Bearer | Atribuir usuário a tarefa |

#### Comments (`/comments`)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/comments` | Bearer | Adicionar comentário |
| `GET` | `/comments/task/:taskId` | Bearer | Listar comentários de uma tarefa |

#### Seed (`/seed`)
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/seed` | Público | Popular banco (só funciona com banco vazio) |

### Exemplo REST (cURL)

```bash
# Registrar
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@qualle.com","password":"123456","name":"Dev"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@qualle.com","password":"123456"}'

# Criar tarefa
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token>" \
  -d '{"title":"Nova tarefa","priority":"HIGH"}'

# Popular seed
curl -X POST http://localhost:3000/seed
```

### Code-First

Toda a documentação Swagger é gerada a partir dos decorators `@ApiProperty`, `@ApiOperation`, `@ApiResponse` e `@ApiTags` nos controllers e DTOs — mesmo princípio code-first do GraphQL. Os schemas dos modelos (User, Task, Comment, etc.) são automaticamente extraídos das entidades com `@ApiProperty`.

---

## Subscriptions / WebSockets

### GraphQL Subscriptions (via graphql-ws)

Para testar subscriptions, use um cliente GraphQL que suporte WebSocket (ex: Apollo Studio, GraphiQL, ou código). O header `Authorization` é enviado nos `connectionParams`:

```graphql
subscription TaskUpdated {
  taskUpdated {
    taskUpdated { id title status priority }
  }
}

subscription TaskAssigned {
  taskAssigned {
    taskAssigned { id title assignees { name } }
  }
}

subscription NewComment {
  newComment {
    newComment { id content author { name } task { id } }
  }
}
```

Para testar via Apollo Sandbox ou similar, configure a conexão com:
```
URL: ws://localhost:3000/graphql
Connection Params: { "Authorization": "Bearer <seu-jwt>" }
```

### WebSocket Gateway (Socket.IO)

O gateway está disponível em `ws://localhost:3000/events` com namespace `events`.

**Conectando via JavaScript:**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/events', {
  auth: { token: 'seu-jwt-aqui' },
});

socket.on('connect', () => console.log('Conectado'));
socket.on('task.update', (data) => console.log('Task atualizada:', data));
socket.on('notification', (data) => console.log('Notificação:', data));

socket.emit('ping', { message: 'hello' });
socket.on('pong', (data) => console.log('Pong:', data));
```

**Testando via wscat (CLI):** (alternativa)

```bash
# Conectar ao WebSocket com token JWT
wscat -c "ws://localhost:3000/events?token=seu-jwt-aqui"
```

---

## Erros Comuns

### 1. Porta 5432 já em uso

```
Error: listen tcp 0.0.0.0:5432: bind: address already in use
```

**Solução**: Pare o PostgreSQL local ou mude a porta no `docker-compose.yml` e no `.env`.

### 2. Conexão com banco recusada

```
ECONNREFUSED 127.0.0.1:5432
```

**Solução**: Certifique-se de que o Docker Compose está rodando: `docker compose ps`.

### 3. Token inválido ao testar subscriptions

```
"message": "Unauthorized"
```

**Solução**: O token JWT deve ser passado nos `connectionParams` como `Authorization: Bearer <token>`. Verifique se o token não expirou.

### 4. Erro "Email already in use"

```
"message": "Email already in use"
```

**Solução**: Use outro email ou faça login se já possui cadastro.

### 5. Migration:generate não cria arquivo

**Solução**: Primeiro crie o diretório de migrations:
```bash
mkdir -p src/database/migrations
```

### 6. Testes com cobertura falham

**Solução**: Instale o pacote de cobertura:
```bash
npm install --save-dev @vitest/coverage-v8
npm run test:cov
```

### 7. Erro de peer dependency do NestJS/Apollo

```
npm warn ERESOLVE overriding peer dependency
```

**Solução**: Esse é um warning conhecido da combinação `@nestjs/apollo` com Apollo v5. Não afeta o funcionamento. Use `--legacy-peer-deps` se necessário.

### 8. WebSocket não conecta (CORS)

**Solução**: O gateway já está configurado com `cors: { origin: '*' }`. Se ainda assim tiver problemas, verifique se a URL está correta: `http://localhost:3000/events`.

### 9. Seed já foi aplicado (erro 409)

```
"message": "Seed has already been applied to this database"
```

**Solução**: O seed só pode ser executado uma vez. Para reaplicar, destrua e recrie o banco:
```bash
docker compose down -v && docker compose up -d
```
Depois reinicie a aplicação e chame `fillSeed` novamente.

---

## Licença

MIT
