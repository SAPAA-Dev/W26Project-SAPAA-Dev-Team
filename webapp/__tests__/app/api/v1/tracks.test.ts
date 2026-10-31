/** @jest-environment node */
const mockGetUser = jest.fn();
const mockGetTracksForMap = jest.fn();
const mockSaveGpxTrack = jest.fn();
const mockFindSite = jest.fn();
const mockSignedUpload = jest.fn();
const mockRemove = jest.fn();
const mockSelectList = jest.fn();
const mockDeleteSelect = jest.fn();

const sessionClient = {
  auth: { getUser: () => mockGetUser() },
  from: () => ({
    select: () => ({ eq: () => ({ order: () => mockSelectList() }) }),
    delete: () => ({ eq: () => ({ eq: () => ({ select: () => mockDeleteSelect() }) }) }),
  }),
  storage: { from: () => ({ remove: (...a: unknown[]) => mockRemove(...a) }) },
};

jest.mock('@/utils/supabase/server', () => ({
  createClient: async () => sessionClient,
  createServerSupabase: () => ({ storage: { from: () => ({ createSignedUploadUrl: (p: string) => mockSignedUpload(p) }) } }),
}));
jest.mock('@/utils/supabase/queries', () => ({
  getGpxTracksForMap: () => mockGetTracksForMap(),
  setSiteBoundaryColor: jest.fn(),
  setSiteTypeBoundaryColor: jest.fn(),
}));
jest.mock('@/utils/gpx-track-actions', () => ({ saveGpxTrack: (...a: unknown[]) => mockSaveGpxTrack(...a) }));
jest.mock('@/lib/api/v1/server/sites', () => ({ findSite: (...a: unknown[]) => mockFindSite(...a) }));

import { HttpError, type Caller } from '@/lib/api/v1/server/auth';
import { createTrackUpload, deleteTrack, getTrackLines, listSiteTracks, saveTrack } from '@/lib/api/v1/server/tracks';

const steward: Caller = { userId: 'u1', email: 's@x.ca', isAdmin: false };
const admin: Caller = { userId: 'a1', email: 'a@x.ca', isAdmin: true };

const asRole = (role: string | null) =>
  mockGetUser.mockResolvedValue({
    data: { user: role ? { app_metadata: { role, authenticated: true } } : null },
    error: role ? null : { message: 'no session' },
  });

const status = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (e) {
    return e instanceof HttpError ? e.status : 500;
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  asRole('steward');
  mockFindSite.mockResolvedValue({ id: 7, namesite: 'Pembina' });
});

describe('GPX track routes: who may use them (US 2.0.9)', () => {
  it.each([['viewer'], [null]])('refuses role %s on every operation, before reading anything', async (role) => {
    asRole(role);
    for (const call of [
      () => getTrackLines(),
      () => listSiteTracks(steward, 'Pembina'),
      () => createTrackUpload(steward, 'Pembina'),
      () => saveTrack(steward, 'Pembina', { path: 'p', fileName: 'a.gpx' }),
      () => deleteTrack(steward, 'Pembina', '3'),
    ]) {
      expect(await status(call())).toBe(403);
    }
    expect(mockGetTracksForMap).not.toHaveBeenCalled();
    expect(mockSaveGpxTrack).not.toHaveBeenCalled();
    expect(mockSignedUpload).not.toHaveBeenCalled();
  });

  it('lets stewards and admins read the lines', async () => {
    mockGetTracksForMap.mockResolvedValue([
      { id: 1, originalFileName: 'a.gpx', points: [{ lat: 1, lon: 2, ele: null, time: null }, { lat: 3, lon: 4, ele: null, time: null }] },
      { id: 2, originalFileName: 'one.gpx', points: [{ lat: 1, lon: 2, ele: null, time: null }] },
    ]);
    for (const role of ['steward', 'admin']) {
      asRole(role);
      const lines = await getTrackLines();
      // A one-point track has no line.
      expect(lines.features).toHaveLength(1);
      expect(lines.features[0].geometry.coordinates).toEqual([[2, 1], [4, 3]]);
    }
  });
});

describe('listSiteTracks', () => {
  it('marks a track deletable for its uploader and for admins only', async () => {
    mockSelectList.mockResolvedValue({
      data: [
        { id: 1, original_file_name: 'mine.gpx', track_point_count: 5, created_at: 't', user_id: 'u1' },
        { id: 2, original_file_name: 'theirs.gpx', track_point_count: 9, created_at: 't', user_id: 'other' },
      ],
      error: null,
    });
    expect((await listSiteTracks(steward, 'Pembina')).map((t) => t.canDelete)).toEqual([true, false]);
    expect((await listSiteTracks(admin, 'Pembina')).map((t) => t.canDelete)).toEqual([true, true]);
  });
});

describe('createTrackUpload', () => {
  it('signs a key in the caller\'s own folder, never one the caller names', async () => {
    mockSignedUpload.mockImplementation(async (path: string) => ({ data: { path, signedUrl: `https://s/${path}`, token: 't' }, error: null }));
    const { path } = await createTrackUpload(steward, 'Pembina');
    expect(path).toMatch(/^u1\/[0-9a-f-]{36}\/track\.gpx$/);
  });

  it('fails without a URL when the bucket refuses', async () => {
    mockSignedUpload.mockResolvedValue({ data: null, error: { message: 'x' } });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(await status(createTrackUpload(steward, 'Pembina'))).toBe(500);
  });
});

describe('saveTrack', () => {
  it('rejects a body that is not { path, fileName } text', async () => {
    for (const body of [null, [], {}, { path: 'p' }, { path: 1, fileName: 'a.gpx' }, { path: 'p', fileName: {} }]) {
      expect(await status(saveTrack(steward, 'Pembina', body))).toBe(400);
    }
    expect(mockSaveGpxTrack).not.toHaveBeenCalled();
  });

  it('hands the checks to saveGpxTrack and maps its answer', async () => {
    mockSaveGpxTrack.mockResolvedValueOnce({ success: true, trackId: 11, trackPointCount: 42 });
    expect(await saveTrack(steward, 'Pembina', { path: 'u1/x/track.gpx', fileName: 'a.gpx' })).toEqual({ id: 11, pointCount: 42 });
    expect(mockSaveGpxTrack).toHaveBeenCalledWith(7, 'u1/x/track.gpx', 'a.gpx');

    mockSaveGpxTrack.mockResolvedValueOnce({ success: false, error: 'The file is larger than 50 MB.' });
    await expect(saveTrack(steward, 'Pembina', { path: 'p', fileName: 'a.gpx' })).rejects.toMatchObject({
      status: 400,
      message: 'The file is larger than 50 MB.',
    });
  });
});

describe('deleteTrack', () => {
  it('rejects a track id that is not a plain number', async () => {
    for (const id of ['abc', '1;drop', '-1', '']) expect(await status(deleteTrack(steward, 'Pembina', id))).toBe(400);
  });

  it('deletes the row, then its file', async () => {
    mockDeleteSelect.mockResolvedValue({ data: [{ storage_path: 'u1/x/track.gpx' }], error: null });
    mockRemove.mockResolvedValue({ error: null });
    expect(await deleteTrack(steward, 'Pembina', '3')).toEqual({ ok: true });
    expect(mockRemove).toHaveBeenCalledWith(['u1/x/track.gpx']);
  });

  it('answers 404 and leaves the file when the policy hides the row', async () => {
    mockDeleteSelect.mockResolvedValue({ data: [], error: null });
    expect(await status(deleteTrack(steward, 'Pembina', '3'))).toBe(404);
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
