/** @jest-environment node */
const mockSite = jest.fn();
const mockType = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  setSiteBoundaryColor: (...a: unknown[]) => mockSite(...a),
  setSiteTypeBoundaryColor: (...a: unknown[]) => mockType(...a),
}));
jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn(), createServerSupabase: jest.fn() }));
jest.mock('@/lib/api/v1/server/sites', () => ({ loadSites: jest.fn() }));

import { HttpError, type Caller } from '@/lib/api/v1/server/auth';
import { setBoundaryColor } from '@/lib/api/v1/server/boundaries';

const steward: Caller = { userId: 'u1', email: null, isAdmin: false };
const admin: Caller = { userId: 'a1', email: null, isAdmin: true };

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
  mockSite.mockResolvedValue({ ok: true });
  mockType.mockResolvedValue({ ok: true });
});

describe('setBoundaryColor (admin only, as on the classic map)', () => {
  it('refuses a steward before touching either action', async () => {
    expect(await status(setBoundaryColor(steward, { scope: 'site', areaId: 1, color: '#aabbcc' }))).toBe(403);
    expect(mockSite).not.toHaveBeenCalled();
    expect(mockType).not.toHaveBeenCalled();
  });

  it('rejects malformed bodies', async () => {
    for (const body of [null, [], {}, { scope: 'site', areaId: 1 }, { scope: 'site', areaId: '1', color: '#aabbcc' }, { scope: 'type', areaType: 5, color: '#aabbcc' }, { scope: 'all', color: '#aabbcc' }]) {
      expect(await status(setBoundaryColor(admin, body))).toBe(400);
    }
    expect(mockSite).not.toHaveBeenCalled();
    expect(mockType).not.toHaveBeenCalled();
  });

  it('routes a site colour and a type colour to their actions', async () => {
    await setBoundaryColor(admin, { scope: 'site', areaId: 4, color: '#AABBCC' });
    expect(mockSite).toHaveBeenCalledWith(4, '#AABBCC');
    await setBoundaryColor(admin, { scope: 'type', areaType: 'NA', color: '#00ff00' });
    expect(mockType).toHaveBeenCalledWith('NA', '#00ff00');
  });

  it('turns an action refusal (bad colour, missing id) into a 400 with its message', async () => {
    mockSite.mockResolvedValue({ ok: false, error: 'The color is not valid.' });
    await expect(setBoundaryColor(admin, { scope: 'site', areaId: 4, color: 'red' })).rejects.toMatchObject({
      status: 400,
      message: 'The color is not valid.',
    });
  });
});
