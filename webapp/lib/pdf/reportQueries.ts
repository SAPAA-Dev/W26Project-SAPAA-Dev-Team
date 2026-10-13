import 'server-only';

import { createServerSupabase } from '@/utils/supabase/server';
import type { FormAnswer, FormResponse } from '@/utils/supabase/queries';

// Service-role reads for the PDF export job and the guarded report reads in queries.ts.
// They do not check the caller, so they must never be server actions: 'server-only'
// stops a client file from importing this module. Callers check the caller first.

export interface RawAnswerRow {
  question_id: number;
  obs_value: string | null;
  obs_comm: string | null;
  questions: {
    id: number;
    form_question: string | null;
    section_id: number | null;
    form_sections: { id: number; title: string | null } | null;
  } | null;
}

export interface FormResponseRow {
  id: number;
  user_id: string | null;
  created_at: string | null;
  inspection_date: string | null;
  inspection_no: string | null;
  answers: RawAnswerRow[];
}

let keyMapPromise: Promise<Record<string, number>> | null = null;

export async function getReportQuestionKeyMap() {
  if (!keyMapPromise) {
    keyMapPromise = (async () => {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from('questions')
        .select('id, "question key"')
        .in('"question key"', ['Q31_Naturalness', 'Q32_Natural_Comm', 'Q13_FirstandLastNameForGuests']);
      if (error) throw new Error(error.message);
      return Object.fromEntries((data ?? []).map((q: { 'question key': string; id: number }) => [q['question key'], q.id]));
    })().catch((error) => {
      // Do not cache a failure, or one database error breaks every later export.
      keyMapPromise = null;
      throw error;
    });
  }
  return keyMapPromise;
}

// Answer reduction for better user viewing on frontend
export function reduceAnswers(
  rawAnswers: RawAnswerRow[],
  keyMap: { naturalnessId: number; naturalnessDetailsId: number; stewardId: number }
): { answers: FormAnswer[]; naturalness: string | null; naturalnessDetails: string | null; steward: string | null } {
  const answers: FormAnswer[] = Object.values(
    (rawAnswers ?? []).reduce((acc: Record<number, Omit<FormAnswer, 'obs_value'> & { obs_value: string[] }>, a) => {
      const qid = a.question_id;
      if (!acc[qid]) {
        acc[qid] = {
          question_id: qid,
          question_text: a.questions?.form_question ?? `Question ${qid}`,
          obs_value: [],
          obs_comm: null,
          section_id: a.questions?.section_id ?? null,
          section_title: a.questions?.form_sections?.title ?? null,
        };
      }
      if (a.obs_value === 'Other' && a.obs_comm) {
        acc[qid].obs_comm = a.obs_comm;
      } else if (a.obs_value) {
        acc[qid].obs_value.push(a.obs_value);
      } else if (a.obs_comm) {
        acc[qid].obs_comm = a.obs_comm;
      }
      return acc;
    }, {})
  )
    .map((a) => ({ ...a, obs_value: a.obs_value.length > 0 ? a.obs_value.join('; ') : null }))
    .sort((a, b) => (a.section_id ?? 0) - (b.section_id ?? 0) || a.question_id - b.question_id);

  const naturalness = answers.find(a => a.question_id === keyMap.naturalnessId)?.obs_value ?? null;
  const naturalnessDetails =
    answers.find(a => a.question_id === keyMap.naturalnessDetailsId)?.obs_value ??
    answers.find(a => a.question_id === keyMap.naturalnessDetailsId)?.obs_comm ??
    null;
  const steward = answers.find(a => a.question_id === keyMap.stewardId)?.obs_comm ?? null;

  return {
    answers: answers.filter(a => a.question_id !== keyMap.naturalnessId && a.question_id !== keyMap.stewardId),
    naturalness,
    naturalnessDetails,
    steward,
  };
}

