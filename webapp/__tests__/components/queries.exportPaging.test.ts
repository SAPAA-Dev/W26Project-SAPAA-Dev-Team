import { getFormResponsesBySite } from '../../utils/supabase/queries';
import {
  getAttachmentsForResponseIds,
  getFormResponsesForSiteIds,
} from '../../lib/pdf/reportQueries';
import { createServerSupabase } from '../../utils/supabase/server';

jest.mock('../../utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

// A chainable query that resolves to the next queued page when awaited after .range().
function pagedQuery(pages: Array<{ data: unknown[] | null; error: unknown }>) {
  const query: Record<string, jest.Mock> = {};
  for (const m of ['select', 'eq', 'is', 'in', 'order', 'single']) {
    query[m] = jest.fn(() => query);
  }
  query.range = jest.fn(() => Promise.resolve(pages.shift() ?? { data: [], error: null }));
  return query;
}

// getFormResponsesBySite checks for an approved caller first (#251).
beforeEach(() => {
  const { createClient } = jest.requireMock('../../utils/supabase/server');
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'u1', app_metadata: { role: 'admin', authenticated: true } } },
        error: null,
      }),
    },
  });
});

const rows = (n: number, start = 0) =>
  Array.from({ length: n }, (_, i) => ({ id: start + i, response_id: 1 }));

