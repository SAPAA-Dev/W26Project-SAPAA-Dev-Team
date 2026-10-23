const mockCreateClient = jest.fn();
const mockDownload = jest.fn();
const mockRemove = jest.fn();
const mockInsert = jest.fn();
const mockInsertSelect = jest.fn();
const mockInsertSingle = jest.fn();
const mockTableFrom = jest.fn();

const mockServiceClient = {
  storage: {
    from: () => ({ download: mockDownload, remove: mockRemove }),
  },
  from: mockTableFrom,
};

jest.mock('../../utils/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
  createServerSupabase: () => mockServiceClient,
}));

import { saveGpxTrack } from '../../utils/gpx-track-actions';

const VALID_PATH = 'caller-id/upload-1/site-visit.gpx';

const VALID_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="53.5461" lon="-113.4938"/>
    <trkpt lat="53.5560" lon="-113.5010"/>
  </trkseg></trk>
</gpx>`;

// jsdom has no TextEncoder, and the test files are ASCII.
function encode(text: string): Uint8Array {
  return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

function mockCaller(role: string | null, authenticated = true) {
  const user =
    role === null
      ? null
      : { id: 'caller-id', app_metadata: { role, authenticated } };
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: role === null ? { message: 'no session' } : null }),
    },
  });
}

function mockDownloadOk(bytes: Uint8Array) {
  mockDownload.mockResolvedValue({
    data: { arrayBuffer: async () => bytes.buffer },
    error: null,
  });
}

function mockInsertOk(id = 42) {
  mockInsertSingle.mockResolvedValue({ data: { id }, error: null });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockTableFrom.mockReturnValue({ insert: mockInsert });
  mockInsert.mockImplementation(() => ({ select: mockInsertSelect }));
  mockInsertSelect.mockImplementation(() => ({ single: mockInsertSingle }));
  mockInsertOk();
  mockRemove.mockResolvedValue({ error: null });
  mockDownloadOk(encode(VALID_GPX));
});

describe('saveGpxTrack (US 2.0.9)', () => {
  it('saves a valid track for an approved steward and links it to the site and the account (AT1)', async () => {
    mockCaller('steward');

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result).toEqual({ success: true, trackId: 42, trackPointCount: 2 });
    expect(mockTableFrom).toHaveBeenCalledWith('gpx_tracks');
    expect(mockInsert).toHaveBeenCalledWith({
      site_id: 7,
      user_id: 'caller-id',
      storage_path: VALID_PATH,
      original_file_name: 'site-visit.gpx',
      track_point_count: 2,
    });
    // A saved file is kept in the bucket for read-back (AT4), not removed.
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('also saves for an approved admin (AT1)', async () => {
    mockCaller('admin');

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result.success).toBe(true);
  });

  it.each([
    ['a caller with no session', null],
    ['a steward who is not approved yet', 'steward-unknown'],
    ['a role that cannot upload', 'viewer'],
  ])('refuses %s and touches neither storage nor the table', async (_label, roleCase) => {
    if (roleCase === null) {
      mockCaller(null);
    } else if (roleCase === 'steward-unknown') {
      mockCaller('steward', false);
    } else {
      mockCaller('viewer');
    }

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result).toEqual({
      success: false,
      error: 'Sign in with an approved steward or admin account to upload a GPX track.',
    });
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('refuses a file without the .gpx extension (AT2)', async () => {
    mockCaller('steward');

    const result = await saveGpxTrack(7, VALID_PATH, 'notes.txt');

    expect(result).toEqual({ success: false, error: 'Only .gpx files are accepted.' });
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it.each([
    ['a key with a bucket-name prefix', 'gpx-tracks/caller-id/upload-1/visit.gpx'],
    ['a parent traversal segment', 'caller-id/../visit.gpx'],
    ['a current-directory segment', 'caller-id/./visit.gpx'],
    ['a file that is not GPX', 'caller-id/upload-1/visit.txt'],
    ['a key without an upload folder', 'caller-id/visit.gpx'],
    ['a key with only a file name', 'visit.gpx'],
    ['an empty path', ''],
  ])('refuses %s before any storage call', async (_label, path) => {
    mockCaller('steward');

    const result = await saveGpxTrack(7, path, 'visit.gpx');

    expect(result).toEqual({ success: false, error: 'The upload path is not valid.' });
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('accepts a file name that only holds two dots, like visit..gpx', async () => {
    mockCaller('steward');

    const result = await saveGpxTrack(7, 'caller-id/upload-1/visit..gpx', 'visit..gpx');

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('refuses a staged object that belongs to another user, before any storage call', async () => {
    mockCaller('steward');

    const result = await saveGpxTrack(
      7,
      'someone-else/upload-1/site-visit.gpx',
      'site-visit.gpx'
    );

    expect(result).toEqual({
      success: false,
      error: 'The uploaded file does not belong to your account.',
    });
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('sanitizes and caps the stored file name', async () => {
    mockCaller('steward');
    const longName = `${'a'.repeat(150)} ${'b'.repeat(70)}.gpx`;

    const result = await saveGpxTrack(7, VALID_PATH, longName);

    expect(result.success).toBe(true);
    const insertedRow = mockInsert.mock.calls[0][0] as { original_file_name: string };
    expect(insertedRow.original_file_name.length).toBe(200);
    expect(insertedRow.original_file_name.endsWith('___.gpx')).toBe(true);
    expect(insertedRow.original_file_name).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  it('keeps a stored file name of exactly the cap without the marker', async () => {
    mockCaller('steward');
    const exactName = `${'a'.repeat(196)}.gpx`;

    const result = await saveGpxTrack(7, VALID_PATH, exactName);

    expect(result.success).toBe(true);
    const insertedRow = mockInsert.mock.calls[0][0] as { original_file_name: string };
    expect(insertedRow.original_file_name).toBe(exactName);
  });

  it('cuts a stored file name one character over the cap with the marker', async () => {
    mockCaller('steward');
    const overName = `${'a'.repeat(197)}.gpx`;

    const result = await saveGpxTrack(7, VALID_PATH, overName);

    expect(result.success).toBe(true);
    const insertedRow = mockInsert.mock.calls[0][0] as { original_file_name: string };
    expect(insertedRow.original_file_name.length).toBe(200);
    expect(insertedRow.original_file_name.endsWith('___.gpx')).toBe(true);
  });

  it('refuses a non-string file name without touching storage', async () => {
    mockCaller('steward');

    const result = await saveGpxTrack(7, VALID_PATH, undefined as unknown as string);

    expect(result).toEqual({ success: false, error: 'Only .gpx files are accepted.' });
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('refuses a non-string storage path without touching storage', async () => {
    mockCaller('steward');

    const result = await saveGpxTrack(7, undefined as unknown as string, 'visit.gpx');

    expect(result).toEqual({ success: false, error: 'The upload path is not valid.' });
    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('refuses a file that is not valid GPX and saves nothing (AT3)', async () => {
    mockCaller('steward');
    mockDownloadOk(encode('this is not xml at all'));

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result).toEqual({ success: false, error: 'The file is not a valid GPX track.' });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('refuses a valid GPX file with no track points and saves nothing (AT3)', async () => {
    mockCaller('steward');
    mockDownloadOk(encode('<gpx><wpt lat="1" lon="2"/></gpx>'));

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result).toEqual({ success: false, error: 'The GPX file has no track points.' });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('refuses a file larger than 50 MB and names the limit (AT5)', async () => {
    mockCaller('steward');
    mockDownloadOk(new Uint8Array(50 * 1024 * 1024 + 1));

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result).toEqual({ success: false, error: 'The file is larger than 50 MB.' });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('removes the staged object and hides the database text when the insert fails', async () => {
    mockCaller('steward');
    mockInsertSingle.mockResolvedValue({ data: null, error: { message: 'new row violates policy' } });

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result).toEqual({ success: false, error: 'The track could not be saved. Try again.' });
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('removes the staged object when the download fails', async () => {
    mockCaller('steward');
    mockDownload.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const result = await saveGpxTrack(7, VALID_PATH, 'site-visit.gpx');

    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith([VALID_PATH]);
  });

  it('saves every file of a bulk upload on its own (AT6)', async () => {
    mockCaller('steward');

    const first = await saveGpxTrack(
      7,
      'caller-id/upload-1/morning.gpx',
      'morning.gpx'
    );
    const second = await saveGpxTrack(
      7,
      'caller-id/upload-2/afternoon.gpx',
      'afternoon.gpx'
    );

    expect(first).toEqual({ success: true, trackId: 42, trackPointCount: 2 });
    expect(second).toEqual({ success: true, trackId: 42, trackPointCount: 2 });
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({ original_file_name: 'morning.gpx' });
    expect(mockInsert.mock.calls[1][0]).toMatchObject({ original_file_name: 'afternoon.gpx' });
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
