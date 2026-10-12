import {
  addSiteInspectionReport,
  getCurrentSiteId,
  getNextFormInspectionNumber,
  insertHomepageImageUpload,
  insertInspectionAttachments,
  uploadSiteInspectionAnswers,
  updateAttachmentMetadata,
  updateSiteInspectionAnswers,
} from '../../utils/supabase/queries';
import { createClient, createServerSupabase } from '../../utils/supabase/server';
import { deleteObjectsByKeys } from '../../utils/media/s3Delete';

jest.mock('../../utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

jest.mock('../../utils/media/s3Delete', () => ({
  deleteObjectsByKeys: jest.fn(),
}));

type Result = { data: unknown; error: unknown };
type Builder = Record<string, jest.Mock> & { then: Promise<Result>['then'] };

// A chainable stand-in for the Supabase query builder. Awaiting it returns `result`.
function builder(result: Result): Builder {
  const query = {
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  } as Builder;
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'is', 'in', 'like', 'or', 'order', 'limit', 'single', 'maybeSingle']) {
    query[method] = jest.fn(() => query);
  }
  return query;
}

const OWNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const ADMIN = '33333333-3333-4333-8333-333333333333';

function mockCaller(id: string | null, role = 'steward', approved = true) {
  const user = id === null ? null : { id, app_metadata: { role, authenticated: approved } };
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
  });
}