describe('getAttachmentsForResponseIds', () => {
  it('fetches the next page when a chunk returns a full page of 1000 rows (7.0.6 AT1)', async () => {
    const query = pagedQuery([
      { data: rows(1000), error: null },
      { data: rows(5, 1000), error: null },
    ]);
    (createServerSupabase as jest.Mock).mockReturnValue({ from: jest.fn(() => query) });

    const result = await getAttachmentsForResponseIds([1, 2, 3]);

    expect(result).toHaveLength(1005);
    expect(query.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(query.order).toHaveBeenCalledWith('id', { ascending: true });
  });
});

describe('getFormResponsesBySite', () => {
  it('fetches the next page when a site has more than 1000 active reports (7.0.6 AT1)', async () => {
    const responses = pagedQuery([
      { data: rows(1000), error: null },
      { data: rows(2, 1000), error: null },
    ]);
    const site = pagedQuery([]);
    site.single = jest.fn(() => Promise.resolve({ data: { id: 7 }, error: null }));
    const questions = pagedQuery([]);
    questions.in = jest.fn(() => Promise.resolve({ data: [], error: null }));
    const tables: Record<string, unknown> = {
      sites_pa: site,
      questions,
      form_responses: responses,
    };
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: jest.fn((table: string) => tables[table]),
    });

    const result = await getFormResponsesBySite('Beaver Hills');

    expect(result).toHaveLength(1002);
    expect(result[1001].id).toBe(1001);
    expect(responses.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(responses.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
});

// A database error on a later page must fail the read. Returning the pages read so far
// would make an export that silently leaves out reports, photos or answers.
describe('export paging failures', () => {
  const pageError = { data: null, error: { message: 'canceling statement due to statement timeout' } };

  it('fails the bulk export read when a later page errors, instead of returning the first 1000 reports (7.0.6 AT1)', async () => {
    const responses = pagedQuery([{ data: rows(1000), error: null }, pageError, { data: rows(5, 2000), error: null }]);
    (createServerSupabase as jest.Mock).mockReturnValue({ from: jest.fn(() => responses) });

    await expect(getFormResponsesForSiteIds([7], {})).rejects.toThrow('canceling statement due to statement timeout');
    expect(responses.range).toHaveBeenCalledTimes(2);
  });

  it('fails the photo read when a later page errors, instead of exporting part of the photos (7.0.6 AT1)', async () => {
    const attachments = pagedQuery([{ data: rows(1000), error: null }, pageError]);
    (createServerSupabase as jest.Mock).mockReturnValue({ from: jest.fn(() => attachments) });

    await expect(getAttachmentsForResponseIds([1, 2, 3])).rejects.toThrow('canceling statement due to statement timeout');
    expect(attachments.range).toHaveBeenCalledTimes(2);
  });

  it('fails the site report read when a later page errors, so no report is exported without its answers (7.0.6 AT2)', async () => {
    const responses = pagedQuery([{ data: rows(1000), error: null }, pageError]);
    const site = pagedQuery([]);
    site.single = jest.fn(() => Promise.resolve({ data: { id: 7 }, error: null }));
    const questions = pagedQuery([]);
    questions.in = jest.fn(() => Promise.resolve({ data: [], error: null }));
    const tables: Record<string, unknown> = { sites_pa: site, questions, form_responses: responses };
    (createServerSupabase as jest.Mock).mockReturnValue({ from: jest.fn((table: string) => tables[table]) });

    await expect(getFormResponsesBySite('Beaver Hills')).rejects.toThrow('canceling statement due to statement timeout');
    expect(responses.range).toHaveBeenCalledTimes(2);
  });
});

// The site page reads reports with getFormResponsesBySite. A bulk export over several sites
// reads them with getFormResponsesForSiteIds, so both must give each report the same answers.
describe('bulk export answers (US 7.0.6 AT2)', () => {
  const question = (id: number, sectionId: number) => ({
    id,
    form_question: `Question ${id}`,
    section_id: sectionId,
    form_sections: { id: sectionId, title: `Section ${sectionId}` },
  });
  const reportRows = Array.from({ length: 51 }, (_, i) => ({
    id: 5000 + i,
    site_id: 7,
    user_id: `user-${i}`,
    created_at: '2026-10-01T00:00:00Z',
    inspection_date: '2026-10-01',
    inspection_no: `2026-${i}`,
    answers: [
      { question_id: 4, obs_value: 'Grazing', obs_comm: null, questions: question(4, 2) },
      { question_id: 4, obs_value: 'Logging', obs_comm: null, questions: question(4, 2) },
      { question_id: 9, obs_value: 'Other', obs_comm: `Note ${i}`, questions: question(9, 1) },
      { question_id: 12, obs_value: null, obs_comm: null, questions: question(12, 3) },
    ],
  }));

  const mockTables = (responses: ReturnType<typeof pagedQuery>) => {
    const site = pagedQuery([]);
    site.single = jest.fn(() => Promise.resolve({ data: { id: 7 }, error: null }));
    const questions = pagedQuery([]);
    questions.in = jest.fn(() => Promise.resolve({ data: [], error: null }));
    const tables: Record<string, unknown> = { sites_pa: site, questions, form_responses: responses };
    (createServerSupabase as jest.Mock).mockReturnValue({ from: jest.fn((table: string) => tables[table]) });
  };

  it('US 7.0.6 AT2: gives each of 51 exported reports the same answers as its site page', async () => {
    mockTables(pagedQuery([{ data: reportRows, error: null }]));
    const pageReports = await getFormResponsesBySite('Beaver Hills');
    mockTables(pagedQuery([{ data: reportRows, error: null }]));
    const exportReports = (await getFormResponsesForSiteIds([7], {})).get(7) ?? [];

    expect(exportReports).toHaveLength(51);
    expect(exportReports).toEqual(pageReports);
    expect(exportReports[0].answers.map((answer) => answer.obs_value ?? answer.obs_comm)).toEqual([
      'Note 0',
      'Grazing; Logging',
      null,
    ]);
  });

  it('US 7.0.6 AT2: leaves out archived and deactivated reports, as the site page does', async () => {
    const pageQuery = pagedQuery([{ data: [], error: null }]);
    mockTables(pageQuery);
    await getFormResponsesBySite('Beaver Hills');
    const exportQuery = pagedQuery([{ data: [], error: null }]);
    mockTables(exportQuery);
    const bySite = await getFormResponsesForSiteIds([7], {});

    expect(bySite.size).toBe(0);
    for (const query of [pageQuery, exportQuery]) {
      expect(query.is).toHaveBeenCalledWith('archived_at', null);
      expect(query.eq).toHaveBeenCalledWith('is_active', true);
    }
  });
});
