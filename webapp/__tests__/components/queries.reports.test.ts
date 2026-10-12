import { getAllSiteReports } from '../../utils/supabase/queries';
import {
  createClient,
  createServerSupabase,
} from '../../utils/supabase/server';

jest.mock('../../utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

type ChainableQuery = {
  data: unknown;
  error: unknown;
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  order: jest.Mock;
  in: jest.Mock;
};

// A chainable query whose awaited value is the result itself, like the supabase client.
function chainableQuery(result: { data: unknown; error: unknown }): ChainableQuery {
  const query = { ...result } as ChainableQuery;
  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.is = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.in = jest.fn(() => query);
  return query;
}

function mockSignedIn(signedIn: boolean) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: signedIn ? { id: 'caller-uuid' } : null },
        error: null,
      }),
    },
  });
}

const reportRows = [
  {
    id: 11,
    user_id: 'u1',
    inspection_no: '2026-002',
    inspection_date: '2026-09-12',
    created_at: '2026-09-12T10:00:00.000Z',
    site_id: 5,
    sites_pa: { id: 5, namesite: 'Beaver Hills', archived_at: null },
  },
  {
    id: 12,
    user_id: 'u2',
    inspection_no: '2026-001',
    inspection_date: '2026-09-01',
    created_at: '2026-09-01T10:00:00.000Z',
    site_id: 6,
    sites_pa: { id: 6, namesite: 'Duck Lake', archived_at: '2026-10-08T20:00:00.000Z' },
  },
  {
    id: 13,
    user_id: null,
    inspection_no: null,
    inspection_date: null,
    created_at: '2026-08-01T10:00:00.000Z',
    site_id: null,
    sites_pa: null,
  },
];

describe('getAllSiteReports', () => {
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignedIn(true);
    (createServerSupabase as jest.Mock).mockReturnValue({ from: mockFrom });
  });

  it('rejects a signed-out caller before any database query', async () => {
    mockSignedIn(false);

    await expect(getAllSiteReports()).rejects.toThrow(
      'Sign in to view inspection reports.'
    );
    expect(createServerSupabase).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns every active report with site and submitter details (7.0.8 AT2)', async () => {
    const responsesQuery = chainableQuery({ data: reportRows, error: null });
    const peopleQuery = chainableQuery({
      data: [
        { id: 42, auth_user_id: 'u1', display_name: 'Jamie Rivera' },
        { id: 43, auth_user_id: 'u2', display_name: 'Robin Chen' },
      ],
      error: null,
    });
    mockFrom.mockImplementation((table: string) =>
      table === 'form_responses' ? responsesQuery : peopleQuery
    );

    await expect(getAllSiteReports()).resolves.toEqual([
      {
        id: 11,
        inspectionNo: '2026-002',
        inspectionDate: '2026-09-12',
        createdAt: '2026-09-12T10:00:00.000Z',
        siteId: 5,
        siteName: 'Beaver Hills',
        siteArchived: false,
        siteInactive: false,
        submitterId: 42,
        submitterName: 'Jamie Rivera',
      },
      {
        id: 12,
        inspectionNo: '2026-001',
        inspectionDate: '2026-09-01',
        createdAt: '2026-09-01T10:00:00.000Z',
        siteId: 6,
        siteName: 'Duck Lake',
        siteArchived: true,
        siteInactive: false,
        submitterId: 43,
        submitterName: 'Robin Chen',
      },
      {
        id: 13,
        inspectionNo: null,
        inspectionDate: null,
        createdAt: '2026-08-01T10:00:00.000Z',
        siteId: null,
        siteName: null,
        siteArchived: false,
        siteInactive: false,
        submitterId: null,
        submitterName: null,
      },
    ]);

    expect(mockFrom).toHaveBeenCalledWith('form_responses');
    expect(responsesQuery.eq).toHaveBeenCalledWith('is_active', true);
    expect(responsesQuery.is).toHaveBeenCalledWith('archived_at', null);
    expect(responsesQuery.order).toHaveBeenCalledWith('inspection_date', {
      ascending: false,
      nullsFirst: false,
    });
    expect(responsesQuery.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(peopleQuery.in).toHaveBeenCalledWith('auth_user_id', ['u1', 'u2']);
  });

  it('US 2.0.3: flags a report whose site is deactivated so it is not linked (M25)', async () => {
    const responsesQuery = chainableQuery({
      data: [{ ...reportRows[2], site_id: 7, sites_pa: { id: 7, namesite: 'Elk Island', archived_at: null, is_active: false } }],
      error: null,
    });
    mockFrom.mockReturnValue(responsesQuery);

    const [report] = await getAllSiteReports();

    expect(responsesQuery.select).toHaveBeenCalledWith(expect.stringContaining('is_active'));
    expect(report.siteName).toBe('Elk Island');
    expect(report.siteArchived).toBe(false);
    expect(report.siteInactive).toBe(true);
  });

  it('skips the submitter lookup when no report has a user', async () => {
    const responsesQuery = chainableQuery({
      data: [reportRows[2]],
      error: null,
    });
    mockFrom.mockReturnValue(responsesQuery);

    const reports = await getAllSiteReports();

    expect(reports).toHaveLength(1);
    expect(reports[0].submitterName).toBeNull();
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).not.toHaveBeenCalledWith('people');
  });

  it('returns the database error when the report query fails', async () => {
    mockFrom.mockReturnValue(
      chainableQuery({ data: null, error: { message: 'Reports query failed' } })
    );

    await expect(getAllSiteReports()).rejects.toThrow('Reports query failed');
  });

  it('returns the database error when the submitter lookup fails', async () => {
    const responsesQuery = chainableQuery({ data: [reportRows[0]], error: null });
    const peopleQuery = chainableQuery({
      data: null,
      error: { message: 'People query failed' },
    });
    mockFrom.mockImplementation((table: string) =>
      table === 'form_responses' ? responsesQuery : peopleQuery
    );

    await expect(getAllSiteReports()).rejects.toThrow('People query failed');
  });
});
