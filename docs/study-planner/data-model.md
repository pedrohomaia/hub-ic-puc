# Study Planner — Modelo de Dados (alto nível, MVP1)

## Term
- id
- userId
- label (ex.: 2026/1)
- createdAt

## Discipline
- id
- termId
- name
- hoursPerWeek (0 => PAUSED)
- createdAt

## AvailabilitySlot
- id
- termId
- weekday (0-6)
- startTime (HH:mm)
- endTime (HH:mm)

## Assessment
- id
- disciplineId
- kind (EXAM | ASSIGNMENT)
- dateTime
- weight? (optional)
- effortHours? (optional)
- topics? (optional text)
- grade? (optional numeric)
- notes? (optional text)

## StudyPlan
- id
- termId
- createdAt
- updatedAt
- status (ACTIVE | ARCHIVED)

## StudyTask
- id
- planId
- disciplineId
- scheduledAt (dateTime)
- durationMin
- objective (READ | PRACTICE | SUMMARY | REVIEW)
- status (TODO | DONE | PARTIAL | SKIPPED)
- isReview (boolean)
- sourceRef? (future: topic/subtopic)

## StudyLog
- id
- taskId
- minutesFocused
- mode (PASSIVE | ACTIVE | READING)
- createdAt

## Notification
- id
- userId
- termId?
- title
- body
- scheduledAt
- readAt?

## BadgeProgress
- id
- userId
- plannerAccessStreak
- plannerGoalStreak
- updatedAt
