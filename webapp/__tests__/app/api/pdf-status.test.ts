import { GET } from '@/app/api/pdf/status/[jobId]/route';
import { createClient } from '@/utils/supabase/server';

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

const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: any[]) => mockGetSignedUrl(...args),
}));

function makeParams(jobId: string) {
  return { params: Promise.resolve({ jobId }) };
}

describe('GET /api/pdf/status/[jobId]', () => {
  const mockGetUser = jest.fn();
  const mockSingle = jest.fn();
  const mockEq = jest.fn(() => ({ single: mockSingle }));
  const mockSelect = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    });

    mockGetSignedUrl.mockResolvedValue('https://s3.example.com/signed-download-url');
  });

  it('returns 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET({} as Request, makeParams('job-1'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 if the job does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await GET({} as Request, makeParams('missing-job'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'Job not found' });
  });

  it('returns a signed download URL when job is complete', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({
      data: { status: 'complete', storage_path: 'pdf-exports/u1/job-1/report.pdf', error: null },
      error: null,
    });

    const res = await GET({} as Request, makeParams('job-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      status: 'complete',
      downloadUrl: 'https://s3.example.com/signed-download-url',
    });
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({ Key: 'pdf-exports/u1/job-1/report.pdf' }),
      }),
      { expiresIn: 3600 }
    );
  });

  it('returns status without a download URL when job is pending', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({
      data: { status: 'pending', storage_path: null, error: null },
      error: null,
    });

    const res = await GET({} as Request, makeParams('job-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'pending', error: null });
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('returns status without a download URL when job is processing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({
      data: { status: 'processing', storage_path: null, error: null },
      error: null,
    });

    const res = await GET({} as Request, makeParams('job-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'processing', error: null });
  });

  it('returns the error message when job has failed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({
      data: { status: 'failed', storage_path: null, error: 'Render failed' },
      error: null,
    });

    const res = await GET({} as Request, makeParams('job-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'failed', error: 'Render failed' });
  });

  it('does not attempt to sign a URL if status is complete but storage_path is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({
      data: { status: 'complete', storage_path: null, error: null },
      error: null,
    });

    const res = await GET({} as Request, makeParams('job-1'));
    const body = await res.json();

    expect(mockGetSignedUrl).not.toHaveBeenCalled();
    expect(body).toEqual({ status: 'complete', error: null });
  });
});