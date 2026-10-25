import type { Caller } from './auth';

/**
 * Answer visibility (US 1.0.3, answers.is_hidden). The same rule as getFormResponsesBySite in
 * utils/supabase/queries.ts and the sprint-3 gallery routes: a hidden answer is read only by an admin
 * or by the steward who filed the report. With no caller, nobody counts as the owner (the safe default).
 */
export function canReadHidden(caller: Caller | undefined, ownerId: string | null | undefined): boolean {
  return !!caller && (caller.isAdmin || (!!ownerId && ownerId === caller.userId));
}

/** The answers of one report that this caller may read. */
export function visibleAnswers<T extends { is_hidden?: boolean | null }>(
  answers: T[],
  caller: Caller | undefined,
  ownerId: string | null | undefined
): T[] {
  return canReadHidden(caller, ownerId) ? answers : answers.filter((answer) => answer.is_hidden !== true);
}
