const mockCreateClient = jest.fn();
const mockDownload = jest.fn();
const mockRemove = jest.fn();
const mockList = jest.fn();
const mockUpsert = jest.fn();
const mockFrom = jest.fn(() => ({ upsert: mockUpsert }));
const mockParseProtectedAreaFile = jest.fn();

const mockServiceClient = {
  storage: {
    from: () => ({ download: mockDownload, remove: mockRemove, list: mockList }),
  },
  from: mockFrom,
};

jest.mock('../../utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
  createServerSupabase: () => mockServiceClient,
}));

jest.mock('../../lib/map/kmlImport', () => {
  class KmlImportError extends Error {
    readonly code: string;

    constructor(message: string, code: string) {
      super(message);
      this.name = 'KmlImportError';
      this.code = code;
    }
  }

  return {
    KmlImportError,
    parseProtectedAreaFile: (...args: unknown[]) => mockParseProtectedAreaFile(...args),
  };
});

import { KmlImportError } from '../../lib/map/kmlImport';

import { importProtectedAreasFromStorage } from '../../utils/kml-import-actions';

const VALID_PATH = 'kml-imports/0f8f8f8f-1111-2222-3333-444455556666/SAPAA-Map.kmz';

function mockCaller(role: string | null, authenticated = true) {
  const user =
    role === null
      ? null
      : { id: 'caller-id', app_metadata: { role, authenticated } };
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  });
}

function record(index: number) {
  return {
    folder: 'Natural Areas',
    fid: index,
    name: `Area ${index}`,
    area_type: 'NA',
    subtype: null,
    status: null,
    source: null,
    iucn: null,
    oc_no: null,
    oc_name: null,
    acres: null,
    hectares: null,
    area_ha: null,
    oc_date: null,
    date_est: null,
    date_res: null,
    notes: null,
    geometry: { type: 'MultiPolygon', coordinates: [] },
  };
}

function mockParse(count: number, warnings: string[] = []) {
  mockParseProtectedAreaFile.mockReturnValue({
    records: Array.from({ length: count }, (_, index) => record(index)),
    warnings,
    stats: { placemarks: count, inserted: count, skipped: 0, folders: 1 },
  });
}

function mockDownloadOk() {
  mockDownload.mockResolvedValue({
    data: { arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer },
    error: null,
  });
}

