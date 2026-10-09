import {
  archiveSiteInspectionReport,
  getArchivedSiteInspectionReports,
  getSiteInspectionReportDeleteImpact,
  permanentlyDeleteSiteInspectionReport,
  restoreSiteInspectionReport,
  type SiteInspectionReportDeleteImpact,
} from '../../utils/supabase/queries';
import { deleteObjectsByKeys } from '../../utils/media/s3Delete';
import { createClient, createServerSupabase } from '../../utils/supabase/server';

jest.mock('../../utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

jest.mock('../../utils/media/s3Delete', () => ({
  deleteObjectsByKeys: jest.fn(),
}));

const impact: SiteInspectionReportDeleteImpact = {
  responseId: 41,
  inspectionNo: '2026-041',
  inspectionDate: '2026-10-08',
  siteName: 'Duck Lake',
  answerCount: 18,
  attachmentCount: 2,
};

function mockCaller(role: string | null, approved = true) {
  const user = role === null
    ? null
    : { id: 'caller-uuid', app_metadata: { role, authenticated: approved } };
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  });
}

describe('Site Inspection Report archive queries', () => {
  const mockRpc = jest.fn();
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller('admin');
    (createServerSupabase as jest.Mock).mockReturnValue({
      rpc: mockRpc,
      from: mockFrom,
    });
    (deleteObjectsByKeys as jest.Mock).mockResolvedValue(undefined);
  });

  it.each([
    ['a steward', 'steward', true],
    ['an unapproved admin', 'admin', false],
    ['a signed-out caller', null, true],
  ])('rejects %s before a privileged client is created', async (_label, role, approved) => {
    mockCaller(role, approved);

    await expect(archiveSiteInspectionReport(41)).rejects.toThrow(
      'Only approved admins can manage reports.'
    );
    await expect(restoreSiteInspectionReport(41)).rejects.toThrow(
      'Only approved admins can manage reports.'
    );
    await expect(permanentlyDeleteSiteInspectionReport(41)).rejects.toThrow(
      'Only approved admins can manage reports.'
    );
    await expect(getArchivedSiteInspectionReports()).rejects.toThrow(
      'Only approved admins can manage reports.'
    );
    expect(createServerSupabase).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid report ID %s before an RPC call',
    async (responseId) => {
      await expect(archiveSiteInspectionReport(responseId)).rejects.toThrow(
        'A valid report ID is required.'
      );
      expect(mockRpc).not.toHaveBeenCalled();
    }
  );

  it('gets the confirmation counts', async () => {
    mockRpc.mockResolvedValue({ data: impact, error: null });

    await expect(getSiteInspectionReportDeleteImpact(41)).resolves.toEqual(impact);
    expect(mockRpc).toHaveBeenCalledWith(
      'get_site_inspection_report_delete_impact',
      { p_response_id: 41 }
    );
  });

  it('archives and restores the report through separate RPCs', async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: { responseId: 41, archivedAt: '2026-10-09T10:00:00.000Z' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { responseId: 41 }, error: null });

    await expect(archiveSiteInspectionReport(41)).resolves.toEqual({
      responseId: 41,
      archivedAt: '2026-10-09T10:00:00.000Z',
    });
    await expect(restoreSiteInspectionReport(41)).resolves.toEqual({ responseId: 41 });
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'archive_site_inspection_report', {
      p_response_id: 41,
    });
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'restore_site_inspection_report', {
      p_response_id: 41,
    });
  });

  it('permanently deletes an archived report and then removes its S3 objects', async () => {
    mockRpc.mockResolvedValue({
      data: { ...impact, storageKeys: ['sir/one.jpg', 'sir/two.jpg'] },
      error: null,
    });

    await expect(permanentlyDeleteSiteInspectionReport(41)).resolves.toEqual({
      impact,
      storageCleanupComplete: true,
    });
    expect(mockRpc).toHaveBeenCalledWith('permanently_delete_site_inspection_report', {
      p_response_id: 41,
    });
    expect(deleteObjectsByKeys).toHaveBeenCalledWith(['sir/one.jpg', 'sir/two.jpg']);
  });

  it('reports incomplete storage cleanup after the database deletion succeeds', async () => {
    mockRpc.mockResolvedValue({
      data: { ...impact, storageKeys: ['sir/one.jpg'] },
      error: null,
    });
    (deleteObjectsByKeys as jest.Mock).mockRejectedValue(new Error('S3 unavailable'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(permanentlyDeleteSiteInspectionReport(41)).resolves.toEqual({
      impact,
      storageCleanupComplete: false,
    });
    consoleError.mockRestore();
  });

  it('does not delete S3 objects when the database transaction fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Report must be archived first' },
    });

    await expect(permanentlyDeleteSiteInspectionReport(41)).rejects.toThrow(
      'Report must be archived first'
    );
    expect(deleteObjectsByKeys).not.toHaveBeenCalled();
  });

  it('returns archived reports with their site and submitter', async () => {
    const reportQuery = {
      select: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{
          id: 41,
          user_id: 'user-1',
          inspection_no: '2026-041',
          inspection_date: '2026-10-08',
          created_at: '2026-10-08T18:00:00.000Z',
          is_active: false,
          archived_at: '2026-10-09T10:00:00.000Z',
          site_id: 7,
          sites_pa: { id: 7, namesite: 'Duck Lake' },
        }],
        error: null,
      }),
    };
    const peopleQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ id: 12, auth_user_id: 'user-1', display_name: 'Alex Steward' }],
        error: null,
      }),
    };
    mockFrom.mockImplementation((table: string) =>
      table === 'form_responses' ? reportQuery : peopleQuery
    );

    await expect(getArchivedSiteInspectionReports()).resolves.toEqual([{
      id: 41,
      inspectionNo: '2026-041',
      inspectionDate: '2026-10-08',
      createdAt: '2026-10-08T18:00:00.000Z',
      isActive: false,
      archivedAt: '2026-10-09T10:00:00.000Z',
      siteId: 7,
      siteName: 'Duck Lake',
      submitterId: 12,
      submitterName: 'Alex Steward',
    }]);
    expect(reportQuery.not).toHaveBeenCalledWith('archived_at', 'is', null);
  });
});
