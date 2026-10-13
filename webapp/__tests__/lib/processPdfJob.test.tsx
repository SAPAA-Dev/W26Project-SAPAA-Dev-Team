import { processPdfJob } from '@/lib/pdf/processPdfJob';
import { renderToBuffer } from '@react-pdf/renderer';
import { fetchReportData } from '@/lib/pdf/pdfDataFetcher';

const mockFrom = jest.fn();
jest.mock('@/utils/supabase/server', () => ({
  createServerSupabase: () => ({ from: mockFrom }),
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

const mockS3Send = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe('processPdfJob', () => {
  const mockSelect = jest.fn();
  const mockUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: mockSelect,
        }),
      }),
      update: (fields: unknown) => {
        mockUpdate(fields);
        return { eq: jest.fn().mockResolvedValue({ error: null }) };
      },
    });

    mockSelect.mockResolvedValue({
      data: {
        id: 'job-123',
        created_by: 'user-1',
        request_payload: { mode: 'site', siteName: 'Elk Island', options: {} },
      },
      error: null,
    });

    (fetchReportData as jest.Mock).mockResolvedValue({
      sites: [],
      generatedAt: new Date().toISOString(),
      options: {},
    });
    (renderToBuffer as jest.Mock).mockResolvedValue(Buffer.from('fake-pdf'));
    mockS3Send.mockResolvedValue({});
  });

  it('marks the job processing, then complete, on success', async () => {
    await processPdfJob('job-123');

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' });
    expect(mockS3Send).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'complete', storage_path: expect.any(String) })
    );
  });

  it('throws and marks the job failed if fetchReportData throws', async () => {
    (fetchReportData as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(processPdfJob('job-123')).rejects.toThrow('DB error');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error: 'DB error' })
    );
  });

  it('throws and marks the job failed if S3 upload fails', async () => {
    mockS3Send.mockRejectedValue(new Error('S3 upload failed'));

    await expect(processPdfJob('job-123')).rejects.toThrow('S3 upload failed');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error: 'S3 upload failed' })
    );
  });

  it('US 7.0.6 AT4: a failed export of 51 reports only marks its job failed', async () => {
    const responses = Array.from({ length: 51 }, (_, i) => ({ id: i + 1, answers: [] }));
    (fetchReportData as jest.Mock).mockResolvedValue({
      sites: [{ siteName: 'Elk Island', county: null, responses }],
      generatedAt: new Date().toISOString(),
      options: {},
    });
    (renderToBuffer as jest.Mock).mockRejectedValue(new Error('Render failed'));

    await expect(processPdfJob('job-123')).rejects.toThrow('Render failed');

    expect(mockUpdate).toHaveBeenLastCalledWith({ status: 'failed', error: 'Render failed' });
    expect(mockS3Send).not.toHaveBeenCalled();
    // Only the job row is written; no stored report is touched.
    expect(new Set(mockFrom.mock.calls.map(([table]) => table))).toEqual(new Set(['S26_pdf_jobs']));
  });

  it('throws if the job itself is not found', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(processPdfJob('missing-job')).rejects.toThrow('Job not found');
  });
});