describe('importProtectedAreasFromStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockImplementation(() => ({ upsert: mockUpsert }));
    mockUpsert.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    mockList.mockResolvedValue({ data: [], error: null });
    mockDownloadOk();
    mockParse(1);
  });

  it('rejects a steward and touches neither storage nor the table', async () => {
    mockCaller('steward');

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result).toEqual({ success: false, error: 'Only admins can import protected areas.' });
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('rejects an admin who is not approved yet', async () => {
    mockCaller('admin', false);

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result.success).toBe(false);
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('rejects a caller with no session', async () => {
    mockCaller(null);

    expect((await importProtectedAreasFromStorage(VALID_PATH)).success).toBe(false);
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('downloads, upserts and removes for an approved admin', async () => {
    mockCaller('admin');
    mockParse(2);

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(mockDownload).toHaveBeenCalledWith(VALID_PATH);
    expect(mockFrom).toHaveBeenCalledWith('protected_areas');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][1]).toEqual({ onConflict: 'folder,fid' });
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
    expect(result).toEqual({ success: true, upserted: 2, skipped: 0, warnings: [] });
  });

  it('parses the bytes it downloaded', async () => {
    mockCaller('admin');

    await importProtectedAreasFromStorage(VALID_PATH);

    const passed = mockParseProtectedAreaFile.mock.calls[0][0] as Uint8Array;
    expect(passed).toBeInstanceOf(Uint8Array);
    expect([...passed]).toEqual([1, 2, 3]);
  });

  it('refuses an object larger than the file size limit', async () => {
    mockCaller('admin');
    mockDownload.mockResolvedValue({
      data: { arrayBuffer: async () => new Uint8Array(50 * 1024 * 1024 + 1).buffer },
      error: null,
    });

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result).toEqual({ success: false, error: 'The file is larger than 50 MB.' });
    expect(mockParseProtectedAreaFile).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('splits a large import into chunks of 50', async () => {
    mockCaller('admin');
    mockParse(120);

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(mockUpsert).toHaveBeenCalledTimes(3);
    expect(mockUpsert.mock.calls.map((call) => (call[0] as unknown[]).length)).toEqual([50, 50, 20]);
    expect(result.upserted).toBe(120);
  });

  it('stamps updated_at on every row', async () => {
    mockCaller('admin');
    mockParse(2);

    await importProtectedAreasFromStorage(VALID_PATH);

    const rows = mockUpsert.mock.calls[0][0] as Array<{ updated_at?: string }>;
    for (const row of rows) expect(typeof row.updated_at).toBe('string');
  });

  it('removes the staged file when an upsert fails', async () => {
    mockCaller('admin');
    mockParse(60);
    mockUpsert.mockResolvedValueOnce({ error: null });
    mockUpsert.mockResolvedValueOnce({ error: { message: 'payload too large' } });

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result.success).toBe(false);
    expect(result.upserted).toBe(50);
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('reports the parser message when the file is not a usable export', async () => {
    mockCaller('admin');
    mockParseProtectedAreaFile.mockImplementation(() => {
      throw new KmlImportError('The file is not a KML document.', 'not-kml');
    });

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result).toEqual({ success: false, error: 'The file is not a KML document.' });
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('hides the detail of an unexpected failure behind a generic message', async () => {
    mockCaller('admin');
    mockParseProtectedAreaFile.mockImplementation(() => {
      throw new Error('relation "public.protected_areas" does not exist');
    });

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result.error).toBe('The import failed. Try again, or check the file.');
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('hides the database text when an upsert fails', async () => {
    mockCaller('admin');
    mockParse(60);
    mockUpsert.mockResolvedValueOnce({ error: null });
    mockUpsert.mockResolvedValueOnce({
      error: { message: 'null value in column "folder" violates not-null constraint' },
    });

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result.error).toBe('The import stopped after 50 of 60 rows.');
  });

  it('removes the staged file when the download fails', async () => {
    mockCaller('admin');
    mockDownload.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result.success).toBe(false);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('fails without an upsert when the file holds no protected areas', async () => {
    mockCaller('admin');
    mockParse(0, ['"Empty" has no polygon geometry.']);

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result.success).toBe(false);
    expect(result.warnings).toEqual(['"Empty" has no polygon geometry.']);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('reports the skipped count and the warnings of a partial import', async () => {
    mockCaller('admin');
    mockParse(2, ['Skipped "Second": folder "Natural Areas" already has FID 7.']);

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result.success).toBe(true);
    expect(result.warnings).toEqual(['Skipped "Second": folder "Natural Areas" already has FID 7.']);
  });

  it.each([
    ['a path outside the staging prefix', 'other-bucket/abc/SAPAA-Map.kml'],
    ['a traversal segment', 'kml-imports/abc/../../secrets.kml'],
    ['a file that is not KML or KMZ', 'kml-imports/abc/SAPAA-Map.txt'],
    ['a path without an upload folder', 'kml-imports/SAPAA-Map.kml'],
    ['an empty path', ''],
  ])('rejects %s before any storage call', async (_label, path) => {
    mockCaller('admin');

    const result = await importProtectedAreasFromStorage(path);

    expect(result).toEqual({ success: false, error: 'The import path is not valid.' });
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('reports success with no warnings for a clean file', async () => {
    mockCaller('admin');

    const result = await importProtectedAreasFromStorage(VALID_PATH);

    expect(result).toEqual({ success: true, upserted: 1, skipped: 0, warnings: [] });
  });

  it('sweeps uploads older than a day during the import', async () => {
    mockCaller('admin');
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    mockList
      .mockResolvedValueOnce({ data: [{ name: 'kml-imports', id: null, created_at: null }], error: null })
      .mockResolvedValueOnce({ data: [{ name: 'old-upload', id: null, created_at: null }], error: null })
      .mockResolvedValueOnce({ data: [{ name: 'orphan.kml', id: 'obj-1', created_at: oldDate }], error: null });

    await importProtectedAreasFromStorage(VALID_PATH);

    expect(mockRemove).toHaveBeenCalledWith(['kml-imports/old-upload/orphan.kml']);
  });
});