// Fetches all attachments rows for a given response_id
export async function getAttachmentsByResponseId(responseId: number): Promise<Array<{
  id: number;
  question_id: number | null;
  storage_key: string | null;
  filename: string | null;
  content_type: string | null;
  file_size_bytes: number | null;
  caption: string | null;
  identifier: string | null;
  site_id: number | null;
}>> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('attachments')
    .select('id, question_id, storage_key, filename, content_type, file_size_bytes, caption, identifier, site_id')
    .eq('response_id', responseId);

  if (error) throw new Error(error.message || 'Failed to fetch attachments');
  return data ?? [];
}

export async function getSitesByNames(siteNames: string[]): Promise<Array<{
  id: number;
  namesite: string;
  ab_county: number | null;
  ab_counties: { county: string } | null;
}>> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('sites_pa')
    .select('id, namesite, ab_county, ab_counties(county)')
    .in('namesite', siteNames)
    .order('namesite', { ascending: true });
  if (error) throw new Error(error.message || 'Failed to fetch sites');
  return (data ?? []) as unknown as Awaited<ReturnType<typeof getSitesByNames>>;
}

export async function getFormResponsesForSiteIds(
  siteIds: number[],
  keyMap: Record<string, number>
): Promise<Map<number, FormResponse[]>> {
  const supabase = createServerSupabase();
  const PAGE_SIZE = 1000;
  const allRows: (FormResponseRow & { site_id: number })[] = [];
  let page = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('form_responses')
      .select(`
        id, site_id, user_id, created_at, inspection_date, inspection_no,
        answers (
          question_id, obs_value, obs_comm,
          questions ( id, form_question, section_id,
            form_sections!questions_section_id_fkey ( id, title ) )
        )
      `)
      .in('site_id', siteIds)
      .eq('is_active', true)
      .is('archived_at', null)
      .order('id', { ascending: false })
      .order('inspection_date', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message || 'Failed to fetch form responses');

    allRows.push(...((data ?? []) as unknown as (FormResponseRow & { site_id: number })[]));
    if (!data || data.length < PAGE_SIZE) break; // last page reached
    page++;
  }

  const ids = {
    naturalnessId: Number(keyMap['Q31_Naturalness']),
    naturalnessDetailsId: Number(keyMap['Q32_Natural_Comm']),
    stewardId: Number(keyMap['Q13_FirstandLastNameForGuests']),
  };

  const bySite = new Map<number, FormResponse[]>();
  for (const r of allRows) {
    const { answers, naturalness, naturalnessDetails, steward } = reduceAnswers(r.answers, ids);
    const formResponse: FormResponse = {
      id: r.id,
      user_id: r.user_id ?? null,
      created_at: r.created_at,
      inspection_date: r.inspection_date ?? null,
      inspection_no: r.inspection_no,
      naturalness_score: naturalness,
      naturalness_details: naturalnessDetails,
      steward,
      answers,
    };
    const list = bySite.get(r.site_id) ?? [];
    list.push(formResponse);
    bySite.set(r.site_id, list);
  }
  return bySite;
}

export async function getAttachmentsForResponseIds(responseIds: number[]): Promise<Array<{
  id: number;
  response_id: number;
  question_id: number | null;
  storage_key: string | null;
  filename: string | null;
  content_type: string | null;
  file_size_bytes: number | null;
  caption: string | null;
  identifier: string | null;
}>> {
  if (responseIds.length === 0) return [];
  const supabase = createServerSupabase();
  const CHUNK = 300;
  const PAGE_SIZE = 1000; // PostgREST max_rows: page so a chunk with many photos is not cut off
  const out: Awaited<ReturnType<typeof getAttachmentsForResponseIds>> = [];
  for (let i = 0; i < responseIds.length; i += CHUNK) {
    const chunk = responseIds.slice(i, i + CHUNK);
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('attachments')
        .select('id, response_id, question_id, storage_key, filename, content_type, file_size_bytes, caption, identifier')
        .in('response_id', chunk)
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(error.message || 'Failed to fetch attachments');
      out.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }
  }
  return out;
}
