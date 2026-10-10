import {
  archiveSite,
  restoreSite,
  permanentlyDeleteSite,
  getArchivedSites,
  getSiteDeleteImpact,
  type SiteArchiveResult,
  type SiteDeleteImpact,
  type SiteRestoreResult,
} from '../../utils/supabase/queries';
import {
  createClient,
  createServerSupabase,
} from '../../utils/supabase/server';

jest.mock('../../utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

const impact: SiteDeleteImpact = {
  siteId: 27,
  siteName: 'Duck Lake',
  inspectionCount: 3,
  answerCount: 12,
  attachmentCount: 2,
  homepageImageCount: 1,
  siteStewardCount: 1,
};

const archiveResult: SiteArchiveResult = {
  siteId: 27,
  siteName: 'Duck Lake',
  archivedAt: '2026-10-08T20:00:00.000Z',
};

const restoreResult: SiteRestoreResult = {
  siteId: 27,
  siteName: 'Duck Lake',
};

function mockCaller(role: string | null, approved = true) {
  const user = role === null
    ? null
    : {
        id: 'caller-uuid',
        app_metadata: { role, authenticated: approved },
      };

  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
  });
}

describe('site archive queries', () => {
  const mockRpc = jest.fn();
  const mockOrder = jest.fn();
  const mockNot = jest.fn();
  const mockSelect = jest.fn();
  const mockFrom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCaller('admin');
    mockNot.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ not: mockNot });
    mockFrom.mockReturnValue({ select: mockSelect });
    (createServerSupabase as jest.Mock).mockReturnValue({
      rpc: mockRpc,
      from: mockFrom,
    });
  });

  describe('getSiteDeleteImpact', () => {
    it('returns the connected record counts for an approved administrator', async () => {
      mockRpc.mockResolvedValue({ data: impact, error: null });

      await expect(getSiteDeleteImpact(27)).resolves.toEqual(impact);
      expect(mockRpc).toHaveBeenCalledWith('get_site_delete_impact', {
        p_site_id: 27,
      });
    });

    it.each([0, -1, 1.5, Number.NaN])(
      'rejects invalid site id %s before the database call',
      async (siteId) => {
        await expect(getSiteDeleteImpact(siteId)).rejects.toThrow(
          'A valid site ID is required.'
        );
        expect(mockRpc).not.toHaveBeenCalled();
      }
    );

    it('reports a site that no longer exists', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(getSiteDeleteImpact(27)).rejects.toThrow('Site not found.');
    });

    it('returns the database error when the impact query fails', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Impact query failed' },
      });

      await expect(getSiteDeleteImpact(27)).rejects.toThrow(
        'Impact query failed'
      );
    });
  });

  describe('authorization', () => {
    it.each([
      ['a steward', 'steward', true],
      ['an unapproved administrator', 'admin', false],
      ['a signed-out caller', null, true],
    ])('rejects %s before any archive RPC runs', async (_label, role, approved) => {
      mockCaller(role, approved);

      await expect(archiveSite(27)).rejects.toThrow(
        'Only admins can edit sites.'
      );
      await expect(restoreSite(27)).rejects.toThrow(
        'Only admins can edit sites.'
      );
      await expect(permanentlyDeleteSite(27)).rejects.toThrow(
        'Only admins can edit sites.'
      );
      await expect(getArchivedSites()).rejects.toThrow(
        'Only admins can edit sites.'
      );
      expect(createServerSupabase).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('archiveSite', () => {
    it('returns the archive result for an approved administrator', async () => {
      mockRpc.mockResolvedValue({ data: archiveResult, error: null });

      await expect(archiveSite(27)).resolves.toEqual(archiveResult);
      expect(mockRpc).toHaveBeenCalledWith('archive_site', {
        p_site_id: 27,
      });
    });

    it.each([0, -1, 1.5, Number.NaN])(
      'rejects invalid site id %s before the database call',
      async (siteId) => {
        await expect(archiveSite(siteId)).rejects.toThrow(
          'A valid site ID is required.'
        );
        expect(mockRpc).not.toHaveBeenCalled();
      }
    );

    it('returns the database error when the archive transaction fails', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Site 27 is already archived' },
      });

      await expect(archiveSite(27)).rejects.toThrow(
        'Site 27 is already archived'
      );
    });

    it('rejects an empty transaction result', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(archiveSite(27)).rejects.toThrow(
        'The database did not return an archive result.'
      );
    });
  });

  describe('restoreSite', () => {
    it('returns the restore result for an approved administrator', async () => {
      mockRpc.mockResolvedValue({ data: restoreResult, error: null });

      await expect(restoreSite(27)).resolves.toEqual(restoreResult);
      expect(mockRpc).toHaveBeenCalledWith('restore_site', {
        p_site_id: 27,
      });
    });

    it.each([0, -1, 1.5, Number.NaN])(
      'rejects invalid site id %s before the database call',
      async (siteId) => {
        await expect(restoreSite(siteId)).rejects.toThrow(
          'A valid site ID is required.'
        );
        expect(mockRpc).not.toHaveBeenCalled();
      }
    );

    it('returns the database error when the restore transaction fails', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Site 27 is not archived' },
      });

      await expect(restoreSite(27)).rejects.toThrow('Site 27 is not archived');
    });

    it('rejects an empty transaction result', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(restoreSite(27)).rejects.toThrow(
        'The database did not return a restore result.'
      );
    });
  });

  describe('permanentlyDeleteSite', () => {
    it('returns the connected record counts for an approved administrator', async () => {
      mockRpc.mockResolvedValue({ data: impact, error: null });

      await expect(permanentlyDeleteSite(27)).resolves.toEqual(impact);
      expect(mockRpc).toHaveBeenCalledWith('permanently_delete_site', {
        p_site_id: 27,
      });
    });

    it.each([0, -1, 1.5, Number.NaN])(
      'rejects invalid site id %s before the database call',
      async (siteId) => {
        await expect(permanentlyDeleteSite(siteId)).rejects.toThrow(
          'A valid site ID is required.'
        );
        expect(mockRpc).not.toHaveBeenCalled();
      }
    );

    it('returns the database error when the delete transaction fails', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Site 27 must be archived before it can be permanently deleted' },
      });

      await expect(permanentlyDeleteSite(27)).rejects.toThrow(
        'Site 27 must be archived before it can be permanently deleted'
      );
    });

    it('rejects an empty transaction result', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(permanentlyDeleteSite(27)).rejects.toThrow(
        'The database did not return a deletion result.'
      );
    });
  });

  describe('getArchivedSites', () => {
    it('returns only archived sites, newest archive first', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 27,
            namesite: 'Duck Lake',
            ab_county: 4,
            is_active: true,
            archived_at: '2026-10-08T20:00:00.000Z',
            protected_area_id: 9,
            ab_counties: { county: 'Quack County' },
            form_responses: [{ inspection_date: '2026-10-01', created_at: null }],
          },
        ],
        error: null,
      });

      await expect(getArchivedSites()).resolves.toEqual([
        {
          id: 27,
          namesite: 'Duck Lake',
          county: 'Quack County',
          ab_county: 4,
          inspectdate: '2026-10-01',
          is_active: true,
          archived_at: '2026-10-08T20:00:00.000Z',
          protected_area_id: 9,
        },
      ]);
      expect(mockFrom).toHaveBeenCalledWith('sites_pa');
      expect(mockNot).toHaveBeenCalledWith('archived_at', 'is', null);
      expect(mockOrder).toHaveBeenCalledWith('archived_at', { ascending: false });
    });

    it('returns the database error when the query fails', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Archived sites query failed' },
      });

      await expect(getArchivedSites()).rejects.toThrow(
        'Archived sites query failed'
      );
    });
  });
});