describe('report write server actions', () => {
  let queues: Record<string, Builder[]>;
  const mockFrom = jest.fn();
  const mockRpc = jest.fn();

  // Queue the result of the next query on a table, in call order.
  function queue(table: string, result: Result): Builder {
    const query = builder(result);
    (queues[table] ??= []).push(query);
    return query;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    queues = {};
    mockFrom.mockImplementation((table: string) => queues[table]?.shift() ?? builder({ data: null, error: null }));
    mockRpc.mockResolvedValue({ data: 0, error: null });
    (createServerSupabase as jest.Mock).mockReturnValue({ from: mockFrom, rpc: mockRpc });
    (deleteObjectsByKeys as jest.Mock).mockResolvedValue(undefined);
    mockCaller(OWNER);
  });

  describe('getNextFormInspectionNumber (M20)', () => {
    const year = new Date().getFullYear();

    it('starts at 001 when the year has no reports yet', async () => {
      await expect(getNextFormInspectionNumber()).resolves.toBe(`${year}-001`);
    });

    it('asks the database for the highest number, so 1000+ reports in a year still count', async () => {
      mockRpc.mockResolvedValue({ data: 1000, error: null });
      await expect(getNextFormInspectionNumber()).resolves.toBe(`${year}-1001`);
      expect(mockRpc).toHaveBeenCalledWith('get_max_inspection_number', { p_year: year });
      expect(mockFrom).not.toHaveBeenCalledWith('form_responses');
    });

    it('pads the next number to three digits', async () => {
      mockRpc.mockResolvedValue({ data: 4, error: null });
      await expect(getNextFormInspectionNumber()).resolves.toBe(`${year}-005`);
    });

    it('throws when the lookup fails, so no report is saved without a number', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
      await expect(getNextFormInspectionNumber()).rejects.toThrow('boom');
    });
  });

  describe('deactivated and archived sites (M9)', () => {
    it('US 2.0.3 AT2: getCurrentSiteId only finds an active, unarchived site', async () => {
      const query = queue('sites_pa', { data: { id: 7 }, error: null });
      await expect(getCurrentSiteId('Duck Lake')).resolves.toBe(7);
      expect(query.is).toHaveBeenCalledWith('archived_at', null);
      expect(query.or).toHaveBeenCalledWith('is_active.eq.true,is_active.is.null');
    });

    it('US 2.0.3 AT2: addSiteInspectionReport refuses a deactivated site and inserts nothing', async () => {
      queue('sites_pa', { data: null, error: null });
      await expect(addSiteInspectionReport(7, '2026-10-01')).rejects.toThrow(
        'This site is not accepting new reports.'
      );
      expect(mockFrom).not.toHaveBeenCalledWith('form_responses');
    });
  });

  // The owner check in every guarded action reads this row first.
  function queueReport(userId = OWNER) {
    return queue('form_responses', {
      data: { user_id: userId, site_id: 7, created_at: new Date().toISOString() },
      error: null,
    });
  }

  describe('updateSiteInspectionAnswers (B2)', () => {
    const answers = [{ question_id: 3, obs_value: 'Good', obs_comm: null }];

    it('refuses a different user and changes nothing', async () => {
      mockCaller(OTHER);
      queueReport(OWNER);
      await expect(updateSiteInspectionAnswers(41, answers, '2026-10-01')).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).not.toHaveBeenCalledWith('answers');
    });

    it('refuses an unapproved owner before reading the report', async () => {
      mockCaller(OWNER, 'steward', false);
      await expect(updateSiteInspectionAnswers(41, answers, '2026-10-01')).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it.each([
      ['the owner', OWNER, 'steward'],
      ['an approved admin', ADMIN, 'admin'],
    ])('lets %s replace the answers', async (_label, id, role) => {
      mockCaller(id, role);
      queueReport(OWNER);
      queue('form_responses', { data: { id: 41 }, error: null });
      queue('answers', { data: null, error: null });
      const insert = queue('answers', { data: null, error: null });

      await updateSiteInspectionAnswers(41, answers, '2026-10-01');

      expect(insert.insert).toHaveBeenCalledWith([{ ...answers[0], response_id: 41 }]);
    });
  });

  describe('updateAttachmentMetadata (B2)', () => {
    it('refuses a different user and changes nothing', async () => {
      mockCaller(OTHER);
      queue('attachments', { data: { response_id: 41 }, error: null });
      queueReport(OWNER);
      await expect(updateAttachmentMetadata(9, { caption: 'x', identifier: null })).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['the owner', OWNER, 'steward'],
      ['an approved admin', ADMIN, 'admin'],
    ])('lets %s change only the caption and identifier', async (_label, id, role) => {
      mockCaller(id, role);
      queue('attachments', { data: { response_id: 41 }, error: null });
      queueReport(OWNER);
      const update = queue('attachments', { data: null, error: null });

      await updateAttachmentMetadata(9, {
        caption: 'Pond',
        identifier: 'A1',
        storage_key: 'pdf-exports/x.pdf',
      } as any);

      expect(update.update).toHaveBeenCalledWith({ caption: 'Pond', identifier: 'A1' });
      expect(update.eq).toHaveBeenCalledWith('id', 9);
    });
  });

  describe('addSiteInspectionReport (H3)', () => {
    it('saves the report under the signed-in user', async () => {
      queue('sites_pa', { data: { id: 7 }, error: null });
      const insert = queue('form_responses', { data: { id: 41 }, error: null });

      await expect(addSiteInspectionReport(7, '2026-10-01')).resolves.toEqual({ id: 41 });

      expect(insert.insert).toHaveBeenCalledWith(
        expect.objectContaining({ site_id: 7, user_id: OWNER, inspection_date: '2026-10-01' })
      );
    });

    it('refuses an unapproved caller before touching the database', async () => {
      mockCaller(OWNER, 'steward', false);
      await expect(addSiteInspectionReport(7, '2026-10-01')).rejects.toThrow(
        'Only approved users can submit reports.'
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('uploadSiteInspectionAnswers (H3)', () => {
    const answers = [{ response_id: 41, question_id: 3, obs_value: 'Good', obs_comm: null }];

    it('refuses answers for a report the caller does not own', async () => {
      mockCaller(OTHER);
      queueReport(OWNER);
      await expect(uploadSiteInspectionAnswers(answers)).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).not.toHaveBeenCalledWith('answers');
    });

    it.each([
      ['the owner', OWNER, 'steward'],
      ['an approved admin', ADMIN, 'admin'],
    ])('lets %s add answers', async (_label, id, role) => {
      mockCaller(id, role);
      queueReport(OWNER);
      const insert = queue('answers', { data: null, error: null });
      await uploadSiteInspectionAnswers(answers);
      expect(insert.insert).toHaveBeenCalledWith(answers);
    });
  });

  describe('insertInspectionAttachments (H3)', () => {
    const row = {
      response_id: 41,
      question_id: 3,
      site_id: 7,
      storage_key: 'inspections/7/41/3/DuckLake-2026-10-01-Ann-A1-uuid.jpg',
    };

    it('refuses a photo for a report the caller does not own', async () => {
      mockCaller(OTHER);
      queueReport(OWNER);
      await expect(insertInspectionAttachments([row])).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).not.toHaveBeenCalledWith('attachments');
    });

    it.each([
      ['another report', 'inspections/7/99/3/file.jpg'],
      ['a PDF export', 'pdf-exports/user-1/job-1/report.pdf'],
      ['another site', 'inspections/8/41/3/file.jpg'],
    ])('refuses a storage key from %s', async (_label, storageKey) => {
      queueReport(OWNER);
      await expect(insertInspectionAttachments([{ ...row, storage_key: storageKey }])).rejects.toThrow(
        'The photo storage key is not valid.'
      );
      expect(mockFrom).not.toHaveBeenCalledWith('attachments');
    });

    it('refuses a site id that is not the report site', async () => {
      queueReport(OWNER);
      await expect(insertInspectionAttachments([{ ...row, site_id: 8 }])).rejects.toThrow(
        'The photo storage key is not valid.'
      );
    });

    it('refuses a photo with no report', async () => {
      await expect(insertInspectionAttachments([{ ...row, response_id: null }])).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it.each([
      ['the owner', OWNER, 'steward'],
      ['an approved admin', ADMIN, 'admin'],
    ])('lets %s add a photo', async (_label, id, role) => {
      mockCaller(id, role);
      queueReport(OWNER);
      const insert = queue('attachments', { data: null, error: null });
      await insertInspectionAttachments([row]);
      expect(insert.insert).toHaveBeenCalledWith([row]);
    });
  });

  describe('insertHomepageImageUpload (H3)', () => {
    const row = {
      storage_key: `homepage-image-uploads/7/${OWNER}/DuckLake-2026-10-01-Ann-A1-uuid.jpg`,
      site_id: 7,
      date: new Date('2026-10-01'),
      photographer: 'Ann',
      identifier: 'A1',
      caption: 'Pond',
      created_at: null,
    };

    it('saves the upload under the signed-in user, not an id the browser sends', async () => {
      const insert = queue('homepage_image_uploads', { data: null, error: null });
      await insertHomepageImageUpload([{ ...row, user_id: OTHER } as any]);
      expect(insert.insert).toHaveBeenCalledWith([{ ...row, user_id: OWNER }]);
    });

    it("refuses a storage key in another user's folder", async () => {
      await expect(
        insertHomepageImageUpload([{ ...row, storage_key: `homepage-image-uploads/7/${OTHER}/file.jpg` }])
      ).rejects.toThrow('The photo storage key is not valid.');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('refuses an unapproved caller', async () => {
      mockCaller(OWNER, 'steward', false);
      await expect(insertHomepageImageUpload([row])).rejects.toThrow(
        'Only approved users can upload images.'
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
