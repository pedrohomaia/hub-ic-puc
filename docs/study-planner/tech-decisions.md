# Study Planner — Decisões Técnicas

## Arquitetura
- Módulo dentro do mesmo app SciHub (monólito modular).
- UI: src/app/study-planner/*
- API: src/app/api/study-planner/*
- Core: src/lib/planner*.ts (flat, seguindo padrão atual do repo)

## MVP1 (sem RAG)
- CRUD manual: semestre, disciplinas, slots, avaliações.
- Motor determinístico para gerar tarefas e revisões.
- Pomodoro no client + logs no server.
- Notificações somente in-app.
- Replanejamento determinístico.

## MVP2 (com RAG)
- Ingestão de PDF/TXT/XLSX por disciplina/semestre.
- Postgres + pgvector para embeddings.
- Chunking por seções + metadados (termId/disciplineId/docType).
- Extração estruturada (JSON) para outline (Terços 1/2/3 + A/B/C).
- Calendar extractor para marcos do semestre.

## Cron / Scheduler
- Endpoints internos (ex.: /api/cron/*) chamados por scheduler externo (GitHub Actions cron / uptime monitor).
- MVP1: gerar notificações diárias (manhã + pré-sessão).

## Persistência
- Postgres (já usado) + Prisma.
- MVP1: tabelas de planner sem vector store.
- MVP2: pgvector habilitado.

## Segurança
- Todas as rotas protegidas por requireAuth (MEMBER por padrão).
- Possível ADMIN no futuro (visão agregada/templates).
