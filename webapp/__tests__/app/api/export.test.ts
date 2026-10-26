/** @jest-environment node */
const mockAfter = jest.fn((callback: () => void) => callback());
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ status: init?.status ?? 200, json: async () => body })),
  },
  after: (callback: () => void) => mockAfter(callback),
}));

import { POST } from '@/app/api/export/route';
import { GET } from '@/app/api/export/status/[jobId]/route';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { processExportJob } from '@/lib/export/processExportJob';

jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn(), createServerSupabase: jest.fn() }));
jest.mock('@/lib/export/processExportJob', () => ({ processExportJob: jest.fn() }));
jest.mock('@/lib/s3/client', () => ({ s3Client: {} }));
jest.mock('@aws-sdk/client-s3', () => ({ GetObjectCommand: jest.fn((input) => ({ input })) }));
const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args) }));

const ADMIN = { id: 'admin-1', app_metadata: { role: 'admin', authenticated: true } };
const STEWARD = { id: 'steward-1', app_metadata: { role: 'steward', authenticated: true } };

// Every method returns the builder; awaiting it gives `result`.
function builder(result: unknown) {
  const b: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const m of ['select', 'eq', 'in', 'gte', 'limit', 'insert', 'single', 'maybeSingle']) b[m] = jest.fn(() => b);
  b.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return b;
}

function signIn(user: unknown) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
  });
}

describe('POST /api/export (3.0.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (processExportJob as jest.Mock).mockResolvedValue(undefined);
  });

  it('answers 401 when nobody is signed in', async () => {
    signIn(null);
    expect((await POST()).status).toBe(401);
    expect(createServerSupabase).not.toHaveBeenCalled();
  });

  it.each([
    ['a steward', STEWARD],
    ['an admin whose approval was revoked', { ...ADMIN, app_metadata: { role: 'admin', authenticated: false } }],
  ])('answers 403 for %s and makes no job', async (_name, user) => {
    signIn(user);
    expect((await POST()).status).toBe(403);
    expect(createServerSupabase).not.toHaveBeenCalled();
    expect(processExportJob).not.toHaveBeenCalled();
  });

  it('makes a job for an admin, answers 202 and starts the zip job', async () => {
    signIn(ADMIN);
    const running = builder({ data: [], error: null });
    const insert = builder({ data: { id: 'job-1' }, error: null });
    const from = jest.fn().mockReturnValueOnce(running).mockReturnValueOnce(insert);
    (createServerSupabase as jest.Mock).mockReturnValue({ from });

    const response = await POST();

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ jobId: 'job-1' });
    expect(insert.insert).toHaveBeenCalledWith({ created_by: 'admin-1', status: 'pending' });
    expect(processExportJob).toHaveBeenCalledWith('job-1');
  });

  it('answers 409 and starts nothing while an export of this admin is running', async () => {
    signIn(ADMIN);
    const from = jest.fn().mockReturnValueOnce(builder({ data: [{ id: 'job-0' }], error: null }));
    (createServerSupabase as jest.Mock).mockReturnValue({ from });

    const response = await POST();

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'An export is already running.', jobId: 'job-0' });
    expect(from).toHaveBeenCalledTimes(1);
    expect(processExportJob).not.toHaveBeenCalled();
  });

  it('answers 500 when the job row cannot be saved', async () => {
    signIn(ADMIN);
    const from = jest.fn()
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: { message: 'boom' } }));
    (createServerSupabase as jest.Mock).mockReturnValue({ from });

    expect((await POST()).status).toBe(500);
    expect(processExportJob).not.toHaveBeenCalled();
  });
});

describe('GET /api/export/status/[jobId] (3.0.3)', () => {
  const params = (jobId: string) => ({ params: Promise.resolve({ jobId }) });

  function jobRow(row: unknown) {
    (createServerSupabase as jest.Mock).mockReturnValue({ from: jest.fn(() => builder({ data: row, error: null })) });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSignedUrl.mockResolvedValue('https://s3.example.com/zip');
  });

  it('answers 401 when nobody is signed in', async () => {
    signIn(null);
    expect((await GET({} as Request, params('job-1'))).status).toBe(401);
  });

  it('answers 404 for a job that does not exist', async () => {
    signIn(ADMIN);
    jobRow(null);
    expect((await GET({} as Request, params('job-1'))).status).toBe(404);
  });

  it('answers 403 with no status and no link for someone who is not an admin and did not start the job', async () => {
    signIn(STEWARD);
    jobRow({ status: 'complete', storage_path: 'exports/x.zip', error: null, created_by: 'admin-1' });

    const response = await GET({} as Request, params('job-1'));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('gives an admin a download link for a finished job', async () => {
    signIn({ ...ADMIN, id: 'admin-2' });
    jobRow({ status: 'complete', storage_path: 'exports/x.zip', error: null, created_by: 'admin-1' });

    const body = await (await GET({} as Request, params('job-1'))).json();

    expect(body).toEqual({ status: 'complete', downloadUrl: 'https://s3.example.com/zip' });
  });

  it('lets the creator read the job even if the role changed since', async () => {
    signIn({ ...STEWARD, id: 'admin-1' });
    jobRow({ status: 'processing', storage_path: null, error: null, created_by: 'admin-1' });

    expect(await (await GET({} as Request, params('job-1'))).json()).toEqual({ status: 'processing', error: null });
  });

  it('shows the reason when the job failed, with no link', async () => {
    signIn(ADMIN);
    jobRow({ status: 'failed', storage_path: null, error: 'These files could not be read: images/a.jpg.', created_by: 'admin-1' });

    expect(await (await GET({} as Request, params('job-1'))).json()).toEqual({
      status: 'failed',
      error: 'These files could not be read: images/a.jpg.',
    });
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });
});
