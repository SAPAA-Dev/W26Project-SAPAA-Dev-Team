import { reduceAnswers, type RawAnswerRow } from '@/lib/pdf/reportQueries';
import {
  addSiteInspectionReport,
  getDateOfVisitQuestionId,
  getQuestionResponseType,
  rollbackSiteInspectionSubmission,
  uploadSiteInspectionAnswers,
} from '@/utils/supabase/queries';
import type { NewReportInput, Report } from '../types';
import { HttpError, type Caller } from './auth';
import { db, fetchAll, naturalnessOf, questionIds, reportDate } from './db';
import { findSite } from './sites';

interface ReportRow {
  id: number;
  site_id: number;
  user_id: string | null;
  is_active: boolean | null;
  inspection_no: string | null;
  inspection_date: string | null;
  created_at: string | null;
  sites_pa: { id: number; namesite: string };
  answers?: RawAnswerRow[];
}

const BASE = 'id, site_id, user_id, is_active, inspection_no, inspection_date, created_at, sites_pa!inner(id, namesite)';
const ANSWERS =
  'answers(question_id, obs_value, obs_comm, questions(id, form_question, section_id, form_sections!questions_section_id_fkey(id, title)))';
const NO_FILTER = { naturalnessId: -1, naturalnessDetailsId: -1, stewardId: -1 };

/**
 * Active, non-archived reports on visible sites, newest first. Every approved user can read
 * these, the same as getAllSiteReports and getFormResponsesBySite in queries.ts.
 * includeInactive (admins only, see wantsInactive) adds disabled reports and inactive sites,
 * like getFormResponsesBySiteAdmin; archived reports never show.
 */
