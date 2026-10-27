import {
  addSiteInspectionReport,
  getCurrentSiteId,
  getDateOfVisitQuestionId,
  getFormResponseById,
  getFormResponsesBySite,
  getInspectionDetailsOnline,
  getLastInspectionDate,
  getQuestionResponseType,
  getQuestionsOnline,
  getResponseOwnerId,
  getSiteByName,
  getSiteIdForResponse,
  getTotalInspectionCount,
  isSteward,
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
    then: (resolve?: (value: Result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
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

  // getNextFormInspectionNumber is private, so these go through the action that calls it.
  describe('getNextFormInspectionNumber (M20)', () => {
    const year = new Date().getFullYear();

    async function submittedNumber(): Promise<unknown> {
      queue('sites_pa', { data: { id: 7 }, error: null });
      const insert = queue('form_responses', { data: { id: 99 }, error: null });
      await addSiteInspectionReport(7, '2026-10-01');
      return insert.insert.mock.calls[0][0].inspection_no;
    }

    it('starts at 001 when the year has no reports yet', async () => {
      await expect(submittedNumber()).resolves.toBe(`${year}-001`);
    });

    it('asks the database for the highest number, so 1000+ reports in a year still count', async () => {
      mockRpc.mockResolvedValue({ data: 1000, error: null });
      await expect(submittedNumber()).resolves.toBe(`${year}-1001`);
      expect(mockRpc).toHaveBeenCalledWith('get_max_inspection_number', { p_year: year });
    });

    it('pads the next number to three digits', async () => {
      mockRpc.mockResolvedValue({ data: 4, error: null });
      await expect(submittedNumber()).resolves.toBe(`${year}-005`);
    });

    it('throws when the lookup fails, so no report is saved without a number', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
      queue('sites_pa', { data: { id: 7 }, error: null });
      await expect(addSiteInspectionReport(7, '2026-10-01')).rejects.toThrow('boom');
      expect(mockFrom).not.toHaveBeenCalledWith('form_responses');
    });

    it('is not exported, so the browser cannot call it as a server action', async () => {
      const queries: Record<string, unknown> = await import('../../utils/supabase/queries');
      expect(queries.getNextFormInspectionNumber).toBeUndefined();
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

  function queueRequiredQuestions(questions: Array<{
    id: number;
    form_question: string | null;
    question_type: string;
  }> = []) {
    return queue('questions', { data: questions, error: null });
  }

  describe('updateSiteInspectionAnswers (B2)', () => {
    const answers = [{ question_id: 3, obs_value: 'Good', obs_comm: null }];

    it('refuses a different user and changes nothing (4.0.4 AT2)', async () => {
      mockCaller(OTHER);
      queueReport(OWNER);
      await expect(updateSiteInspectionAnswers(41, answers, '2026-10-01')).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).not.toHaveBeenCalledWith('answers');
    });

    it.each(['steward', 'admin'])('refuses an unapproved %s before reading the report', async (role) => {
      mockCaller(OWNER, role, false);
      await expect(updateSiteInspectionAnswers(41, answers, '2026-10-01')).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('lets the owner replace the answers (4.0.4 AT1)', async () => {
      queueReport(OWNER);
      queueRequiredQuestions();
      queue('form_responses', { data: { id: 41 }, error: null });
      queue('answers', { data: null, error: null });
      const insert = queue('answers', { data: null, error: null });

      await updateSiteInspectionAnswers(41, answers, '2026-10-01');

      expect(insert.insert).toHaveBeenCalledWith([{ ...answers[0], response_id: 41 }]);
    });

    it('lets an approved admin replace the answers in another user\'s report', async () => {
      mockCaller(ADMIN, 'admin');
      queueReport(OWNER);
      queueRequiredQuestions();
      queue('form_responses', { data: { id: 41 }, error: null });
      queue('answers', { data: null, error: null });
      const insert = queue('answers', { data: null, error: null });

      await updateSiteInspectionAnswers(41, answers, '2026-10-01');

      expect(insert.insert).toHaveBeenCalledWith([{ ...answers[0], response_id: 41 }]);
    });

    it('refuses an update that clears a required answer and names the question (4.0.4 AT3)', async () => {
      queueReport(OWNER);
      queueRequiredQuestions([
        { id: 3, form_question: 'Site condition', question_type: 'text' },
      ]);

      await expect(updateSiteInspectionAnswers(41, [], '2026-10-01')).rejects.toThrow(
        'Required questions are missing: Site condition'
      );
      expect(mockFrom).not.toHaveBeenCalledWith('answers');
    });

    it('accepts an answer to every required question (4.0.4 AT3)', async () => {
      queueReport(OWNER);
      queueRequiredQuestions([
        { id: 3, form_question: 'Site condition', question_type: 'text' },
      ]);
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

    it('refuses an unapproved caller before reading the attachment', async () => {
      mockCaller(OWNER, 'steward', false);
      await expect(updateAttachmentMetadata(9, { caption: 'x', identifier: null })).rejects.toThrow(
        'You are not allowed to change this report.'
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('lets the owner change only the caption and identifier', async () => {
      queue('attachments', { data: { response_id: 41 }, error: null });
      queueReport(OWNER);
      const update = queue('attachments', { data: null, error: null });

      await updateAttachmentMetadata(9, {
        caption: 'Pond',
        identifier: 'A1',
        storage_key: 'pdf-exports/x.pdf',
      } as Parameters<typeof updateAttachmentMetadata>[1]);

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

    it('lets the owner add answers', async () => {
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

    it('lets the owner add a photo', async () => {
      queueReport(OWNER);
      const insert = queue('attachments', { data: null, error: null });
      await insertInspectionAttachments([row]);
      expect(insert.insert).toHaveBeenCalledWith([row]);
    });
  });

  describe('getFormResponseById (#251)', () => {
    const answerRows = [{ question_id: 3, obs_value: 'Good', obs_comm: null, questions: { question_type: 'radio' } }];

    it('refuses a signed-out caller before reading', async () => {
      mockCaller(null);
      await expect(getFormResponseById(41)).rejects.toThrow('You are not allowed to view this report.');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('refuses an unapproved owner before reading', async () => {
      mockCaller(OWNER, 'steward', false);
      await expect(getFormResponseById(41)).rejects.toThrow('You are not allowed to view this report.');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("refuses another user's report and reads no answers", async () => {
      mockCaller(OTHER);
      queueReport(OWNER);
      await expect(getFormResponseById(41)).rejects.toThrow('You are not allowed to view this report.');
      expect(mockFrom).not.toHaveBeenCalledWith('answers');
    });

    it('refuses an archived report to its owner and reads no answers', async () => {
      // The owner check skips archived reports, so an archived report comes back empty.
      const report = queue('form_responses', { data: null, error: null });
      await expect(getFormResponseById(41)).rejects.toThrow('You are not allowed to view this report.');
      expect(report.is).toHaveBeenCalledWith('archived_at', null);
      expect(mockFrom).not.toHaveBeenCalledWith('answers');
    });

    it('returns the answers to the owner', async () => {
      queueReport(OWNER);
      const answers = queue('answers', { data: answerRows, error: null });

      await expect(getFormResponseById(41)).resolves.toEqual({ 3: 'Good' });
      expect(answers.eq).toHaveBeenCalledWith('response_id', 41);
    });
  });

  describe('isSteward (#251)', () => {
    it('refuses a signed-out caller before reading', async () => {
      mockCaller(null);
      await expect(isSteward()).rejects.toThrow('Only approved users can view this data.');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('checks the email of the signed-in user only', async () => {
      (createClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: OWNER, email: 'ann@example.com', app_metadata: { authenticated: true } } },
            error: null,
          }),
        },
      });
      const lookup = queue('luperson', { data: { id: 5 }, error: null });

      await expect(isSteward()).resolves.toBe(true);
      expect(lookup.eq).toHaveBeenCalledWith('email', 'ann@example.com');
    });

    it('returns false when the signed-in user is not in luperson', async () => {
      queue('luperson', { data: null, error: null });
      await expect(isSteward()).resolves.toBe(false);
    });
  });

  describe('read actions callable from the browser (#251)', () => {
    const reads: Array<[string, () => Promise<unknown>]> = [
      ['getQuestionResponseType', () => getQuestionResponseType()],
      ['getCurrentSiteId', () => getCurrentSiteId('Duck Lake')],
      ['getQuestionsOnline', () => getQuestionsOnline()],
      ['getSiteByName', () => getSiteByName('Duck Lake')],
      ['getInspectionDetailsOnline', () => getInspectionDetailsOnline('Duck Lake')],
      ['getFormResponsesBySite', () => getFormResponsesBySite('Duck Lake')],
      ['getResponseOwnerId', () => getResponseOwnerId(41)],
      ['getSiteIdForResponse', () => getSiteIdForResponse(41)],
      ['getTotalInspectionCount', () => getTotalInspectionCount()],
      ['getLastInspectionDate', () => getLastInspectionDate()],
      ['getDateOfVisitQuestionId', () => getDateOfVisitQuestionId()],
    ];

    it.each(reads)('%s refuses a signed-out caller before reading', async (_name, read) => {
      mockCaller(null);
      await expect(read()).rejects.toThrow('Only approved users can view this data.');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it.each(reads)('%s refuses an unapproved caller before reading', async (_name, read) => {
      mockCaller(OWNER, 'steward', false);
      await expect(read()).rejects.toThrow('Only approved users can view this data.');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it.each(reads)('%s reads for an approved steward', async (_name, read) => {
      // The mocked tables are empty, so some reads end in "not found". The check passed if the read ran.
      await read().catch(() => undefined);
      expect(mockFrom).toHaveBeenCalled();
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
      await insertHomepageImageUpload([{ ...row, user_id: OTHER } as Parameters<typeof insertHomepageImageUpload>[0][number]]);
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
