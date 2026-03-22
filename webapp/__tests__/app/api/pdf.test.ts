jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn(),
}));

jest.mock('@/lib/pdf/inspectionReport', () => ({
  InspectionReportDocument: jest.fn(),
}));

jest.mock('@/lib/pdf/pdfDataFetcher', () => ({
  fetchReportData: jest.fn(),
}));

import { POST } from '@/app/api/pdf/route';
import { createClient } from '@/utils/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { fetchReportData } from '@/lib/pdf/pdfDataFetcher';
import { NextRequest } from 'next/server';

function makeRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('POST /api/pdf', () => {
  const mockGetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockGetUser },
    });

    (renderToBuffer as jest.Mock).mockResolvedValue(Buffer.from('fake-pdf'));
    (fetchReportData as jest.Mock).mockResolvedValue({
      sites: [],
      generatedAt: new Date().toISOString(),
      options: {},
    });
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

  // ── Request Validation Tests ──

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

  // ── Success Tests ──

  it('returns PDF for valid single mode request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'single', responseId: 42 }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('SAPAA_Inspection_42');
    expect(fetchReportData).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'single', responseId: 42 })
    );
  });

  it('returns PDF for valid site mode request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Elk Island' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('SAPAA_Elk_Island');
    expect(fetchReportData).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'site', siteName: 'Elk Island' })
    );
  });

  it('returns PDF for valid multi-site mode request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(
      makeRequest({ mode: 'multi-site', siteNames: ['Site A', 'Site B'] })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('SAPAA_MultiSite_Report');
  });

  // ── Options Validation Tests ──

  it('applies default options when none provided', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });

    await POST(makeRequest({ mode: 'site', siteName: 'Test' }));

    expect(fetchReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          includeImages: false,
          includeCoverPage: true,
          includeNaturalnessSummary: true,
          sortOrder: 'newest',
          pageSize: 'LETTER',
          maxImagesPerInspection: 5,
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

    expect(fetchReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ maxImagesPerInspection: 5 }),
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

    expect(fetchReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ pageSize: 'LETTER' }),
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

    expect(fetchReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ sortOrder: 'newest' }),
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

    expect(fetchReportData).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          includeImages: true,
          pageSize: 'A4',
          sortOrder: 'oldest',
          includeEmptyAnswers: true,
          // defaults preserved
          includeCoverPage: true,
          includeNaturalnessSummary: true,
        }),
      })
    );
  });

  // ── Error Handling ──

  it('returns 500 when fetchReportData throws', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });
    (fetchReportData as jest.Mock).mockRejectedValue(new Error('Site not found'));

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Missing' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Site not found');
  });

  it('returns 500 when renderToBuffer throws', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', user_metadata: { role: 'admin' } } },
      error: null,
    });
    (renderToBuffer as jest.Mock).mockRejectedValue(new Error('Render failed'));

    const res = await POST(makeRequest({ mode: 'site', siteName: 'Test' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Render failed');
  });
});
