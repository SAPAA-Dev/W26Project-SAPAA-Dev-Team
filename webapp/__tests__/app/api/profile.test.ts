jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

import { GET, PATCH } from '@/app/api/profile/route';
import { createClient, createServerSupabase } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
  createServerSupabase: jest.fn(),
}));

type QueryResult = Record<string, unknown>;

function makeQuery(result: QueryResult) {
  const query: Record<string, unknown> = {};
  ['select', 'eq', 'not', 'is', 'order', 'range', 'overrideTypes', 'update'].forEach((method) => {
    query[method] = jest.fn(() => query);
  });
  query.maybeSingle = jest.fn(async () => result);
  return query;
}

function makeRequest(params: Record<string, string>, body?: unknown) {
  return {
    nextUrl: { searchParams: new URLSearchParams(params) },
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    },
  };
}

const VIEWER = { id: '11111111-1111-1111-1111-111111111111', app_metadata: { authenticated: true } };
const PERSON = {
  id: 42,
  auth_user_id: VIEWER.id,
  display_name: 'Jamie Rivera',
  skills: ['Bird ID'],
  focus_areas: ['Wetlands'],
};

describe('/api/profile', () => {
  const mockGetUser = jest.fn();
  const mockAdminFrom = jest.fn();
  const mockRpc = jest.fn();
  const mockGetUserById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: jest.fn() });
    (createServerSupabase as jest.Mock).mockReturnValue({
      from: mockAdminFrom,
      rpc: mockRpc,
      auth: { admin: { getUserById: mockGetUserById } },
    });
    mockGetUser.mockResolvedValue({ data: { user: VIEWER }, error: null });
    mockAdminFrom.mockReturnValue(makeQuery({ data: PERSON, error: null }));
    mockRpc.mockResolvedValue({ data: 2, error: null });
    mockGetUserById.mockResolvedValue({ data: { user: { app_metadata: { role: 'admin' } } } });
  });

  describe('GET', () => {
    it('answers 404 for a personId that is not a whole number', async () => {
      const response = await GET(makeRequest({ personId: 'abc' }) as never);

      expect(response.status).toBe(404);
      expect(mockAdminFrom).not.toHaveBeenCalled();
    });

    it('answers 404 for a personId that is not a whole number on any page', async () => {
      const response = await GET(makeRequest({ personId: '-1' }) as never);

      expect(response.status).toBe(404);
      expect(mockAdminFrom).not.toHaveBeenCalled();
    });

    it.each(['9223372036854775808', '99999999999999999999999'])(
      'answers 404 for a personId %s that is larger than a bigint',
      async (personId) => {
        const response = await GET(makeRequest({ personId }) as never);

        expect(response.status).toBe(404);
        expect(mockAdminFrom).not.toHaveBeenCalled();
      },
    );

    it('looks up the largest bigint personId', async () => {
      await GET(makeRequest({ personId: '9223372036854775807' }) as never);

      expect(mockAdminFrom).toHaveBeenCalledWith('people');
    });

    it('answers 503 only when the people table is missing', async () => {
      mockAdminFrom.mockReturnValue(
        makeQuery({ data: null, error: { code: '42P01', message: 'relation "public.people" does not exist' } }),
      );

      const response = await GET(makeRequest({}) as never);

      expect(response.status).toBe(503);
    });

    it('does not treat an error that mentions people as a missing table', async () => {
      mockAdminFrom.mockReturnValue(
        makeQuery({ data: null, error: { code: '23514', message: 'check constraint on people failed' } }),
      );

      const response = await GET(makeRequest({}) as never);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Unable to load this profile.' });
    });

    it('returns an empty history when the person has no linked login', async () => {
      mockAdminFrom.mockReturnValue(
        makeQuery({ data: { ...PERSON, auth_user_id: null }, error: null }),
      );

      const response = await GET(makeRequest({ personId: '42' }) as never);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.stats).toEqual({ inspectionCount: 0, distinctSiteCount: 0 });
      expect(body.history).toEqual([]);
      expect(body.isOwner).toBe(false);
      expect(mockAdminFrom).not.toHaveBeenCalledWith('form_responses');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('counts distinct sites in SQL instead of reading every inspection', async () => {
      const response = await GET(makeRequest({ personId: '42' }) as never);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith('get_distinct_inspected_site_count', { p_user_id: VIEWER.id });
      expect(body.stats.distinctSiteCount).toBe(2);
      expect(mockAdminFrom).toHaveBeenCalledTimes(2);
      expect(mockAdminFrom).toHaveBeenCalledWith('people');
      expect(mockAdminFrom).toHaveBeenCalledWith('form_responses');
    });

    it('flags unavailable sites and removes reports for deleted sites', async () => {
      const peopleQuery = makeQuery({ data: PERSON, error: null });
      // The route awaits the form_responses query directly, so the mock carries the result.
      const responsesResult = {
        data: [
          { id: 7, site_id: 5, inspection_date: '2026-09-12', created_at: null, sites_pa: { id: 5, namesite: 'Beaver Hills', archived_at: null } },
          { id: 8, site_id: 6, inspection_date: '2026-09-01', created_at: null, sites_pa: { id: 6, namesite: 'Duck Lake', archived_at: '2026-10-08T20:00:00.000Z' } },
          { id: 10, site_id: 7, inspection_date: '2026-08-15', created_at: null, sites_pa: { id: 7, namesite: 'Elk Island', archived_at: null, is_active: false } },
          { id: 9, site_id: null, inspection_date: '2026-08-01', created_at: null, sites_pa: null },
        ],
        error: null,
        count: 3,
      };
      const responsesQuery: Record<string, unknown> = { ...responsesResult };
      ['select', 'eq', 'not', 'is', 'order', 'range', 'overrideTypes'].forEach((method) => {
        responsesQuery[method] = jest.fn(() => responsesQuery);
      });
      mockAdminFrom.mockImplementation((table: string) =>
        table === 'form_responses' ? responsesQuery : peopleQuery
      );

      const response = await GET(makeRequest({ personId: '42' }) as never);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(responsesQuery.select).toHaveBeenCalledWith(
        'id, site_id, inspection_date, created_at, sites_pa(id, namesite, archived_at, is_active)',
        { count: 'exact' }
      );
      expect(responsesQuery.is).toHaveBeenCalledWith('archived_at', null);
      expect(responsesQuery.not).toHaveBeenCalledWith('site_id', 'is', null);
      expect(body.history).toEqual([
        { id: 7, siteId: 5, siteName: 'Beaver Hills', siteArchived: false, siteInactive: false, inspectionDate: '2026-09-12' },
        { id: 8, siteId: 6, siteName: 'Duck Lake', siteArchived: true, siteInactive: false, inspectionDate: '2026-09-01' },
        // US 2.0.3 (M25): a deactivated site is flagged so the profile does not link to it.
        { id: 10, siteId: 7, siteName: 'Elk Island', siteArchived: false, siteInactive: true, inspectionDate: '2026-08-15' },
      ]);
    });

    describe('page', () => {
      // A form_responses query whose final await gives `result`.
      function responsesQuery(result: Record<string, unknown>) {
        const query: Record<string, unknown> = { ...result };
        ['select', 'eq', 'not', 'is', 'order', 'range', 'overrideTypes'].forEach((method) => {
          query[method] = jest.fn(() => query);
        });
        return query;
      }

      function mockResponses(...queries: Record<string, unknown>[]) {
        const peopleQuery = makeQuery({ data: PERSON, error: null });
        mockAdminFrom.mockImplementation((table: string) =>
          table === 'form_responses' ? queries.shift() : peopleQuery
        );
      }

      it('reads the requested page', async () => {
        const page = responsesQuery({ data: [], error: null, count: 14 });
        mockResponses(page);

        const response = await GET(makeRequest({ personId: '42', page: '2' }) as never);

        expect(response.status).toBe(200);
        expect(page.range).toHaveBeenCalledWith(10, 19);
        expect((await response.json()).pagination).toEqual({ page: 2, pageSize: 10, total: 14 });
      });

      it.each(['abc', '0', '-3'])('reads the first page for page=%s, as before', async (value) => {
        const page = responsesQuery({ data: [], error: null, count: 14 });
        mockResponses(page);

        const response = await GET(makeRequest({ personId: '42', page: value }) as never);

        expect(response.status).toBe(200);
        expect(page.range).toHaveBeenCalledWith(0, 9);
      });

      it('caps a huge page so PostgREST never gets an offset like 1e+21', async () => {
        const page = responsesQuery({ data: [], error: null, count: 14 });
        mockResponses(page);

        await GET(makeRequest({ personId: '42', page: '99999999999999999999' }) as never);

        const [from] = (page.range as jest.Mock).mock.calls[0];
        expect(Number.isSafeInteger(from)).toBe(true);
        expect(String(from)).not.toContain('e');
      });

      it('answers 200 with an empty history for a page past the last report', async () => {
        // PostgREST refuses an offset past the last row with PGRST103 and sends no count.
        const page = responsesQuery({ data: null, error: { code: 'PGRST103', message: 'Requested range not satisfiable' }, count: null });
        const total = responsesQuery({ data: null, error: null, count: 14 });
        mockResponses(page, total);

        const response = await GET(makeRequest({ personId: '42', page: '5' }) as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(total.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
        expect(total.is).toHaveBeenCalledWith('archived_at', null);
        expect(body.history).toEqual([]);
        expect(body.pagination).toEqual({ page: 5, pageSize: 10, total: 14 });
        expect(body.stats.inspectionCount).toBe(14);
      });

      it('still answers 500 when the history query fails for another reason', async () => {
        mockResponses(responsesQuery({ data: null, error: { code: 'XX000', message: 'boom' }, count: null }));

        const response = await GET(makeRequest({ personId: '42', page: '5' }) as never);

        expect(response.status).toBe(500);
      });

      it('answers 500 when the count after PGRST103 fails', async () => {
        mockResponses(
          responsesQuery({ data: null, error: { code: 'PGRST103', message: 'Requested range not satisfiable' }, count: null }),
          responsesQuery({ data: null, error: { code: 'XX000', message: 'boom' }, count: null }),
        );

        const response = await GET(makeRequest({ personId: '42', page: '5' }) as never);

        expect(response.status).toBe(500);
      });
    });

    it('returns the person\'s contact details, with blanks as null (1.0.1 AT1)', async () => {
      mockAdminFrom.mockReturnValue(
        makeQuery({ data: { ...PERSON, socials: { email: 'jamie@example.com', x: null } }, error: null }),
      );

      const response = await GET(makeRequest({ personId: '42' }) as never);
      const body = await response.json();

      expect(body.profile.socials.email).toBe('jamie@example.com');
      expect(body.profile.socials.linkedin).toBeNull();
    });

    it('answers 401 when nobody is signed in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const response = await GET(makeRequest({}) as never);

      expect(response.status).toBe(401);
    });

    it.each([{}, { authenticated: false }])('answers 403 and reads nothing for an account that is not approved: %j', async (appMetadata) => {
      mockGetUser.mockResolvedValue({ data: { user: { id: VIEWER.id, app_metadata: appMetadata } }, error: null });

      const response = await GET(makeRequest({ personId: '42' }) as never);

      expect(response.status).toBe(403);
      expect(createServerSupabase).not.toHaveBeenCalled();
    });
  });

  describe('PATCH', () => {
    const validBody = { displayName: 'Jamie R.', skills: ['Bird ID'], focusAreas: ['Wetlands'] };

    it('writes with the signed-in client so the database applies the rules (1.0.2 AT2)', async () => {
      const updateQuery = makeQuery({ data: { ...PERSON, display_name: 'Jamie R.' }, error: null });
      const sessionFrom = jest.fn().mockReturnValue(updateQuery);
      (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: sessionFrom });

      const response = await PATCH(makeRequest({}, validBody) as never);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(sessionFrom).toHaveBeenCalledWith('people');
      expect(updateQuery.update).toHaveBeenCalledWith({
        display_name: 'Jamie R.',
        skills: ['Bird ID'],
        focus_areas: ['Wetlands'],
      });
      expect(body.profile.displayName).toBe('Jamie R.');
      expect(createServerSupabase).not.toHaveBeenCalled();
    });

    it('saves contact details for the signed-in person only (1.0.2 AT1)', async () => {
      const updateQuery = makeQuery({ data: PERSON, error: null });
      const socialsQuery = { upsert: jest.fn().mockResolvedValue({ error: null }) };
      const sessionFrom = jest.fn((table: string) => (table === 'socials' ? socialsQuery : updateQuery));
      (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: sessionFrom });

      const response = await PATCH(
        makeRequest({}, { ...validBody, socials: { email: 'jamie@example.com', website: '' } }) as never,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(socialsQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ person_id: 42, email: 'jamie@example.com', website: null }),
        { onConflict: 'person_id' },
      );
      expect(body.profile.socials.email).toBe('jamie@example.com');
    });

    it('returns the saved profile with the error when only the contact details fail (1.0.2 AT4)', async () => {
      const updateQuery = makeQuery({ data: { ...PERSON, display_name: 'Jamie R.' }, error: null });
      const socialsQuery = { upsert: jest.fn().mockResolvedValue({ error: { message: 'rls' } }) };
      const sessionFrom = jest.fn((table: string) => (table === 'socials' ? socialsQuery : updateQuery));
      (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: sessionFrom });

      const response = await PATCH(
        makeRequest({}, { ...validBody, socials: { email: 'jamie@example.com' } }) as never,
      );
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toMatch(/contact details were not/);
      expect(body.profile).toEqual({ id: 42, displayName: 'Jamie R.', skills: ['Bird ID'], focusAreas: ['Wetlands'] });
    });

    it('rejects a blank contact email and writes nothing (1.0.2 AT3)', async () => {
      const sessionFrom = jest.fn();
      (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: sessionFrom });

      const response = await PATCH(makeRequest({}, { ...validBody, socials: { email: '  ' } }) as never);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Email is required.');
      expect(sessionFrom).not.toHaveBeenCalled();
    });

    it('rejects a non-https link and writes nothing', async () => {
      const sessionFrom = jest.fn();
      (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: sessionFrom });

      const response = await PATCH(makeRequest({}, { ...validBody, socials: { x: 'javascript:alert(1)' } }) as never);

      expect(response.status).toBe(400);
      expect(sessionFrom).not.toHaveBeenCalled();
    });

    it('leaves contact details alone when the request has none', async () => {
      const updateQuery = makeQuery({ data: PERSON, error: null });
      const sessionFrom = jest.fn().mockReturnValue(updateQuery);
      (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: sessionFrom });

      await PATCH(makeRequest({}, validBody) as never);

      expect(sessionFrom).not.toHaveBeenCalledWith('socials');
    });

    it('answers 401 when nobody is signed in (1.0.2 AT1)', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const response = await PATCH(makeRequest({}, validBody) as never);

      expect(response.status).toBe(401);
    });

    it('rejects a display name of 30 characters because the database stops at 29 (1.0.2 AT3)', async () => {
      const thirtyCharacters = 'x'.repeat(30);
      const response = await PATCH(makeRequest({}, { ...validBody, displayName: thirtyCharacters }) as never);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Display name must be between 1 and 29 characters.');
    });

    it('accepts a display name of 29 characters (1.0.2 AT4)', async () => {
      const updateQuery = makeQuery({ data: PERSON, error: null });
      (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser }, from: jest.fn(() => updateQuery) });

      const response = await PATCH(makeRequest({}, { ...validBody, displayName: 'x'.repeat(29) }) as never);

      expect(response.status).toBe(200);
    });

    it('rejects more than twelve skills (1.0.2 AT6)', async () => {
      const manySkills = Array.from({ length: 13 }, (_, index) => `Skill ${index}`);
      const response = await PATCH(makeRequest({}, { ...validBody, skills: manySkills }) as never);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Skills must contain no more than 12 entries.');
    });
  });
});
