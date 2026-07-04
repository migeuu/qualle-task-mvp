# Qualle Task MVP

Monorepo do sistema de gestão de tarefas ágeis — **Qualle Task**.

## Estrutura

```
qualle-task-mvp/
├── backend/    # API GraphQL + REST (NestJS, PostgreSQL, WebSockets)
└── frontend/   # SPA (React + Vite + TypeScript)
```

## Como rodar

### Backend (API)

Veja a documentação completa em [`backend/README.md`](backend/README.md).

**Resumo rápido:**

```bash
cd backend
npm install
docker compose up -d          # PostgreSQL
npm run start:dev              # http://localhost:3000/graphql
```

### Frontend (SPA)

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

### Seed de dados

Com o backend rodando, execute a mutation `fillSeed` (pública) no GraphQL Playground ou via cURL:

```bash
curl -X POST http://localhost:3000/seed
```

Isso popula o banco com 4 usuários (senha: `123456`) e 10 tarefas de demonstração.

## Documentação adicional

- **GraphQL Playground**: http://localhost:3000/graphql
- **Swagger (REST)**: http://localhost:3000/api/docs
- **Backend README**: [`backend/README.md`](backend/README.md) — arquitetura, testes, subscriptions e exemplos completos
