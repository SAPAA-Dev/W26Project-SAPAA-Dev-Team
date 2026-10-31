/**
 * @jest-environment node
 */
import { createServerSupabase } from '@/utils/supabase/server';
import * as queries from '@/utils/supabase/queries';
import { HttpError, type Caller } from '@/lib/api/v1/server/auth';
import { createReport, getReportAnswers, listReports, updateReport } from '@/lib/api/v1/server/reports';
import { getInspectionHistory } from '@/lib/api/v1/server/history';
import { getMe } from '@/lib/api/v1/server/me';
import { loadSites } from '@/lib/api/v1/server/sites';

jest.mock('@/utils/supabase/server', () => ({ createServerSupabase: jest.fn(), createClient: jest.fn() }));
jest.mock('@/utils/supabase/queries', () => ({
  addSiteInspectionReport: jest.fn(),
  getDateOfVisitQuestionId: jest.fn(),
  getFormResponseById: jest.fn(),
  getHiddenQuestionIdsByResponseId: jest.fn(),
  getQuestionResponseType: jest.fn(),
  requireReportWriter: jest.fn(),
  rollbackSiteInspectionSubmission: jest.fn(),
  updateSiteInspectionAnswers: jest.fn(),
  uploadSiteInspectionAnswers: jest.fn(),
  getSiteLinks: jest.fn(),
}));

type Calls = [string, unknown[]][];
type Rows = unknown[] | ((calls: Calls) => unknown[]);
const calls: Record<string, Calls> = {};

/** A supabase client whose every query returns the rows given for its table. */
function fakeDb(tables: Record<string, Rows>) {
  (createServerSupabase as jest.Mock).mockReturnValue({
    from(table: string) {
      const log: Calls = (calls[table] = []);
      let one = false;
      const chain: unknown = new Proxy(
        {},
        {
          get(_target, prop) {
            if (prop === 'then') {
              return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
                const source = tables[table] ?? [];
                const rows = typeof source === 'function' ? source(log) : source;
                return Promise.resolve({ data: one ? (rows[0] ?? null) : rows, error: null, count: rows.length }).then(
                  resolve,
                  reject
                );
              };
            }
            return (...args: unknown[]) => {
              log.push([String(prop), args]);
              if (prop === 'single' || prop === 'maybeSingle') one = true;
              return chain;
            };
          },
        }
      );
      return chain;
    },
  });
}

const questionsByPrefix: Rows = (log) => [{ id: log.some(([m, a]) => m === 'like' && a[1] === 'Q31%') ? 31 : 13 }];
const mine: Caller = { userId: 'me', email: null, isAdmin: false };
const admin: Caller = { userId: 'boss', email: null, isAdmin: true };

const answer = (question_id: number, obs_value: string | null, is_hidden: boolean, obs_comm: string | null = null) => ({
  question_id,
  obs_value,
  obs_comm,
  is_hidden,
  questions: { id: question_id, form_question: `Question ${question_id}`, section_id: 1, form_sections: { id: 1, title: 'S' } },
});

