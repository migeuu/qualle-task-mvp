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

## Interfaces disponíveis

Com o backend rodando, você tem três formas de interagir com a aplicação:

| Interface | URL | Para quê |
|---|---|---|
| **Swagger (REST API Docs)** | http://localhost:3000/api/docs | Documentação OpenAPI, testar endpoints REST, consumo via HTTP |
| **GraphQL Playground** | http://localhost:3000/graphql | Testar queries, mutations e subscriptions, consumo do frontend |
| **Frontend SPA** | http://localhost:5173 | Testes visuais da interface, fluxo completo do usuário |

> Para mais detalhes sobre arquitetura, testes e exemplos, veja [`backend/README.md`](backend/README.md).
