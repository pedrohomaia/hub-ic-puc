# Study Planner — Arquitetura (ASCII)

┌──────────────────────────────┐
│           USUÁRIO            │
└───────────────┬──────────────┘
                v
┌──────────────────────────────┐
│      NEXT.JS UI (App Router) │
│   /study-planner/*           │
└───────────────┬──────────────┘
                v
┌──────────────────────────────┐
│     AUTH + RBAC (GUARDS)     │
└───────────────┬──────────────┘
                v
┌──────────────────────────────┐
│   API ROUTES (RouteHandlers) │
│   /api/study-planner/*       │
└───────────────┬──────────────┘
                v
┌──────────────────────────────┐
│     Services / Use-cases      │
│ PlannerService, LogService... │
└───────────────┬──────────────┘
                v
┌──────────────────────────────┐
│  Planner Engine (determin.)   │
│  - tasks em minutos em slots  │
│  - revisões 24/3/7/14 + 14/7  │
│  - prioridade: evento próximo │
│  - replaneja se atraso        │
└───────────────┬──────────────┘
                v
┌──────────────────────────────┐
│       Prisma Repos / DB       │
│         PostgreSQL            │
└──────────────────────────────┘
