jest.mock('next/server', () => ({ NextResponse: { json: (body: unknown, init?: { status: number }) => ({ status: init?.status ?? 200, json: async () => body }) } }));
jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn(), createServerSupabase: jest.fn() }));
jest.mock('@/utils/supabase/queries', () => ({ requireReportWriter: jest.fn() }));
import { PATCH } from '@/app/api/site-images/route';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { requireReportWriter } from '@/utils/supabase/queries';

let mockUser: { id: string; app_metadata: { authenticated: boolean; role: string } } | null;
let mockPhoto: Record<string, unknown> | null;
let mockWriteError: object | null;
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
const request = (body: unknown, kind = 'homepage_image_uploads', id = '1') => new Request(`https://app.test/api/site-images?id=${id}&kind=${kind}`, { method: 'PATCH', body: JSON.stringify(body) });
beforeEach(() => {
  jest.clearAllMocks(); mockUser = { id: 'owner', app_metadata: { authenticated: true, role: 'steward' } }; mockPhoto = { id: 1, user_id: 'owner', response_id: 41 }; mockWriteError = null;
  (createClient as jest.Mock).mockImplementation(async () => ({ auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) } }));
  (requireReportWriter as jest.Mock).mockResolvedValue({ isAdmin: false });
  mockFrom.mockImplementation(() => {
    const query = { select: jest.fn(), eq: jest.fn(), update: mockUpdate, maybeSingle: async () => ({ data: mockPhoto, error: null }), single: async () => ({ data: { id: 1 }, error: mockWriteError }) };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); mockUpdate.mockReturnValue(query); return query;
  });
  (createServerSupabase as jest.Mock).mockReturnValue({ from: mockFrom });
});
it.each(['steward', 'admin'])('(V3-12 AT1) saves allowed photo fields for the %s owner', async (role) => {
  mockUser!.app_metadata.role = role;
  expect((await PATCH(request({ caption: ' Pond ', date: '2023-07-23', photographer: 'Ann', identifier: 'P1' }))).status).toBe(200);
  expect(mockUpdate).toHaveBeenCalledWith({ caption: 'Pond', date: '2023-07-23', photographer: 'Ann', identifier: 'P1' });
});
it('(V3-12 AT1) lets an admin edit another uploader’s image', async () => {
  mockUser!.app_metadata.role = 'admin'; mockPhoto!.user_id = 'other';
  expect((await PATCH(request({ caption: 'Pond' }))).status).toBe(200);
});
it('(V3-12 AT2) refuses another steward and writes nothing', async () => {
  mockPhoto!.user_id = 'other'; expect((await PATCH(request({ caption: 'Pond' }))).status).toBe(403); expect(mockUpdate).not.toHaveBeenCalled();
});
it('(V3-12 AT2) applies the report writer check to attachments', async () => {
  expect((await PATCH(request({ caption: 'Pond' }, 'attachments'))).status).toBe(200); expect(requireReportWriter).toHaveBeenCalledWith(41);
  (requireReportWriter as jest.Mock).mockRejectedValue(new Error('Denied')); mockUpdate.mockClear();
  expect((await PATCH(request({ caption: 'Pond' }, 'attachments'))).status).toBe(403); expect(mockUpdate).not.toHaveBeenCalled();
});
it.each([null, false])('(V3-12 AT2) refuses a signed-out or unapproved caller: %s', async (approved) => {
  if (approved === null) mockUser = null; else mockUser!.app_metadata.authenticated = approved;
  expect((await PATCH(request({ caption: 'Pond' }))).status).toBe(approved === null ? 401 : 403); expect(mockFrom).not.toHaveBeenCalled();
});
it.each<unknown>([{ storage_key: 'other' }, { constructor: 'invalid' }, { date: '2023-02-31' }, { date: 'bad' }, { caption: 1 }, { caption: 'x'.repeat(10001) }, {}])('(V3-12 AT2) rejects invalid or unapproved fields: %j', async (body) => {
  expect((await PATCH(request(body))).status).toBe(400); expect(mockUpdate).not.toHaveBeenCalled();
});
it('(V3-12 AT2) rejects invalid table names and ids', async () => {
  expect((await PATCH(request({ caption: 'Pond' }, 'users'))).status).toBe(400);
  expect((await PATCH(request({ caption: 'Pond' }, 'attachments', '-1'))).status).toBe(400);
});
it('(V3-12 AT2) reports missing photos and save failures', async () => {
  mockPhoto = null; expect((await PATCH(request({ caption: 'Pond' }))).status).toBe(404);
  mockPhoto = { user_id: 'owner' }; mockWriteError = { message: 'failed' };
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect((await PATCH(request({ caption: 'Pond' }))).status).toBe(500); error.mockRestore();
});