const site = { id: 5, namesite: 'Beaver Hills' };
const reportRow = (id: number, user_id: string, answers: unknown[]) => ({
  id,
  site_id: 5,
  user_id,
  is_active: true,
  inspection_no: `2026-00${id}`,
  inspection_date: '2026-09-01',
  created_at: '2026-09-01T10:00:00Z',
  sites_pa: site,
  answers,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('hidden answers in reports', () => {
  const rows = [
    // someone else's report: naturalness (31), steward name (13) and a plain question (7) are hidden
    reportRow(1, 'other', [answer(31, 'Excellent', true), answer(13, null, true, 'Pat Q'), answer(7, 'secret', true), answer(8, 'open', false)]),
    // my report with the same hidden answers
    reportRow(2, 'me', [answer(31, 'Good', true), answer(7, 'mine', true)]),
  ];
  const tables = { questions: questionsByPrefix, form_responses: rows, people: [] };

  it('removes hidden answers, and the summary built from them, from a steward who does not own the report', async () => {
    fakeDb(tables);
    const [others] = (await listReports(mine, { withAnswers: true })).filter((r) => r.id === 1);
    expect(others.answers?.map((a) => a.question)).toEqual(['Question 8']);
    expect(others.naturalness).toBeNull();
    expect(others.stewardName).toBeNull();
    expect(others.naturalnessHidden).toBeUndefined();
  });

  it('shows the owner their own hidden answers, flagged', async () => {
    fakeDb(tables);
    const own = (await listReports(mine, { withAnswers: true })).find((r) => r.id === 2)!;
    expect(own.answers?.filter((a) => a.hidden).map((a) => a.question)).toEqual(['Question 7', 'Question 31']);
    expect(own.naturalness?.label).toBe('Good');
    expect(own.naturalnessHidden).toBe(true);
  });

  it('shows an admin every hidden answer, flagged', async () => {
    fakeDb(tables);
    const first = (await listReports(admin, { withAnswers: true })).find((r) => r.id === 1)!;
    expect(first.answers).toHaveLength(4);
    expect(first.naturalness?.label).toBe('Excellent');
    expect(first.stewardName).toBe('Pat Q');
    expect(first.stewardNameHidden).toBe(true);
  });

  it('applies the same rule to the bulk naturalness read of the report list', async () => {
    fakeDb({
      questions: questionsByPrefix,
      form_responses: rows.map((r) => ({ ...r, answers: undefined })),
      answers: [
        { response_id: 1, question_id: 31, obs_value: 'Excellent', obs_comm: null, is_hidden: true },
        { response_id: 2, question_id: 31, obs_value: 'Good', obs_comm: null, is_hidden: true },
      ],
      people: [],
    });
    const list = await listReports(mine);
    expect(list.find((r) => r.id === 1)!.naturalness).toBeNull();
    expect(list.find((r) => r.id === 2)!.naturalness?.label).toBe('Good');
    expect(calls.answers.find(([m]) => m === 'select')![1][0]).toContain('is_hidden');
  });
});

describe('hidden naturalness in site statistics', () => {
  const tables: Record<string, Rows> = {
    sites_pa: [{ id: 5, namesite: 'Beaver Hills', is_active: true, protected_area_id: null, ab_counties: null, protected_areas: null }],
    questions: questionsByPrefix,
    form_responses: [{ id: 1, site_id: 5, user_id: 'other', inspection_date: '2026-09-01', created_at: null }],
    answers: [{ response_id: 1, obs_value: 'Excellent', is_hidden: true }],
    site_stewards: [],
  };

  it('leaves a hidden score out of the average and trend for another steward and for no caller', async () => {
    fakeDb(tables);
    expect((await loadSites('Beaver Hills', false, { caller: mine })).sites[0].avgNaturalness).toBeNull();
    expect((await loadSites('Beaver Hills')).sites[0].avgNaturalness).toBeNull();
    const { trend } = await loadSites('Beaver Hills', false, { caller: mine });
    expect(trend.get(5)).toEqual([]);
  });

  it('counts it for an admin and for the report owner', async () => {
    fakeDb(tables);
    expect((await loadSites('Beaver Hills', false, { caller: admin })).sites[0].avgNaturalness).toBe(4);
    expect((await loadSites('Beaver Hills', false, { caller: { ...mine, userId: 'other' } })).sites[0].avgNaturalness).toBe(4);
  });
});

describe('profile counts', () => {
  it('counts only reports that still have a site, like the profile route', async () => {
    fakeDb({ people: [], form_responses: [{ site_id: 5 }] });
    await getMe(mine);
    expect(calls.form_responses).toContainEqual(['not', ['site_id', 'is', null]]);
  });
});

describe('inspection history', () => {
  const row = (id: number, archived: string | null, active: boolean | null) => ({
    id,
    site_id: 5,
    inspection_date: '2026-09-01',
    created_at: null,
    sites_pa: { id: 5, namesite: 'Beaver Hills', archived_at: archived, is_active: active },
  });

  it('lists reports on archived or deactivated sites without opening them', async () => {
    fakeDb({ form_responses: [row(1, null, true), row(2, '2026-01-01', true), row(3, null, false)] });
    const page = await getInspectionHistory(mine, null, null);
    expect(page.items.map((i) => i.canOpen)).toEqual([true, false, false]);
    expect(page.items[1].siteArchived).toBe(true);
    expect(page.items[2].siteInactive).toBe(true);
    expect(page).toMatchObject({ page: 1, pageSize: 10, total: 3 });
    expect(calls.form_responses).toContainEqual(['not', ['site_id', 'is', null]]);
    expect(calls.form_responses).toContainEqual(['eq', ['user_id', 'me']]);
  });

  it('reads another steward through people.id and rejects ids that are not numbers', async () => {
    fakeDb({ people: [{ auth_user_id: 'them' }], form_responses: [] });
    await getInspectionHistory(mine, '12', '2');
    expect(calls.form_responses).toContainEqual(['eq', ['user_id', 'them']]);
    expect(calls.form_responses).toContainEqual(['range', [10, 19]]);
    await expect(getInspectionHistory(mine, 'x', null)).rejects.toMatchObject({ status: 404 });
  });

  it('returns an empty history for a person with no login', async () => {
    fakeDb({ people: [{ auth_user_id: null }] });
    expect(await getInspectionHistory(mine, '12', null)).toEqual({ items: [], page: 1, pageSize: 10, total: 0 });
  });
});

describe('writing reports', () => {
  const question = (id: number, question_type: string, is_required = false) => ({
    id,
    question_type,
    is_required,
    form_question: `Question ${id}`,
    question_options: [],
  });
  const form = [question(21, 'date', true), question(5, 'text'), question(6, 'image')];

  beforeEach(() => {
    (queries.getDateOfVisitQuestionId as jest.Mock).mockResolvedValue(21);
    (queries.getQuestionResponseType as jest.Mock).mockResolvedValue([
      { question_id: 21, obs_value: 1, obs_comm: 0 },
      { question_id: 5, obs_value: 0, obs_comm: 1 },
    ]);
  });

  it('createReport saves is_hidden for hidden questions and an empty marker for a hidden image question', async () => {
    fakeDb({ sites_pa: [site], questions: form, form_responses: [{ inspection_no: '2026-009' }] });
    (queries.addSiteInspectionReport as jest.Mock).mockResolvedValue({ id: 9 });
    await createReport({ siteSlug: 'Beaver Hills', answers: { 21: '2026-10-01', 5: 'hello' }, hidden: [5, 6, 999] });
    const rows = (queries.uploadSiteInspectionAnswers as jest.Mock).mock.calls[0][0];
    expect(rows).toEqual([
      { response_id: 9, question_id: 5, obs_value: null, obs_comm: 'hello', is_hidden: true },
      { response_id: 9, question_id: 21, obs_value: '2026-10-01', obs_comm: null, is_hidden: false },
      { response_id: 9, question_id: 6, obs_value: null, obs_comm: null, is_hidden: true },
    ]);
  });

  it('createReport refuses a malformed hidden list', async () => {
    fakeDb({ sites_pa: [site], questions: form });
    await expect(
      createReport({ siteSlug: 'Beaver Hills', answers: { 21: '2026-10-01' }, hidden: ['5'] })
    ).rejects.toMatchObject({ status: 400 });
    expect(queries.addSiteInspectionReport).not.toHaveBeenCalled();
  });

  it('updateReport replaces the answers, keeps hidden flags and keeps answers of questions off the form', async () => {
    fakeDb({
      questions: form,
      answers: [
        { question_id: 77, obs_value: 'old', obs_comm: null, is_hidden: true },
        { question_id: 5, obs_value: null, obs_comm: 'before', is_hidden: false },
      ],
    });
    (queries.requireReportWriter as jest.Mock).mockResolvedValue({});
    await updateReport('42', { answers: { 21: '2026-10-02', 5: 'after' }, hidden: [5] });
    expect(queries.requireReportWriter).toHaveBeenCalledWith(42);
    expect(queries.updateSiteInspectionAnswers).toHaveBeenCalledWith(
      42,
      [
        { question_id: 5, obs_value: null, obs_comm: 'after', is_hidden: true },
        { question_id: 21, obs_value: '2026-10-02', obs_comm: null, is_hidden: false },
        { question_id: 77, obs_value: 'old', obs_comm: null, is_hidden: true },
      ],
      '2026-10-02'
    );
  });

  it('updateReport answers 403 for someone who is neither the owner nor an admin, and writes nothing', async () => {
    fakeDb({ questions: form });
    (queries.requireReportWriter as jest.Mock).mockRejectedValue(new Error('You are not allowed to change this report.'));
    await expect(updateReport('42', { answers: {} })).rejects.toEqual(expect.any(HttpError));
    await expect(updateReport('42', { answers: {} })).rejects.toMatchObject({ status: 403 });
    await expect(updateReport('nope', { answers: {} })).rejects.toMatchObject({ status: 404 });
    expect(queries.updateSiteInspectionAnswers).not.toHaveBeenCalled();
  });

  it('updateReport turns the server-side required check into a 400', async () => {
    fakeDb({ questions: form, answers: [] });
    (queries.requireReportWriter as jest.Mock).mockResolvedValue({});
    (queries.updateSiteInspectionAnswers as jest.Mock).mockRejectedValue(new Error('Required questions are missing: Q1'));
    await expect(updateReport('42', { answers: { 21: '2026-10-02' } })).rejects.toMatchObject({ status: 400 });
  });

  it('getReportAnswers splits the Other text out and passes the hidden ids', async () => {
    (queries.getFormResponseById as jest.Mock).mockResolvedValue({ 5: 'hi', 8: ['Other'], '8_comm': 'moss' });
    (queries.getHiddenQuestionIdsByResponseId as jest.Mock).mockResolvedValue([5, 6]);
    expect(await getReportAnswers('42')).toEqual({ answers: { 5: 'hi', 8: ['Other'] }, comments: { 8: 'moss' }, hidden: [5, 6] });
    (queries.getFormResponseById as jest.Mock).mockRejectedValue(new Error('You are not allowed to view this report.'));
    await expect(getReportAnswers('42')).rejects.toMatchObject({ status: 403 });
  });
});
