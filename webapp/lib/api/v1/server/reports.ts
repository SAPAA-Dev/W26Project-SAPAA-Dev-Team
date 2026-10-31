import { reduceAnswers, type RawAnswerRow } from '@/lib/pdf/reportQueries';
import {
  addSiteInspectionReport,
  getDateOfVisitQuestionId,
  getFormResponseById,
  getHiddenQuestionIdsByResponseId,
  getQuestionResponseType,
  requireReportWriter,
  rollbackSiteInspectionSubmission,
  updateSiteInspectionAnswers,
  uploadSiteInspectionAnswers,
} from '@/utils/supabase/queries';
import type { NewReportInput, Report, ReportAnswersForEdit, ReportUpdateInput } from '../types';
import { HttpError, type Caller } from './auth';
import { db, fetchAll, naturalnessOf, questionIds, reportDate } from './db';
import { findSite } from './sites';
import { canReadHidden, visibleAnswers } from './visibility';

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
  'answers(question_id, obs_value, obs_comm, is_hidden, questions(id, form_question, section_id, form_sections!questions_section_id_fkey(id, title)))';
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
        : await fetchAll<{
            response_id: number;
            question_id: number;
            obs_value: string | null;
            obs_comm: string | null;
            is_hidden?: boolean | null;
          }>(
            (from, to) =>
              db()
                .from('answers')
                .select('response_id, question_id, obs_value, obs_comm, is_hidden')
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
  const natHidden = new Set<number>();
  const stewardHidden = new Set<number>();
  const ownerOf = new Map(rows.map((row) => [row.id, row.user_id]));
  for (const a of answers) {
    // A hidden answer reaches only an admin or the report's owner, as in getFormResponsesBySite.
    if (a.is_hidden === true && !canReadHidden(caller, ownerOf.get(a.response_id))) continue;
    if (natIds.has(a.question_id)) {
      natByReport.set(a.response_id, a.obs_value);
      if (a.is_hidden === true) natHidden.add(a.response_id);
    }
    if (stewardIds.has(a.question_id)) {
      stewardByReport.set(a.response_id, a.obs_comm ?? a.obs_value);
      if (a.is_hidden === true) stewardHidden.add(a.response_id);
    }
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
    ...(natHidden.has(row.id) && { naturalnessHidden: true }),
    ...(stewardHidden.has(row.id) && { stewardNameHidden: true }),
    isOwn: row.user_id === caller.userId,
    isActive: row.is_active !== false,
    ...(filter.withAnswers && {
      answers: reduceAnswers(visibleAnswers(row.answers ?? [], caller, row.user_id), NO_FILTER).answers.map((a) => ({
        section: a.section_title ?? '',
        question: a.question_text.replace(/\s*\(Q\d+[A-Za-z]?\)\s*$/, ''),
        value: a.obs_value,
        comment: a.obs_comm,
        ...(a.is_hidden && { hidden: true }),
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

interface ParsedInput {
  questions: Map<number, QuestionRow>;
  answers: Map<number, string | string[]>;
  comments: Map<number, string>;
  hidden: Set<number>;
  inspectionDate: string;
}

/** Validates answers, comments and hidden ids against the active form. Shared by createReport and updateReport. */
async function parseInput(input: { answers?: unknown; comments?: unknown; hidden?: unknown }): Promise<ParsedInput> {
  const raw = input.answers;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, 'answers must be an object.');

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

  // Question ids to hide from other stewards. An id that is no longer on the form is ignored.
  const hidden = new Set<number>();
  if (input.hidden !== undefined) {
    if (!Array.isArray(input.hidden) || !input.hidden.every((id) => Number.isSafeInteger(id) && id > 0)) {
      throw new HttpError(400, 'hidden must be a list of question ids.');
    }
    for (const id of input.hidden as number[]) if (questions.has(id)) hidden.add(id);
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

  return { questions, answers, comments, hidden, inspectionDate };
}

interface AnswerRow {
  question_id: number;
  obs_value: string | null;
  obs_comm: string | null;
  is_hidden: boolean;
}

/**
 * The answer rows, shaped like handleSubmit in app/detail/[namesite]/new-report/page.tsx: every row of a
 * hidden question carries is_hidden, and a hidden image question keeps an empty marker row, because the
 * photo gallery hides a photo through the hidden flag of its question.
 */
async function buildRows({ questions, answers, comments, hidden }: ParsedInput): Promise<AnswerRow[]> {
  const types = new Map((await getQuestionResponseType()).map((q) => [q.question_id, q]));
  const rows = [...answers].flatMap(([questionId, answer]) => {
    const t = types.get(questionId);
    return (Array.isArray(answer) ? answer : [answer]).map((v) => ({
      question_id: questionId,
      obs_value: t?.obs_value ? v : null,
      obs_comm: v === 'Other' ? comments.get(questionId) ?? null : t?.obs_comm ? v : null,
      is_hidden: hidden.has(questionId),
    }));
  });
  for (const id of hidden) {
    if (questions.get(id)?.question_type === 'image') rows.push({ question_id: id, obs_value: null, obs_comm: null, is_hidden: true });
  }
  return rows;
}

/** Validates the body, then saves the report through the same server functions the new-report page uses. */
export async function createReport(body: unknown): Promise<{ id: number; inspectionNo: string }> {
  const input = body as Partial<NewReportInput> | null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Invalid report.');
  if (typeof input.siteSlug !== 'string' || !input.siteSlug.trim()) throw new HttpError(400, 'siteSlug is required.');
  if (!input.answers || typeof input.answers !== 'object' || Array.isArray(input.answers)) {
    throw new HttpError(400, 'answers must be an object.');
  }

  const site = await findSite(input.siteSlug);
  const parsed = await parseInput(input);

  // From here on this mirrors handleSubmit in app/detail/[namesite]/new-report/page.tsx.
  const { id } = await addSiteInspectionReport(site.id, parsed.inspectionDate);
  try {
    const rows = (await buildRows(parsed)).map((row) => ({ ...row, response_id: id }));
    if (rows.length) await uploadSiteInspectionAnswers(rows);
  } catch (saveError) {
    await rollbackSiteInspectionSubmission(id).catch((e) => console.error('[api/v1] rollback failed', e));
    throw saveError;
  }

  const { data, error: readError } = await db().from('form_responses').select('inspection_no').eq('id', id).single();
  if (readError) throw new Error(readError.message);
  return { id, inspectionNo: data.inspection_no };
}

// requireReportWriter and the two edit reads throw these messages for "not yours" and "not there".
const WRITE_DENIED = 'You are not allowed to change this report.';
const VIEW_DENIED = 'You are not allowed to view this report.';

async function asOwnerOrAdmin<T>(denied: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof Error && error.message === denied) throw new HttpError(403, denied);
    throw error;
  }
}

function reportId(idParam: string): number {
  const id = Number(idParam);
  if (!/^\d+$/.test(idParam) || !Number.isSafeInteger(id) || id <= 0) throw new HttpError(404, 'Report not found.');
  return id;
}

/**
 * Replaces every answer of a past report, as the edit-report page does. Only the report's owner or an admin
 * may do it (requireReportWriter), and an archived report cannot be changed. Answers to questions that are no
 * longer on the form are carried over untouched.
 */
export async function updateReport(idParam: string, body: unknown): Promise<{ id: number }> {
  const id = reportId(idParam);
  await asOwnerOrAdmin(WRITE_DENIED, () => requireReportWriter(id));
  const input = body as Partial<ReportUpdateInput> | null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Invalid report.');

  const parsed = await parseInput(input);
  const rows = await buildRows(parsed);
  const { data, error } = await db().from('answers').select('question_id, obs_value, obs_comm, is_hidden').eq('response_id', id);
  if (error) throw new Error(error.message);
  const kept = ((data ?? []) as (Omit<AnswerRow, 'is_hidden'> & { is_hidden: boolean | null })[])
    .filter((row) => !parsed.questions.has(row.question_id))
    .map((row) => ({ ...row, is_hidden: row.is_hidden === true }));

  try {
    await updateSiteInspectionAnswers(id, [...rows, ...kept], parsed.inspectionDate);
  } catch (saveError) {
    if (saveError instanceof Error && saveError.message.startsWith('Required questions are missing')) {
      throw new HttpError(400, saveError.message);
    }
    throw saveError;
  }
  return { id };
}

/** A report's stored answers for the edit form: the owner or an admin only (getFormResponseById checks that). */
export async function getReportAnswers(idParam: string): Promise<ReportAnswersForEdit> {
  const id = reportId(idParam);
  const [raw, hidden] = await asOwnerOrAdmin(VIEW_DENIED, () =>
    Promise.all([getFormResponseById(id), getHiddenQuestionIdsByResponseId(id)])
  );
  const answers: ReportAnswersForEdit['answers'] = {};
  const comments: ReportAnswersForEdit['comments'] = {};
  for (const [key, value] of Object.entries(raw)) {
    // getFormResponseById keeps the text typed with "Other" under "<id>_comm".
    if (key.endsWith('_comm')) comments[Number(key.slice(0, -5))] = value as string;
    else answers[Number(key)] = value;
  }
  return { answers, comments, hidden };
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().startsWith(value);
}
