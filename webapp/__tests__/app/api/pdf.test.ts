import { POST } from '@/app/api/pdf/route';
import { createClient } from '@/utils/supabase/server';
import { processPdfJob } from '@/lib/pdf/processPdfJob';
import { NextRequest } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
  after: jest.fn((cb: () => void) => cb()), // run immediately in tests
}));

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/pdf/processPdfJob', () => ({
  processPdfJob: jest.fn(),
}));

function makeRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('POST /api/pdf', () => {
  const mockGetUser = jest.fn();
  const mockSingle = jest.fn();
  const mockSelect = jest.fn(() => ({ single: mockSingle }));
  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockFrom = jest.fn(() => ({ insert: mockInsert }));

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    });

    mockSingle.mockResolvedValue({
      data: { id: 'job-123' },
      error: null,
    });

    (processPdfJob as jest.Mock).mockResolvedValue(undefined);
  });

  // ── Auth Tests ──

  it('returns 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Test' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 if auth throws an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth failed' },
    });

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Test' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 if user is not admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'user' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Test' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toMatch(/admin/i);
  });

  // ── Request Validation Tests (unchanged — parseRequest logic didn't change) ──

  it('returns 500 if request body has no mode', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/mode/i);
  });

  it('returns 500 for single mode without responseId', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'single' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/responseId/i);
  });

  it('returns 500 for site mode without siteName', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'site' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/siteName/i);
  });

  it('returns 500 for multi-site mode without siteNames', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'multi-site' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/siteNames/i);
  });

  it('returns 500 for multi-site mode with empty siteNames array', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'multi-site', siteNames: [] }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/siteNames/i);
  });

  it('returns 500 for invalid mode', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'invalid' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/invalid mode/i);
  });

  // ── Job Creation Tests (replaces the old "returns PDF" tests) ──

  it('creates a job and returns 202 with jobId for valid single mode request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'single', responseId: 42 }));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toEqual({ jobId: 'job-123' });
    expect(mockFrom).toHaveBeenCalledWith('S26_pdf_jobs');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        mode: 'single',
        created_by: 'u1',
        request_payload: expect.objectContaining({ mode: 'single', responseId: 42 }),
      })
    );
  });

  it('creates a job for valid site mode request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Elk Island' }));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toEqual({ jobId: 'job-123' });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'site',
        request_payload: expect.objectContaining({ siteName: 'Elk Island' }),
      })
    );
  });

  it('creates a job for valid multi-site mode request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(
      makeRequest({ mode: 'multi-site', siteNames: ['Site A', 'Site B'] })
    );
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toEqual({ jobId: 'job-123' });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'multi-site',
        request_payload: expect.objectContaining({ siteNames: ['Site A', 'Site B'] }),
      })
    );
  });

  it('kicks off processPdfJob with the created jobId', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    await POST(makeRequest({ mode: 'site', siteName: 'Elk Island' }));

    expect(processPdfJob).toHaveBeenCalledWith('job-123');
  });

  // ── Options Validation Tests (unchanged logic, still checked via request_payload) ──

  it('applies default options when none provided', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    await POST(makeRequest({ mode: 'site', siteName: 'Test' }));

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        request_payload: expect.objectContaining({
          options: expect.objectContaining({
            includeImages: false,
            includeCoverPage: true,
            includeNaturalnessSummary: true,
            sortOrder: 'newest',
            pageSize: 'LETTER',
            maxImagesPerInspection: 5,
          }),
        }),
      })
    );
  });

  it('clamps invalid maxImagesPerInspection to default', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    await POST(
      makeRequest({
        mode: 'site',
        siteName: 'Test',
        options: { maxImagesPerInspection: 999 },
      })
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        request_payload: expect.objectContaining({
          options: expect.objectContaining({ maxImagesPerInspection: 5 }),
        }),
      })
    );
  });

  it('resets invalid pageSize to LETTER', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    await POST(
      makeRequest({
        mode: 'site',
        siteName: 'Test',
        options: { pageSize: 'LEGAL' },
      })
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        request_payload: expect.objectContaining({
          options: expect.objectContaining({ pageSize: 'LETTER' }),
        }),
      })
    );
  });

  it('resets invalid sortOrder to newest', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    await POST(
      makeRequest({
        mode: 'site',
        siteName: 'Test',
        options: { sortOrder: 'random' },
      })
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        request_payload: expect.objectContaining({
          options: expect.objectContaining({ sortOrder: 'newest' }),
        }),
      })
    );
  });

  it('merges user options with defaults', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    await POST(
      makeRequest({
        mode: 'site',
        siteName: 'Test',
        options: {
          includeImages: true,
          pageSize: 'A4',
          sortOrder: 'oldest',
          includeEmptyAnswers: true,
        },
      })
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        request_payload: expect.objectContaining({
          options: expect.objectContaining({
            includeImages: true,
            pageSize: 'A4',
            sortOrder: 'oldest',
            includeEmptyAnswers: true,
            includeCoverPage: true,
            includeNaturalnessSummary: true,
          }),
        }),
      })
    );
  });

  // ── Error Handling ──

  it('returns 500 when job insert fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Test' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/failed to create export job/i);
  });
});