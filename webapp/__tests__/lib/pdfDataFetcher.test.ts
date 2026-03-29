import { FormResponse } from '@/utils/supabase/queries';

// Mock all external dependencies before importing
const mockGetSiteByName = jest.fn();
const mockGetFormResponsesBySite = jest.fn();
const mockGetAttachmentsByResponseId = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getSiteByName: (...args: any[]) => mockGetSiteByName(...args),
  getFormResponsesBySite: (...args: any[]) => mockGetFormResponsesBySite(...args),
  getAttachmentsByResponseId: (...args: any[]) => mockGetAttachmentsByResponseId(...args),
}));

const mockSupabaseFrom = jest.fn();
jest.mock('@/utils/supabase/server', () => ({
  createServerSupabase: () => ({
    from: mockSupabaseFrom,
  }),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/signed'),
}));

import { fetchReportData } from '@/lib/pdf/pdfDataFetcher';
import { PdfOptions, PdfRequest } from '@/lib/pdf/types';

const DEFAULT_OPTIONS: PdfOptions = {
  includeImages: false,
  maxImagesPerInspection: 5,
  includeEmptyAnswers: false,
  includeCoverPage: true,
  includeNaturalnessSummary: true,
  selectedSections: 'all',
  sortOrder: 'newest',
  pageSize: 'LETTER',
};

const mockResponses: FormResponse[] = [
  {
    id: 10,
    user_id: 'u1',
    created_at: '2024-01-15T10:00:00Z',
    inspection_no: 'INS-A',
    naturalness_score: '3.0',
    naturalness_details: 'OK',
    steward: 'Alice',
    answers: [
      {
        question_id: 1,
        question_text: 'Trees?',
        obs_value: 'Yes',
        obs_comm: null,
        section_id: 1,
        section_title: 'Flora',
      },
      {
        question_id: 2,
        question_text: 'Notes',
        obs_value: '',
        obs_comm: null,
        section_id: 2,
        section_title: 'General',
      },
    ],
  },
  {
    id: 20,
    user_id: 'u2',
    created_at: '2024-06-15T10:00:00Z',
    inspection_no: 'INS-B',
    naturalness_score: '4.0',
    naturalness_details: null,
    steward: 'Bob',
    answers: [
      {
        question_id: 1,
        question_text: 'Trees?',
        obs_value: 'Abundant',
        obs_comm: 'Lots of birch',
        section_id: 1,
        section_title: 'Flora',
      },
      {
        question_id: 3,
        question_text: 'Birds?',
        obs_value: 'Many',
        obs_comm: null,
        section_id: 3,
        section_title: 'Fauna',
      },
    ],
  },
  {
    id: 30,
    user_id: 'u1',
    created_at: '2023-06-01T10:00:00Z',
    inspection_no: 'INS-C',
    naturalness_score: null,
    naturalness_details: null,
    steward: null,
    answers: [],
  },
];

