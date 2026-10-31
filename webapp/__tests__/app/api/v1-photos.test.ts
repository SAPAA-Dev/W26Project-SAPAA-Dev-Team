import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { listPhotos } from '@/lib/api/v1/server/photos';
import { db, fetchAll } from '@/lib/api/v1/server/db';
import type { Caller } from '@/lib/api/v1/server/auth';

jest.mock('@/lib/api/v1/server/db', () => ({ db: jest.fn(), fetchAll: jest.fn() }));
jest.mock('@/lib/api/v1/server/sites', () => ({
  visibleSites: jest.fn(() => ({ order: () => ({ range: jest.fn() }) })),
}));

const steward: Caller = { userId: 'steward', email: null, isAdmin: false };
const owner: Caller = { userId: 'owner', email: null, isAdmin: false };
const admin: Caller = { userId: 'admin', email: null, isAdmin: true };

const row = (id: number, questionId: number) => ({
  id,
  site_id: 1,
  storage_key: `k${id}`,
  caption: null,
  identifier: null,
  photographer: null,
  date: '2026-01-01',
  question_id: questionId,
  form_responses: { user_id: 'owner', answers: [{ question_id: 7, is_hidden: true }, { question_id: 8, is_hidden: false }] },
});

// The three reads in listPhotos: sites, report photos, homepage uploads.
function setup() {
  (fetchAll as jest.Mock)
    .mockResolvedValueOnce([{ id: 1, namesite: 'Site' }])
    .mockResolvedValueOnce([row(1, 7), row(2, 8)])
    .mockResolvedValueOnce([]);
  (getSignedUrl as jest.Mock).mockResolvedValue('https://signed');
}

describe('listPhotos hidden answers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setup();
  });

  it('drops the photo of a hidden answer for another steward', async () => {
    expect((await listPhotos(steward)).map((p) => p.id)).toEqual([2]);
  });

  it.each([
    ['the report owner', owner],
    ['an admin', admin],
  ])('keeps it for %s and marks it hidden', async (_name, caller) => {
    const photos = await listPhotos(caller);
    expect(photos.map((p) => [p.id, p.isHidden])).toEqual(expect.arrayContaining([[1, true], [2, undefined]]));
  });
});


describe('production photo schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchAll as jest.Mock).mockReset();
    (getSignedUrl as jest.Mock).mockResolvedValue('https://signed');
  });

  it('does not request created_at from either photo table', async () => {
    const query = { select: jest.fn(), is: jest.fn(), eq: jest.fn(), in: jest.fn(), order: jest.fn(), range: jest.fn() };
    for (const method of Object.values(query)) method.mockReturnValue(query);
    (db as jest.Mock).mockReturnValue({ from: () => query });
    (fetchAll as jest.Mock).mockImplementation(async (build) => { await build(0, 999); return []; });
    await listPhotos(admin, 1);
    expect(query.select).toHaveBeenCalledTimes(2);
    for (const [columns] of query.select.mock.calls) {
      expect(columns.split('form_responses!inner')[0]).not.toContain('created_at');
    }
    expect(query.select.mock.calls[0][0]).toContain('inspection_date, created_at');
  });

  it.each([
    ['2026-05-01', '2026-04-01T12:00:00Z', '2026-05-01'],
    [null, '2026-04-01T12:00:00Z', '2026-04-01'],
    [null, null, null],
  ])('uses available report dates when the photo date is absent', async (inspectionDate, createdAt, expected) => {
    const attachment = { ...row(3, 8), date: null, form_responses: { user_id: 'owner', answers: [], inspection_date: inspectionDate, created_at: createdAt } };
    (fetchAll as jest.Mock).mockResolvedValueOnce([{ id: 1, namesite: 'Site' }]).mockResolvedValueOnce([attachment]).mockResolvedValueOnce([{ ...row(4, 8), date: null }]);
    const photos = await listPhotos(owner);
    expect(photos.find((photo) => photo.kind === 'attachments')?.date).toBe(expected);
    expect(photos.find((photo) => photo.kind === 'homepage_image_uploads')?.date).toBeNull();
  });
});
