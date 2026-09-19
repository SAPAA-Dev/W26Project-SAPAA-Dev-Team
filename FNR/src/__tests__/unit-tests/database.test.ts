import { supabase } from '../../services/supabase';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import {
  getSitesOnline,
  getInspectionDetailsOnline,
  downloadSiteBundle,
  getDownloadedSites,
  cleanupExpiredSites,
  manualDeleteSites,
  InspectionDetail,
  DownloadedSite,
} from '../../services/database';

// ------------------
// Mock Supabase
// ------------------
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// ------------------
// Mock FileSystem & SQLite
// ------------------
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn(),
  copyAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Data service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  // ------------------
  // Online tests
  // ------------------
  describe('getSitesOnline', () => {
    it('returns mapped SiteSummary array', async () => {
      const mockData = [
        { namesite: 'Site A', county: 'County 1', inspectdate: '2025-01-01' },
        { namesite: 'Site B', county: 'County 2', inspectdate: '2025-02-01' },
      ];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await getSitesOnline();

      expect(result).toEqual([
        { id: 1, namesite: 'Site A', county: 'County 1', inspectdate: '2025-01-01' },
        { id: 2, namesite: 'Site B', county: 'County 2', inspectdate: '2025-02-01' },
      ]);
    });
  });

  /*
  describe('getInspectionDetailsOnline', () => {
    it('returns mapped InspectionDetail array with full fields', async () => {
      const mockData: any[] = [
        {
          namesite: 'Site A',
          _type: 'Type1',
          _subtype: 'Subtype1',
          _naregion: 'Region1',
          _na_subregion_multi: 'SubRegionMulti',
          'area-ha': '100',
          'area-acre': '247',
          'recactivities-multi': 'Hiking',
          sapaaweb: 'link1',
          inatmap: 'link2',
          inspectno: '123',
          inspectdate: '2025-01-01',
          steward: 'John',
          steward_guest: 'Jane',
          category: 1,
          definition: 'Test definition',
          county: 'County1',
          naturalness_score: '10',
          naturalness_details: 'Good',
          notes: 'None',
          iddetail: 'id-1',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await getInspectionDetailsOnline('Site A');

      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        id: 1,
        namesite: 'Site A',
        _type: 'Type1',
        _subtype: 'Subtype1',
        _naregion: 'Region1',
        _na_subregion_multi: 'SubRegionMulti',
        area_ha: '100',
        area_acre: '247',
        recactivities_multi: 'Hiking',
        sapaaweb: 'link1',
        inatmap: 'link2',
        inspectno: '123',
        inspectdate: '2025-01-01',
        steward: 'John',
        steward_guest: 'Jane',
        category: 1,
        definition: 'Test definition',
        county: 'County1',
        naturalness_score: '10',
        naturalness_details: 'Good',
        notes: 'None',
        iddetail: 'id-1',
      });
    });

    
  });
  */ 

  // ------------------
  // Offline / local DB tests
  // ------------------
  describe('offline DB', () => {
    let mockDb: any;

    beforeEach(() => {
      // Full SQLite mock with required methods
      mockDb = {
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockResolvedValue(undefined),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getAllSync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue({ inspectdate: '2025-01-01', county: 'County1' }),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    });

    it('downloadSiteBundle creates table and inserts data', async () => {
      const data = [
        {
          namesite: 'Site A',
          iddetail: 'id-1',
          _type: 'Type1',
          _subtype: 'S1',
          'area-ha': '100',
          'area-acre': '247',
          _naregion: 'R1',
          _na_subregion_multi: 'R2',
          'recactivities-multi': 'Hiking',
          sapaaweb: 'link1',
          inatmap: 'link2',
          inspectno: '123',
          inspectdate: '2025-01-01',
          steward: 'John',
          steward_guest: 'Jane',
          category: 1,
          definition: 'Def',
          county: 'County1',
          naturalness_score: '10',
          naturalness_details: 'Good',
          notes: 'None',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data, error: null }),
      });

      (FileSystemLegacy.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      (FileSystemLegacy.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystemLegacy.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      await expect(downloadSiteBundle('Site A')).resolves.not.toThrow();

      expect(mockDb.execAsync).toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(mockDb.closeAsync).toHaveBeenCalled();
    });

    it('getDownloadedSites returns sites with lastAccessed', async () => {
      (FileSystemLegacy.readDirectoryAsync as jest.Mock).mockResolvedValue(['Site A']);
      (FileSystemLegacy.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ lastAccessed: 12345 }));

      const sites = await getDownloadedSites();
      expect(sites).toEqual([
        { id: 1, namesite: 'Site A', county: 'County1', inspectdate: '2025-01-01', lastAccessed: 12345 },
      ]);
    });

    it('cleanupExpiredSites deletes expired sites', async () => {
      const tenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 10; // 10 days ago

      (FileSystemLegacy.readDirectoryAsync as jest.Mock).mockResolvedValue(['Site A']);
      (FileSystemLegacy.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystemLegacy.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify({ lastAccessed: tenDaysAgo }));
      (FileSystemLegacy.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      await cleanupExpiredSites(7); // 7 days

      expect(FileSystemLegacy.deleteAsync).toHaveBeenCalledWith('/mock/documents/sites/Site A', { idempotent: true });
    });


    it('manualDeleteSites deletes selected sites', async () => {
      (FileSystemLegacy.deleteAsync as jest.Mock).mockResolvedValue(undefined);
      await manualDeleteSites(['Site A']);
      expect(FileSystemLegacy.deleteAsync).toHaveBeenCalledWith('/mock/documents/sites/Site A', { idempotent: true });
    });
  });
});
