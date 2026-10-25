export const PRIORITY_SCORE_MIN = 0;
export const PRIORITY_SCORE_MAX = 5;

export interface PriorityScores {
  abuses: number;
  biological: number;
  time: number;
}

export const PRIORITY_SCORE_LABELS: Record<keyof PriorityScores, string> = {
  abuses: "Abuses",
  biological: "Biological imperatives",
  time: "Time since the last visit",
};

function isValidScore(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= PRIORITY_SCORE_MIN && (value as number) <= PRIORITY_SCORE_MAX;
}

// The scores arrive from a client, so each one is checked on the server before it is saved.
export function parsePriorityScores(input: unknown): PriorityScores | null {
  if (typeof input !== "object" || input === null) return null;
  const { abuses, biological, time } = input as Record<string, unknown>;
  if (!isValidScore(abuses) || !isValidScore(biological) || !isValidScore(time)) return null;
  return { abuses, biological, time };
}

// Open question for Frank: the formula is not confirmed. A plain sum, so equal scores give an equal priority.
export function computeVisitPriority(scores: PriorityScores): number {
  return scores.abuses + scores.biological + scores.time;
}

export const PRIORITY_MAX = PRIORITY_SCORE_MAX * 3;

// 2.0.13: the points are old when they were saved more than one calendar year before now.
export function arePriorityPointsStale(savedAt: string | null, now: Date = new Date()): boolean {
  if (!savedAt) return false;
  const saved = new Date(savedAt);
  if (Number.isNaN(saved.getTime())) return false;
  const oneYearAgo = new Date(now);
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  return saved < oneYearAgo;
}
