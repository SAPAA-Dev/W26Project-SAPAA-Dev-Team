import { getGpxTrackPoints, getGpxTracksBySite } from '../../utils/supabase/queries';
import { createServerSupabase, createClient } from '../../utils/supabase/server';

jest.mock('../../utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

const mockDownload = jest.fn();
const mockServiceFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

function mockCaller(role: string, approved = true) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-uuid',
            app_metadata: { role, authenticated: approved },
          },
        },
        error: null,
      }),
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCaller('steward');
  (createServerSupabase as jest.Mock).mockReturnValue({
    from: mockServiceFrom,
    storage: { from: () => ({ download: mockDownload }) },
  });
  mockServiceFrom.mockImplementation(() => ({ select: mockSelect }));
  mockSelect.mockImplementation(() => ({ eq: mockEq }));
  mockEq.mockImplementation(() => ({ order: mockOrder, single: mockSingle }));
});

// jsdom has no TextEncoder, and the test files are ASCII.
function encode(text: string): Uint8Array {
  return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

const VALID_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="53.5461" lon="-113.4938"><ele>650.5</ele></trkpt>
    <trkpt lat="53.5560" lon="-113.5010"/>
  </trkseg></trk>
</gpx>`;

describe('getGpxTracksBySite (US 2.0.9)', () => {
  it('lists the saved tracks of a site for an approved user', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 9,
          original_file_name: 'visit.gpx',
          track_point_count: 2,
          created_at: '2026-10-20T12:00:00Z',
        },
      ],
      error: null,
    });

    const tracks = await getGpxTracksBySite(7);

    expect(mockServiceFrom).toHaveBeenCalledWith('gpx_tracks');
    expect(tracks).toEqual([
      {
        id: 9,
        originalFileName: 'visit.gpx',
        trackPointCount: 2,
        createdAt: '2026-10-20T12:00:00Z',
      },
    ]);
  });

  it('refuses a caller who is not approved', async () => {
    mockCaller('steward', false);

    await expect(getGpxTracksBySite(7)).rejects.toThrow(
      'Only approved stewards and admins can view GPX tracks.'
    );
    expect(createServerSupabase).not.toHaveBeenCalled();
  });

  it('refuses an approved caller whose role is neither steward nor admin', async () => {
    mockCaller('viewer', true);

    await expect(getGpxTracksBySite(7)).rejects.toThrow(
      'Only approved stewards and admins can view GPX tracks.'
    );
    expect(createServerSupabase).not.toHaveBeenCalled();
  });

  it('throws the database message when the read fails', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'relation missing' } });

    await expect(getGpxTracksBySite(7)).rejects.toThrow('relation missing');
  });
});

describe('getGpxTrackPoints (US 2.0.9 AT4)', () => {
  it('reads a stored track back with the same track points as the uploaded file', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 9, storage_path: 'user-uuid/upload-1/visit.gpx' },
      error: null,
    });
    mockDownload.mockResolvedValue({
      data: { arrayBuffer: async () => encode(VALID_GPX).buffer },
      error: null,
    });

    const points = await getGpxTrackPoints(9);

    expect(mockDownload).toHaveBeenCalledWith('user-uuid/upload-1/visit.gpx');
    expect(points).toEqual([
      { lat: 53.5461, lon: -113.4938, ele: 650.5, time: null },
      { lat: 53.556, lon: -113.501, ele: null, time: null },
    ]);
  });

  it('refuses a caller who is not approved', async () => {
    mockCaller('steward', false);

    await expect(getGpxTrackPoints(9)).rejects.toThrow(
      'Only approved stewards and admins can view GPX tracks.'
    );
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('refuses an approved caller whose role is neither steward nor admin', async () => {
    mockCaller('viewer', true);

    await expect(getGpxTrackPoints(9)).rejects.toThrow(
      'Only approved stewards and admins can view GPX tracks.'
    );
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('throws when the track row is not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows' } });

    await expect(getGpxTrackPoints(9)).rejects.toThrow('The GPX track could not be found.');
  });

  it('throws when the stored object cannot be read', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 9, storage_path: 'user-uuid/upload-1/visit.gpx' },
      error: null,
    });
    mockDownload.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(getGpxTrackPoints(9)).rejects.toThrow('The stored GPX file could not be read.');
  });

  it('throws when the stored file is no longer a valid GPX track', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 9, storage_path: 'user-uuid/upload-1/visit.gpx' },
      error: null,
    });
    mockDownload.mockResolvedValue({
      data: { arrayBuffer: async () => encode('this is not xml at all').buffer },
      error: null,
    });

    await expect(getGpxTrackPoints(9)).rejects.toThrow(
      'The stored GPX file is not a valid track.'
    );
  });
});