export async function listReports(
  caller: Caller,
  filter: { siteId?: number; siteSlug?: string; reportId?: number; withAnswers?: boolean; includeInactive?: boolean } = {}
): Promise<Report[]> {
  // Form schema lookups (memoised in db.ts) run beside the main read instead of after it.
  const questionSets = Promise.all([questionIds('Q31'), questionIds('Q13')]).then((all) => all.map((ids) => new Set(ids)));
  questionSets.catch(() => {}); // awaited below; an empty result returns before that
  const rows = await fetchAll<ReportRow>((from, to) => {
    let q = db()
      .from('form_responses')
      .select(filter.withAnswers ? `${BASE}, ${ANSWERS}` : BASE)
      .is('archived_at', null)
      .is('sites_pa.archived_at', null);
    if (!filter.includeInactive) {
      q = q.eq('is_active', true).or('is_active.eq.true,is_active.is.null', { referencedTable: 'sites_pa' });
    }
    if (filter.siteId !== undefined) q = q.eq('site_id', filter.siteId);
    if (filter.siteSlug !== undefined) q = q.eq('sites_pa.namesite', filter.siteSlug);
    if (filter.reportId !== undefined) q = q.eq('id', filter.reportId);
    return q
      .order('inspection_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);
  });
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
  const [[natIds, stewardIds, answers], { data: people, error }] = await Promise.all([
    // Naturalness label and typed steward name per report, from the embedded answers or one bulk read.
    questionSets.then(async ([nat, steward]) => {
      const list = filter.withAnswers
        ? rows.flatMap((row) => (row.answers ?? []).map((a) => ({ ...a, response_id: row.id })))
        : await fetchAll<{ response_id: number; question_id: number; obs_value: string | null; obs_comm: string | null }>(
            (from, to) =>
              db()
                .from('answers')
                .select('response_id, question_id, obs_value, obs_comm')
                .in('question_id', [...nat, ...steward])
                .order('id')
                .range(from, to)
          );
      return [nat, steward, list] as const;
    }),
    userIds.length
      ? db().from('people').select('id, auth_user_id, display_name').in('auth_user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (error) throw new Error(error.message);

  const natByReport = new Map<number, string | null>();
  const stewardByReport = new Map<number, string | null>();
  for (const a of answers) {
    if (natIds.has(a.question_id)) natByReport.set(a.response_id, a.obs_value);
    if (stewardIds.has(a.question_id)) stewardByReport.set(a.response_id, a.obs_comm ?? a.obs_value);
  }
  const personByUser = new Map(
    (people ?? []).map((p: { id: number; auth_user_id: string; display_name: string }) => [
      p.auth_user_id,
      { id: p.id, name: p.display_name },
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    inspectionNo: row.inspection_no,
    date: reportDate(row),
    siteId: row.site_id,
    siteSlug: row.sites_pa.namesite,
    siteName: row.sites_pa.namesite,
    submittedBy: (row.user_id && personByUser.get(row.user_id)) || null,
    stewardName: stewardByReport.get(row.id)?.trim() || null,
    naturalness: naturalnessOf(natByReport.get(row.id)),
    isOwn: row.user_id === caller.userId,
    isActive: row.is_active !== false,
    ...(filter.withAnswers && {
      answers: reduceAnswers(row.answers ?? [], NO_FILTER).answers.map((a) => ({
        section: a.section_title ?? '',
        question: a.question_text.replace(/\s*\(Q\d+[A-Za-z]?\)\s*$/, ''),
        value: a.obs_value,
        comment: a.obs_comm,
      })),
    }),
  }));
}

export async function getReport(caller: Caller, idParam: string): Promise<Report> {
  const id = Number(idParam);
  if (!/^\d+$/.test(idParam) || !Number.isSafeInteger(id) || id <= 0) throw new HttpError(404, 'Report not found.');
  const [report] = await listReports(caller, { reportId: id, withAnswers: true });
  if (!report) throw new HttpError(404, 'Report not found.');
  return report;
}

const MAX_TEXT = 5000;

interface QuestionRow {
  id: number;
  question_type: string;
  is_required: boolean;
  form_question: string;
  question_options: { option_text: string }[] | null;
}

/** Validates the body, then saves the report through the same server functions the new-report page uses. */
export async function createReport(body: unknown): Promise<{ id: number; inspectionNo: string }> {
  const input = body as Partial<NewReportInput> | null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Invalid report.');
  if (typeof input.siteSlug !== 'string' || !input.siteSlug.trim()) throw new HttpError(400, 'siteSlug is required.');
  const raw = input.answers;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, 'answers must be an object.');

  const site = await findSite(input.siteSlug);

  const { data: questionData, error } = await db()
    .from('questions')
    .select('id, question_type, is_required, form_question, question_options(option_text)')
    .eq('is_active', true)
    .eq('question_options.is_active', true);
  if (error) throw new Error(error.message);
  const questions = new Map((questionData as QuestionRow[]).map((q) => [q.id, q]));

  // Normalise and check every answer against its question.
  const answers = new Map<number, string | string[]>();
  for (const [key, value] of Object.entries(raw)) {
    const q = /^\d+$/.test(key) ? questions.get(Number(key)) : undefined;
    if (!q) throw new HttpError(400, `Unknown question: ${key}`);
    if (q.question_type === 'image') throw new HttpError(400, `Image answers are not supported: ${key}`);
    const values = Array.isArray(value) ? value : [value];
    if (!values.every((v) => typeof v === 'string' && v.length <= MAX_TEXT)) {
      throw new HttpError(400, `Answer to question ${key} must be text up to ${MAX_TEXT} characters.`);
    }
    const cleaned = (values as string[]).map((v) => v.trim()).filter(Boolean);
    if (cleaned.length === 0) continue;
    if (Array.isArray(value) && q.question_type !== 'selectall') {
      throw new HttpError(400, `Question ${key} takes one answer.`);
    }
    const options = (q.question_options ?? []).map((o) => o.option_text);
    if ((q.question_type === 'option' || q.question_type === 'selectall') && options.length) {
      const bad = cleaned.find((v) => !options.includes(v));
      if (bad) throw new HttpError(400, `"${bad}" is not an option for question ${key}.`);
    }
    if (q.question_type === 'date' && !cleaned.every(isIsoDate)) {
      throw new HttpError(400, `Question ${key} needs a date (YYYY-MM-DD).`);
    }
    answers.set(q.id, q.question_type === 'selectall' ? cleaned : cleaned[0]);
  }

  // Free text for "Other", stored in obs_comm like the form's legacy <id>_comm keys.
  const comments = new Map<number, string>();
  if (input.comments !== undefined) {
    if (!input.comments || typeof input.comments !== 'object' || Array.isArray(input.comments)) {
      throw new HttpError(400, 'comments must be an object.');
    }
    for (const [key, value] of Object.entries(input.comments)) {
      if (!/^\d+$/.test(key) || !questions.has(Number(key))) throw new HttpError(400, `Unknown question: ${key}`);
      if (typeof value !== 'string' || value.length > MAX_TEXT) {
        throw new HttpError(400, `Comment on question ${key} must be text up to ${MAX_TEXT} characters.`);
      }
      if (value.trim()) comments.set(Number(key), value.trim());
    }
  }

  const missing = [...questions.values()].filter(
    (q) => q.is_required && q.question_type !== 'image' && !answers.has(q.id)
  );
  if (missing.length) {
    throw new HttpError(400, `Required: ${missing.map((q) => q.form_question).join(', ')}`);
  }
  const dateQuestionId = await getDateOfVisitQuestionId();
  const inspectionDate = dateQuestionId !== null ? answers.get(dateQuestionId) : undefined;
  if (typeof inspectionDate !== 'string') throw new HttpError(400, 'The date of visit is required.');

  // From here on this mirrors handleSubmit in app/detail/[namesite]/new-report/page.tsx.
  const { id } = await addSiteInspectionReport(site.id, inspectionDate);
  try {
    const types = new Map((await getQuestionResponseType()).map((q) => [q.question_id, q]));
    const rows = [...answers].flatMap(([questionId, answer]) => {
      const t = types.get(questionId);
      return (Array.isArray(answer) ? answer : [answer]).map((v) => ({
        response_id: id,
        question_id: questionId,
        obs_value: t?.obs_value ? v : null,
        obs_comm: v === 'Other' ? comments.get(questionId) ?? null : t?.obs_comm ? v : null,
      }));
    });
    if (rows.length) await uploadSiteInspectionAnswers(rows);
  } catch (saveError) {
    await rollbackSiteInspectionSubmission(id).catch((e) => console.error('[api/v1] rollback failed', e));
    throw saveError;
  }

  const { data, error: readError } = await db().from('form_responses').select('inspection_no').eq('id', id).single();
  if (readError) throw new Error(readError.message);
  return { id, inspectionNo: data.inspection_no };
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().startsWith(value);
}
