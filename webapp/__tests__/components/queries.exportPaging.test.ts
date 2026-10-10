import { getAttachmentsForResponseIds, getFormResponsesBySite } from '../../utils/supabase/queries';
import { createServerSupabase } from '../../utils/supabase/server';

jest.mock('../../utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

// A chainable query that resolves to the next queued page when awaited after .range().
function pagedQuery(pages: Array<{ data: unknown[]; error: unknown }>) {
  const query: any = {};
  for (const m of ['select', 'eq', 'is', 'in', 'order', 'single']) {
    query[m] = jest.fn(() => query);
  }
  query.range = jest.fn(() => Promise.resolve(pages.shift() ?? { data: [], error: null }));
  return query;
}

const rows = (n: number, start = 0) =>
  Array.from({ length: n }, (_, i) => ({ id: start + i, response_id: 1 }));

describe('getAttachmentsForResponseIds', () => {
  it('fetches the next page when a chunk returns a full page of 1000 rows', async () => {
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
  it('fetches the next page when a site has more than 1000 active reports', async () => {
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
