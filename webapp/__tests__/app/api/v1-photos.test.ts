import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { listPhotos } from '@/lib/api/v1/server/photos';
import { fetchAll } from '@/lib/api/v1/server/db';
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
  created_at: '2026-01-01T00:00:00Z',
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
