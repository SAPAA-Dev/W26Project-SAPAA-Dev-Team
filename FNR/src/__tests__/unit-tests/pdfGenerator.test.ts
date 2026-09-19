import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { generateSitePDF, sharePDF, PDFFieldConfig, DEFAULT_PDF_FIELDS } from '../../services/pdfGenerator';
import { SiteSummary, InspectionDetail } from '../../services/database';

// Mock expo modules
jest.mock('expo-print');
jest.mock('expo-sharing');
jest.mock('expo-file-system/legacy');

const mockPrintToFileAsync = Print.printToFileAsync as jest.Mock;
const mockIsAvailableAsync = Sharing.isAvailableAsync as jest.Mock;
const mockShareAsync = Sharing.shareAsync as jest.Mock;
const mockCopyAsync = FileSystem.copyAsync as jest.Mock;

describe('pdfGenerator module', () => {
  const mockSite: SiteSummary = {
    id: 1,
    namesite: 'Test Site',
    county: 'Test County',
    inspectdate: '2024-01-01',
  };

  const mockInspection: InspectionDetail = {
    iddetail: 123,
    _type: 'Type A',
    _subtype: 'Subtype B',
    _naregion: 'Region 1',
    _na_subregion_multi: 'Subregion X',
    area_ha: 10,
    area_acre: 25,
    recactivities_multi: 'Hiking; Fishing',
    sapaaweb: 'http://sapaa.example.com',
    inatmap: 'http://inat.example.com',
    naturalness_score: 5,
    naturalness_details: 'Good condition',
    steward: 'Alice',
    steward_guest: 'Bob',
    notes: 'Note 1; Note 2',
    inspectdate: '2024-01-01',
  };

  // Mock console to avoid noisy logs during tests
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSitePDF', () => {
    it('returns a legacy URI when PDF generation succeeds', async () => {
      mockPrintToFileAsync.mockResolvedValue({ uri: 'file://mock/path/test.pdf' });

      const uri = await generateSitePDF({
        site: mockSite,
        inspection: mockInspection,
        fields: DEFAULT_PDF_FIELDS,
      });

      expect(uri).toBe('file://mock/path/test.pdf');
      expect(mockPrintToFileAsync).toHaveBeenCalled();
    });

    it('throws an error when PDF generation fails', async () => {
      mockPrintToFileAsync.mockRejectedValue(new Error('Print failed'));

      await expect(
        generateSitePDF({
          site: mockSite,
          inspection: mockInspection,
          fields: DEFAULT_PDF_FIELDS,
        })
      ).rejects.toThrow('Failed to generate PDF report: Error: Print failed');
    });
  });

  describe('sharePDF', () => {
    const pdfUri = 'file://mock/path/test.pdf';
    const siteName = 'Test Site';

    it('copies the PDF and calls Sharing API when available', async () => {
      mockCopyAsync.mockResolvedValue({});
      mockIsAvailableAsync.mockResolvedValue(true);
      mockShareAsync.mockResolvedValue({});

      await sharePDF(pdfUri, siteName);

      expect(mockCopyAsync).toHaveBeenCalledWith(expect.objectContaining({
        from: pdfUri,
        to: expect.stringContaining('SAPAA_Test_Site_'),
      }));
      expect(mockIsAvailableAsync).toHaveBeenCalled();
      expect(mockShareAsync).toHaveBeenCalled();
    });

    it('throws an error when sharing is not available', async () => {
      mockCopyAsync.mockResolvedValue({});
      mockIsAvailableAsync.mockResolvedValue(false);

      await expect(sharePDF(pdfUri, siteName)).rejects.toThrow('Failed to share PDF report');
    });

    it('throws an error if copyAsync fails', async () => {
      mockCopyAsync.mockRejectedValue(new Error('Copy failed'));
      mockIsAvailableAsync.mockResolvedValue(true);

      await expect(sharePDF(pdfUri, siteName)).rejects.toThrow('Failed to share PDF report');
    });
  });
});
