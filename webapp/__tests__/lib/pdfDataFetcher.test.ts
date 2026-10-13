import { FormResponse } from '@/utils/supabase/queries';

// Mock all external dependencies before importing
const mockGetSiteByName = jest.fn();
const mockGetFormResponsesBySite = jest.fn();
const mockGetAttachmentsByResponseId = jest.fn();
const mockGetSitesByNames = jest.fn();
const mockGetFormResponsesForSiteIds = jest.fn();
const mockGetAttachmentsForResponseIds = jest.fn();
const mockGetReportQuestionKeyMap = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getSiteByName: (...args: unknown[]) => mockGetSiteByName(...args),
  getFormResponsesBySite: (...args: unknown[]) => mockGetFormResponsesBySite(...args),
}));

jest.mock('@/lib/pdf/reportQueries', () => ({
  getAttachmentsByResponseId: (...args: unknown[]) => mockGetAttachmentsByResponseId(...args),
  getSitesByNames: (...args: unknown[]) => mockGetSitesByNames(...args),
  getFormResponsesForSiteIds: (...args: unknown[]) => mockGetFormResponsesForSiteIds(...args),
  getAttachmentsForResponseIds: (...args: unknown[]) => mockGetAttachmentsForResponseIds(...args),
  getReportQuestionKeyMap: (...args: unknown[]) => mockGetReportQuestionKeyMap(...args),
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
  hiddenQuestionIds: [],
  sortOrder: 'newest',
  pageSize: 'LETTER',
};

const mockResponses: FormResponse[] = [
  {
    id: 10,
    user_id: 'u1',
    created_at: '2024-01-15T10:00:00Z',
    inspection_date: '2024-01-15',
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
    inspection_date: '2024-06-15',
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
    inspection_date: '2023-06-01',
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
    mockGetReportQuestionKeyMap.mockResolvedValue({
      Q31_Naturalness: 1,
      Q32_Natural_Comm: 2,
      Q13_FirstandLastNameForGuests: 3,
    });
    mockGetAttachmentsForResponseIds.mockResolvedValue([]);
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

  it('returns all sections when selectedSections is "all" (7.0.7 AT5)', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, selectedSections: 'all', includeEmptyAnswers: true },
    };

    const result = await fetchReportData(request);
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;

    expect(response10.answers).toHaveLength(2);
  });

  it('omits a hidden question and keeps the other answers (7.0.7 AT2)', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, hiddenQuestionIds: [1], includeEmptyAnswers: true },
    };

    const result = await fetchReportData(request);
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;
    const response20 = result.sites[0].responses.find((r) => r.id === 20)!;

    expect(response10.answers.map((answer) => answer.question_id)).toEqual([2]);
    expect(response20.answers.map((answer) => answer.question_id)).toEqual([3]);
  });

  it('leaves the stored answers unchanged after an export with hidden fields (7.0.7 AT3)', async () => {
    const storedQuestionIds = mockResponses.map((r) => r.answers.map((a) => a.question_id));

    await fetchReportData({
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, hiddenQuestionIds: [1], includeEmptyAnswers: true },
    });

    // The export reads only: no write to the database, and the loaded reports keep every answer
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
    expect(mockResponses.map((r) => r.answers.map((a) => a.question_id))).toEqual(storedQuestionIds);

    const after = await fetchReportData({
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeEmptyAnswers: true },
    });
    const response10 = after.sites[0].responses.find((r) => r.id === 10)!;
    expect(response10.answers.map((answer) => answer.question_id)).toEqual([1, 2]);
  });

  it('exports the full SIR when no fields are hidden (7.0.7 AT5, 7.0.6 AT2)', async () => {
    const request: PdfRequest = {
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, hiddenQuestionIds: [], includeEmptyAnswers: true },
    };

    const result = await fetchReportData(request);

    for (const stored of mockResponses) {
      const exported = result.sites[0].responses.find((r) => r.id === stored.id)!;
      expect(exported.answers).toEqual(stored.answers);
    }
  });

  // The key map in beforeEach: Q31 naturalness = 1, Q32 details = 2, Q13 steward/guest name = 3.
  const siteRequest = (hiddenQuestionIds: number[]): PdfRequest => ({
    mode: 'site',
    siteName: 'Elk Island',
    options: { ...DEFAULT_OPTIONS, hiddenQuestionIds },
  });

  it('US 7.0.7 AT2: hides the naturalness score when its question is hidden', async () => {
    const result = await fetchReportData(siteRequest([1]));
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;

    expect(response10.naturalness_score).toBeNull();
    expect(response10.naturalness_details).toBe('OK');
    expect(response10.steward).toBe('Alice');
  });

  it('US 7.0.7 AT2: hides the naturalness details when their question is hidden', async () => {
    const result = await fetchReportData(siteRequest([2]));
    const response10 = result.sites[0].responses.find((r) => r.id === 10)!;

    expect(response10.naturalness_details).toBeNull();
    expect(response10.naturalness_score).toBe('3.0');
  });

  it('US 7.0.7 AT2: hides the steward/guest name when its question is hidden', async () => {
    const result = await fetchReportData(siteRequest([3]));

    expect(result.sites[0].responses.map((r) => r.steward)).toEqual([null, null, null]);
    expect(result.sites[0].responses.find((r) => r.id === 10)!.naturalness_score).toBe('3.0');
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
    mockGetSitesByNames.mockResolvedValue([
      { id: 1, namesite: 'Site A', ab_county: null, ab_counties: { county: 'County 1' } },
      { id: 2, namesite: 'Site B', ab_county: null, ab_counties: { county: 'County 2' } },
    ]);

    const bySite = new Map();
    bySite.set(1, [mockResponses[0]]);
    bySite.set(2, [mockResponses[1]]);
    mockGetFormResponsesForSiteIds.mockResolvedValue(bySite);

    const request: PdfRequest = {
      mode: 'multi-site',
      siteNames: ['Site A', 'Site B'],
      options: DEFAULT_OPTIONS,
    };

    const result = await fetchReportData(request);

    expect(result.sites).toHaveLength(2);
    expect(result.sites[0].siteName).toBe('Site A');
    expect(result.sites[0].county).toBe('County 1');
    expect(result.sites[1].siteName).toBe('Site B');
    expect(result.sites[1].county).toBe('County 2');
  });

  // ── More than 50 reports (US 7.0.6) ──

  const manyResponses = (count: number, idBase = 1000): FormResponse[] =>
    Array.from({ length: count }, (_, i) => ({
      ...mockResponses[0],
      id: idBase + i,
      created_at: new Date(Date.UTC(2024, 0, 1 + i)).toISOString(),
    }));

  it('US 7.0.6 AT1: a site export of 60 selected reports contains each one', async () => {
    const reports = manyResponses(60);
    mockGetFormResponsesBySite.mockResolvedValue(reports);

    const result = await fetchReportData({
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, selectedResponseIds: reports.map((r) => r.id) },
    });

    expect(result.sites[0].responses).toHaveLength(60);
    expect(new Set(result.sites[0].responses.map((r) => r.id))).toEqual(new Set(reports.map((r) => r.id)));
  });

  it('US 7.0.6 AT1: a multi-site export of 51 reports over 3 sites contains each one', async () => {
    mockGetSitesByNames.mockResolvedValue([
      { id: 1, namesite: 'Site A', ab_county: null, ab_counties: null },
      { id: 2, namesite: 'Site B', ab_county: null, ab_counties: null },
      { id: 3, namesite: 'Site C', ab_county: null, ab_counties: null },
    ]);
    mockGetFormResponsesForSiteIds.mockResolvedValue(
      new Map([
        [1, manyResponses(17, 1000)],
        [2, manyResponses(17, 2000)],
        [3, manyResponses(17, 3000)],
      ])
    );

    const result = await fetchReportData({
      mode: 'multi-site',
      siteNames: ['Site A', 'Site B', 'Site C'],
      options: DEFAULT_OPTIONS,
    });

    expect(result.sites.flatMap((site) => site.responses)).toHaveLength(51);
    expect(result.sites.map((site) => site.responses.length)).toEqual([17, 17, 17]);
  });

  it('US 7.0.6 AT1: a multi-site export fails, with no partial data, when the report query fails mid-way', async () => {
    mockGetSitesByNames.mockResolvedValue([{ id: 1, namesite: 'Site A', ab_county: null, ab_counties: null }]);
    mockGetFormResponsesForSiteIds.mockRejectedValue(new Error('canceling statement due to statement timeout'));

    await expect(
      fetchReportData({ mode: 'multi-site', siteNames: ['Site A'], options: { ...DEFAULT_OPTIONS, includeImages: true } })
    ).rejects.toThrow('canceling statement due to statement timeout');
    expect(mockGetAttachmentsForResponseIds).not.toHaveBeenCalled();
  });

  it('US 7.0.6 AT1: a multi-site export fails instead of leaving out photos when the photo query fails', async () => {
    mockGetSitesByNames.mockResolvedValue([{ id: 1, namesite: 'Site A', ab_county: null, ab_counties: null }]);
    mockGetFormResponsesForSiteIds.mockResolvedValue(new Map([[1, manyResponses(51)]]));
    mockGetAttachmentsForResponseIds.mockRejectedValue(new Error('Failed to fetch attachments'));

    await expect(
      fetchReportData({ mode: 'multi-site', siteNames: ['Site A'], options: { ...DEFAULT_OPTIONS, includeImages: true } })
    ).rejects.toThrow('Failed to fetch attachments');
  });

  it('US 7.0.6 AT2: a site export fails instead of giving reports without their answers when the report query fails', async () => {
    mockGetFormResponsesBySite.mockRejectedValue(new Error('Failed to fetch form responses'));

    await expect(
      fetchReportData({ mode: 'site', siteName: 'Elk Island', options: DEFAULT_OPTIONS })
    ).rejects.toThrow('Failed to fetch form responses');
    expect(mockGetAttachmentsByResponseId).not.toHaveBeenCalled();
  });

  it('throws when no sites match in multi-site mode', async () => {
    mockGetSitesByNames.mockResolvedValue([]);

    const request: PdfRequest = {
      mode: 'multi-site',
      siteNames: ['Nonexistent'],
      options: DEFAULT_OPTIONS,
    };

    await expect(fetchReportData(request)).rejects.toThrow('No matching sites found');
  });

  // ── Single mode ──

  it('fetches single response data', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockIs = jest.fn().mockReturnThis();
    const mockSingle = jest.fn();

    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
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
        data: { namesite: 'Elk Island', ab_counties: { county: 'Strathcona' } },
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
    expect(mockIs).toHaveBeenCalledWith('archived_at', null);
  });

  it('US 7.0.1 AT3: includes every photo in a single SIR export, past the bulk cap', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValueOnce({ data: { site_id: 99 }, error: null })
        .mockResolvedValueOnce({ data: { namesite: 'Elk Island', ab_counties: null }, error: null }),
    });
    mockGetFormResponsesBySite.mockResolvedValue([mockResponses[0]]);
    mockGetAttachmentsByResponseId.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({
        id: i, question_id: null, filename: `p${i}.jpg`, content_type: 'image/jpeg',
        storage_key: `k${i}`, caption: null, identifier: null,
      }))
    );
    const jpegAb = new ArrayBuffer(4);
    new Uint8Array(jpegAb).set([0xff, 0xd8, 0xff, 0xe0]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(jpegAb) });

    const result = await fetchReportData({
      mode: 'single',
      responseId: 10,
      options: { ...DEFAULT_OPTIONS, includeImages: true, maxImagesPerInspection: 20 },
    });

    expect(result.sites[0].attachmentsByResponse!.get(10)).toHaveLength(25);
  });

  it('throws when single response is not found', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
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

  it('US 7.0.7 AT2: leaves out photos attached to a hidden question', async () => {
    const rows = [
      { id: 1, response_id: 10, question_id: 7, filename: 'shown.jpg', content_type: 'image/jpeg', storage_key: 'a', caption: null, identifier: null },
      { id: 2, response_id: 10, question_id: 8, filename: 'hidden.jpg', content_type: 'image/jpeg', storage_key: 'b', caption: null, identifier: null },
    ];
    mockGetAttachmentsByResponseId.mockResolvedValue(rows);
    mockGetAttachmentsForResponseIds.mockResolvedValue(rows);
    mockGetSitesByNames.mockResolvedValue([
      { id: 1, namesite: 'Site A', ab_county: null, ab_counties: null },
    ]);
    mockGetFormResponsesForSiteIds.mockResolvedValue(new Map([[1, [mockResponses[0]]]]));

    const jpegAb = new ArrayBuffer(4);
    new Uint8Array(jpegAb).set([0xff, 0xd8, 0xff, 0xe0]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(jpegAb) });

    const options = { ...DEFAULT_OPTIONS, includeImages: true, hiddenQuestionIds: [8] };
    const site = await fetchReportData({ mode: 'site', siteName: 'Elk Island', options });
    const multi = await fetchReportData({ mode: 'multi-site', siteNames: ['Site A'], options });

    for (const result of [site, multi]) {
      const files = result.sites[0].attachmentsByResponse!.get(10)!.map((a) => a.filename);
      expect(files).toEqual(['shown.jpg']);
    }
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

  it('US 7.0.1 AT3: converts a WebP photo to JPEG so the PDF can draw it', async () => {
    const sharp = (await import('sharp')).default;
    const webp = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#356B43' },
    }).webp().toBuffer();
    const webpAb = new ArrayBuffer(webp.length);
    new Uint8Array(webpAb).set(webp);
    mockGetAttachmentsByResponseId.mockResolvedValue([
      { id: 1, question_id: null, filename: 'photo.webp', content_type: 'image/webp', storage_key: 'uploads/photo.webp', caption: null, identifier: null },
    ]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(webpAb) });

    const result = await fetchReportData({
      mode: 'site',
      siteName: 'Elk Island',
      options: { ...DEFAULT_OPTIONS, includeImages: true, selectedResponseIds: [10] },
    });

    const [att] = result.sites[0].attachmentsByResponse!.get(10)!;
    expect(att.contentType).toBe('image/jpeg');
    expect([...att.imageBuffer!.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  });

  it('skips a WebP photo that cannot be converted', async () => {
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

    // Only a WebP header, so conversion fails: the attachment stays without image data
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
