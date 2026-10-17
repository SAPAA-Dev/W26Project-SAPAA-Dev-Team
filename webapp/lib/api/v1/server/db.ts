import { createServerSupabase } from '@/utils/supabase/server';

// Service-role client. Only call it after requireCaller() has passed.
export const db = createServerSupabase;

const PAGE_SIZE = 1000; // PostgREST max_rows

type Page = PromiseLike<{ data: unknown; error: { message: string } | null }>;

/** Reads every row past the PostgREST row limit. `page` must build a fresh query each call. */
export async function fetchAll<T>(page: (from: number, to: number) => Page): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const chunk = (data ?? []) as T[];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) return rows;
  }
}

const SCORES: Record<string, number> = { excellent: 4, good: 3, fair: 2, poor: 1 };

/** Maps a naturalness answer ("Excellent", "Good", ...) to its 1-4 score. */
export function naturalnessOf(value: string | null | undefined): { score: number; label: string } | null {
  const label = value?.trim();
  const match = label?.toLowerCase().match(/excellent|good|fair|poor/);
  return label && match ? { score: SCORES[match[0]], label } : null;
}

// Question ids are form schema and change only when an admin edits the form; every read used to
// wait on this lookup before its real query. A failed lookup is not kept.
// ponytail: per-instance 60 s memo; an admin's form edit can take up to a minute to reach the summaries.
const QUESTION_TTL = 60_000;
const questionMemo = new Map<string, { at: number; ids: Promise<number[]> }>();

/** Ids of the questions whose key starts with `prefix` (Q31 naturalness, Q13 steward name). */
export function questionIds(prefix: 'Q31' | 'Q13'): Promise<number[]> {
  const hit = questionMemo.get(prefix);
  if (hit && Date.now() - hit.at < QUESTION_TTL) return hit.ids;
  const ids = Promise.resolve(db().from('questions').select('id').like('"question key"', `${prefix}%`)).then(
    ({ data, error }) => {
      if (error) throw new Error(error.message);
      return (data ?? []).map((row: { id: number }) => row.id);
    }
  );
  questionMemo.set(prefix, { at: Date.now(), ids });
  ids.catch(() => questionMemo.delete(prefix));
  return ids;
}

export const naturalnessQuestionIds = () => questionIds('Q31');

/** A report's date: inspection_date, else the day it was created. */
export function reportDate(row: { inspection_date: string | null; created_at: string | null }): string | null {
  return row.inspection_date ?? row.created_at?.slice(0, 10) ?? null;
}

export function daysSince(date: string | null): number | null {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
}
