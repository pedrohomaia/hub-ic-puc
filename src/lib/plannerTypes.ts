export type TermId = string;
export type DisciplineId = string;
export type StudyPlanId = string;
export type StudyTaskId = string;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TaskObjective = "READ" | "PRACTICE" | "SUMMARY" | "REVIEW";
export type TaskStatus = "TODO" | "DONE" | "PARTIAL" | "SKIPPED";
export type StudyMode = "PASSIVE" | "ACTIVE" | "READING";

export type Slot = {
  weekday: Weekday;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
};

export type GeneratePlanInput = {
  termId: TermId;
};

export type GeneratePlanOutput = {
  planId: StudyPlanId;
};
