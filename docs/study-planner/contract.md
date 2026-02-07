# Study Planner — Contrato Funcional (MVP1)

## Escopo
- Módulo interno do SciHub: /study-planner
- Planejamento por semestre (Term) e por disciplina.
- MVP1: Planner manual (sem RAG).

## Regras de horas
- O aluno define horas semanais por disciplina.
- Soma total semanal (meta):
  - mínimo: 5h
  - ideal: 25h
  - máximo: 50h

## Horários (slots)
- O aluno define disponibilidade por dia da semana (ex.: seg 19–22).
- O motor encaixa tarefas em minutos dentro desses slots.

## Disciplina pausada
- Se horas/semana da disciplina = 0, status = PAUSED.
- Disciplinas PAUSED não geram tarefas nem entram no cronograma.

## Avaliações e trabalhos
- O aluno cadastra manualmente:
  - data
  - peso (opcional)
  - tópicos (opcional)
  - esforço estimado (para trabalhos)
  - nota (campo para registro)

## Prioridade
- Sempre priorizar o evento mais próximo (prova/trabalho).

## Revisões (curva do esquecimento)
- Revisões automáticas após estudo:
  - 24h, 3 dias, 7 dias, 14 dias
- Revisões obrigatórias antes de prova:
  - 14 dias e 7 dias

## Replanejamento
- Se houver atraso ou mudança de datas/slots/horas:
  - replaneja mantendo revisões obrigatórias
  - mantém prioridade por evento mais próximo
- Rebalanceamento (opt-in):
  - sistema recomenda, usuário confirma com 1 clique

## Notificações (in-app)
- Apenas in-app (sem e-mail/push no MVP1).
- 2 notificações por dia:
  - manhã: resumo do dia
  - 30 min antes do primeiro slot do dia

## Pomodoro e logs
- Pomodoro embutido nas tarefas (presets 25/5 e 50/10).
- Registro de estudo:
  - minutos focados
  - modo: passivo (vídeo), ativo (exercícios), leitura

## Gamificação (integrada ao SciHub)
- Prata (engajamento por acesso):
  - Prata 1: 1 semana com ≥3 acessos
  - Prata 2: 3 semanas seguidas
  - Prata 3: 6 semanas seguidas
- Ouro (resultado por meta semanal):
  - Ouro 1: bater meta em 1 semana
  - Ouro 2: 3 semanas seguidas
  - Ouro 3: 6 semanas seguidas
- Ranking: integrado ao leaderboard do SciHub, com “liga” do Planner.
