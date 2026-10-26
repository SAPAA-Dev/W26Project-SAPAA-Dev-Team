'use server';

import { createClient, createServerSupabase } from './supabase/server';
import {
  arePriorityPointsStale,
  computeVisitPriority,
  parsePriorityScores,
  PriorityScores,
} from '@/lib/sitePriority';

export interface SitePriority {
  scores: PriorityScores | null;
  priority: number | null;
  savedAt: string | null;
  // Only an Admin gets this. A Steward always gets false (2.0.13 AT4).
  needsReassessment: boolean;
}

type SaveResult = { success: true; priority: SitePriority } | { success: false; error: string };

interface PriorityRow {
  priority_abuses: number | null;
  priority_biological: number | null;
  priority_time: number | null;
  priority_saved_at: string | null;
}

const PRIORITY_COLUMNS = 'priority_abuses, priority_biological, priority_time, priority_saved_at';

// The role comes from the signed-in session, never from a value the caller sends.
async function getCaller(): Promise<{ id: string; isAdmin: boolean } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error !== null || !user || user.app_metadata?.authenticated !== true) return null;
  return { id: user.id, isAdmin: user.app_metadata?.role === 'admin' };
}

function toSitePriority(row: PriorityRow | null, isAdmin: boolean): SitePriority {
  const scored = row !== null
    && row.priority_abuses !== null
    && row.priority_biological !== null
    && row.priority_time !== null;
  const scores = scored
    ? { abuses: row.priority_abuses!, biological: row.priority_biological!, time: row.priority_time! }
    : null;
  const savedAt = row?.priority_saved_at ?? null;
  return {
    scores,
    priority: scores ? computeVisitPriority(scores) : null,
    savedAt,
    needsReassessment: isAdmin && scores !== null && arePriorityPointsStale(savedAt),
  };
}

// 2.0.12 AT2, AT4 and 2.0.13 AT1, AT2, AT4: any approved user reads the priority.
export async function getSitePriority(siteId: number): Promise<SitePriority | null> {
  const caller = await getCaller();
  if (!caller || !Number.isInteger(siteId) || siteId <= 0) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sites_pa')
    .select(PRIORITY_COLUMNS)
    .eq('id', siteId)
    .maybeSingle()
    .overrideTypes<PriorityRow, { merge: false }>();

  if (error) throw new Error(error.message);
  return toSitePriority(data, caller.isAdmin);
}

// 2.0.12 AT1, AT5 and 2.0.13 AT3: only an Admin saves. Saving sets the date, so the reminder goes away.
export async function saveSitePriorityScores(siteId: number, input: unknown): Promise<SaveResult> {
  const caller = await getCaller();
  if (!caller?.isAdmin) return { success: false, error: 'Only an Admin can change the scores.' };
  if (!Number.isInteger(siteId) || siteId <= 0) return { success: false, error: 'Invalid site.' };
  const scores = parsePriorityScores(input);
  if (!scores) return { success: false, error: 'Each score must be a whole number from 0 to 5.' };

  // sites_pa has no update policy for users, so the write uses the service role.
  const { data, error } = await createServerSupabase()
    .from('sites_pa')
    .update({
      priority_abuses: scores.abuses,
      priority_biological: scores.biological,
      priority_time: scores.time,
      priority_saved_at: new Date().toISOString(),
      priority_saved_by: caller.id,
    })
    .eq('id', siteId)
    .select(PRIORITY_COLUMNS)
    .maybeSingle()
    .overrideTypes<PriorityRow, { merge: false }>();

  // The database error can name tables and constraints, so it stays in the server log.
  if (error) {
    console.error('saveSitePriorityScores failed', error);
    return { success: false, error: 'The scores were not saved. Try again.' };
  }
  if (!data) return { success: false, error: 'That site does not exist.' };
  return { success: true, priority: toSitePriority(data, true) };
}