describe('fetchReportData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSiteByName.mockResolvedValue([
      { namesite: 'Elk Island', county: 'Strathcona' },
    ]);
    mockGetFormResponsesBySite.mockResolvedValue(mockResponses);
    mockGetAttachmentsByResponseId.mockResolvedValue([]);
  });

  // ── Site mode ──

  it('fetches site data for site mode', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: DEFAULT_OPTIONS,
    };

    const result = await fetchReportData(request);

    expect(result.sites).toHaveLength(1);
    expect(result.sites[0].siteName).toBe('Elk Island');
    expect(result.sites[0].county).toBe('Strathcona');
    expect(result.generatedAt).toBeDefined();
    expect(result.options).toBe(DEFAULT_OPTIONS);
  });

  it('throws when site is not found', async () => {
    mockGetSiteByName.mockResolvedValue([]);

    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Nonexistent',
      options: DEFAULT_OPTIONS,
    };

    await expect(fetchReportData(request)).rejects.toThrow('Site not found');
  });

  // ── Sorting ──

  it('sorts responses newest first by default', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, sortOrder: 'newest' },
    };

    const result = await fetchReportData(request);
    const ids = result.sites[0].responses.map((r) => r.id);

    // 2024-06-15 (id=20) > 2024-01-15 (id=10) > 2023-06-01 (id=30)
    expect(ids).toEqual([20, 10, 30]);
  });

  it('sorts responses oldest first', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, sortOrder: 'oldest' },
    };

    const result = await fetchReportData(request);
    const ids = result.sites[0].responses.map((r) => r.id);

    expect(ids).toEqual([30, 10, 20]);
  });

  // ── Date filtering ──

  it('filters by dateFrom', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, dateFrom: '2024-01-01' },
    };

    const result = await fetchReportData(request);
    const ids = result.sites[0].responses.map((r) => r.id);

    // Only 2024 responses
    expect(ids).toContain(10);
    expect(ids).toContain(20);
    expect(ids).not.toContain(30);
  });

  it('filters by dateTo', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, dateTo: '2024-01-31' },
    };

    const result = await fetchReportData(request);
    const ids = result.sites[0].responses.map((r) => r.id);

    // 2023 + Jan 2024 only
    expect(ids).toContain(10);
    expect(ids).toContain(30);
    expect(ids).not.toContain(20);
  });

  it('filters by dateFrom and dateTo together', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: {
        ...DEFAULT_OPTIONS,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      },
    };

    const result = await fetchReportData(request);
    const ids = result.sites[0].responses.map((r) => r.id);

    expect(ids).toEqual([10]);
  });

  // ── Selected response IDs ──

  it('filters by selectedResponseIds', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, selectedResponseIds: [10, 30] },
    };

    const result = await fetchReportData(request);
    const ids = result.sites[0].responses.map((r) => r.id);

    expect(ids).toContain(10);
    expect(ids).toContain(30);
    expect(ids).not.toContain(20);
  });

  // ── Section filtering ──

  it('filters answers by selected sections', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, selectedSections: ['Flora'] },
    };

    const result = await fetchReportData(request);
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;
    const response20 = result.sites[0].responses.find((r) => r.id === 20)!;

    // Only Flora section answers
    expect(response10.answers).toHaveLength(1);
    expect(response10.answers[0].section_title).toBe('Flora');
    expect(response20.answers).toHaveLength(1);
    expect(response20.answers[0].section_title).toBe('Flora');
  });

  it('returns all sections when selectedSections is "all"', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, selectedSections: 'all', includeEmptyAnswers: true },
    };

    const result = await fetchReportData(request);
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;

    expect(response10.answers).toHaveLength(2);
  });

  // ── Empty answers ──

  it('filters empty answers when includeEmptyAnswers is false', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeEmptyAnswers: false },
    };

    const result = await fetchReportData(request);
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;

    // "Notes" question has empty obs_value and null obs_comm - should be filtered
    expect(response10.answers).toHaveLength(1);
    expect(response10.answers[0].question_text).toBe('Trees?');
  });

  it('includes empty answers when includeEmptyAnswers is true', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeEmptyAnswers: true },
    };

    const result = await fetchReportData(request);
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;

    expect(response10.answers).toHaveLength(2);
  });

  // ── Multi-site mode ──

  it('fetches multiple sites for multi-site mode', async () => {
    mockGetSiteByName
      .mockResolvedValueOnce([{ namesite: 'Site A', county: 'County 1' }])
      .mockResolvedValueOnce([{ namesite: 'Site B', county: 'County 2' }]);
    mockGetFormResponsesBySite
      .mockResolvedValueOnce([mockResponses[0]])
      .mockResolvedValueOnce([mockResponses[1]]);

    const request: PdfRequest = {
      mode: 'multi-site',
      siteNames: ['Site A', 'Site B'],
      options: DEFAULT_OPTIONS,
    };

    const result = await fetchReportData(request);

    expect(result.sites).toHaveLength(2);
    expect(result.sites[0].siteName).toBe('Site A');
    expect(result.sites[1].siteName).toBe('Site B');
  });

  // ── Single mode ──

  it('fetches single response data', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn();

    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    // First call: get site_id from response
    mockSingle
      .mockResolvedValueOnce({
        data: { site_id: 99 },
        error: null,
      })
      // Second call: get site info
      .mockResolvedValueOnce({
        data: { namesite: 'Elk Island', W26_ab_counties: { county: 'Strathcona' } },
        error: null,
      });

    mockGetFormResponsesBySite.mockResolvedValue([mockResponses[0]]);

    const request: PdfRequest = {
      mode: 'single',
      responseId: 10,
      options: DEFAULT_OPTIONS,
    };

    const result = await fetchReportData(request);

    expect(result.sites).toHaveLength(1);
    expect(result.sites[0].siteName).toBe('Elk Island');
    expect(result.sites[0].responses).toHaveLength(1);
    expect(result.sites[0].responses[0].id).toBe(10);
  });

  it('throws when single response is not found', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    });

    const request: PdfRequest = {
      mode: 'single',
      responseId: 999,
      options: DEFAULT_OPTIONS,
    };

    await expect(fetchReportData(request)).rejects.toThrow('Response not found');
  });

  // ── Image attachments ──

  it('does not fetch attachments when includeImages is false', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeImages: false },
    };

    await fetchReportData(request);

    expect(mockGetAttachmentsByResponseId).not.toHaveBeenCalled();
  });

  it('fetches attachments when includeImages is true', async () => {
    mockGetAttachmentsByResponseId.mockResolvedValue([
      {
        id: 1,
        filename: 'photo.jpg',
        content_type: 'image/jpeg',
        storage_key: 'uploads/photo.jpg',
        caption: 'A tree',
        description: null,
      },
    ]);

    // Mock fetch for image buffer (JPEG header) - use clean ArrayBuffer
    const jpegAb = new ArrayBuffer(6);
    new Uint8Array(jpegAb).set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(jpegAb),
    });

    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeImages: true },
    };

    const result = await fetchReportData(request);

    expect(mockGetAttachmentsByResponseId).toHaveBeenCalled();
    // Check that at least one site has attachments
    const site = result.sites[0];
    expect(site.attachmentsByResponse).toBeDefined();
  });

  it('limits images per inspection to maxImagesPerInspection', async () => {
    const manyAttachments = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      filename: `photo${i}.jpg`,
      content_type: 'image/jpeg',
      storage_key: `uploads/photo${i}.jpg`,
      caption: null,
      description: null,
    }));
    mockGetAttachmentsByResponseId.mockResolvedValue(manyAttachments);

    const jpegAb = new ArrayBuffer(4);
    new Uint8Array(jpegAb).set([0xff, 0xd8, 0xff, 0xe0]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(jpegAb),
    });

    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeImages: true, maxImagesPerInspection: 3 },
    };

    const result = await fetchReportData(request);

    // Each response should have at most 3 attachments
    for (const [, atts] of result.sites[0].attachmentsByResponse ?? []) {
      expect(atts.length).toBeLessThanOrEqual(3);
    }
  });

  it('skips unsupported image formats (webp)', async () => {
    mockGetAttachmentsByResponseId.mockResolvedValue([
      {
        id: 1,
        filename: 'photo.webp',
        content_type: 'image/webp',
        storage_key: 'uploads/photo.webp',
        caption: null,
        description: null,
      },
    ]);

    // WebP magic bytes: RIFF....WEBP - use clean ArrayBuffer
    const webpAb = new ArrayBuffer(12);
    new Uint8Array(webpAb).set([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(webpAb),
    });

    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeImages: true },
    };

    const result = await fetchReportData(request);

    // Attachment should exist but without image buffer (webp unsupported)
    const site = result.sites[0];
    if (site.attachmentsByResponse) {
      for (const [, atts] of site.attachmentsByResponse) {
        for (const att of atts) {
          expect(att.imageBuffer).toBeUndefined();
        }
      }
    }
  });

  it('detects PNG format from buffer bytes', async () => {
    mockGetAttachmentsByResponseId.mockResolvedValue([
      {
        id: 1,
        filename: 'photo.png',
        content_type: 'image/png',
        storage_key: 'uploads/photo.png',
        caption: null,
        description: null,
      },
    ]);

    // PNG magic bytes - use clean ArrayBuffer
    const pngAb = new ArrayBuffer(8);
    new Uint8Array(pngAb).set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(pngAb),
    });

    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeImages: true },
    };

    const result = await fetchReportData(request);

    const site = result.sites[0];
    if (site.attachmentsByResponse) {
      for (const [, atts] of site.attachmentsByResponse) {
        for (const att of atts) {
          expect(att.contentType).toBe('image/png');
          expect(att.imageBuffer).toBeDefined();
        }
      }
    }
  });
});
