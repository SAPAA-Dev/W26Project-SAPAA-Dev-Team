import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import KmlImportModal from '@/components/KmlImportModal';
import { importProtectedAreasFromStorage } from '@/utils/kml-import-actions';

const mockUpload = jest.fn();

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ storage: { from: () => ({ upload: mockUpload }) } }),
}));

jest.mock('@/utils/kml-import-actions', () => ({
  importProtectedAreasFromStorage: jest.fn(),
}));

const mockImport = importProtectedAreasFromStorage as jest.Mock;

function chooseFile(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['<kml/>'], 'areas.kml', { type: 'application/vnd.google-earth.kml+xml' });
  fireEvent.change(input, { target: { files: [file] } });
}

describe('KmlImportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
  });

  it('tells the page after a successful import', async () => {
    mockImport.mockResolvedValue({ success: true, upserted: 3, skipped: 0, warnings: [] });
    const onImported = jest.fn();
    const { container } = render(<KmlImportModal open onClose={jest.fn()} onImported={onImported} />);

    chooseFile(container);

    expect(await screen.findByText('Imported 3 protected areas.')).toBeInTheDocument();
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it('(6.0.1 AT3) lists the sites that have no boundary after an import', async () => {
    mockImport.mockResolvedValue({
      success: true,
      upserted: 1,
      skipped: 0,
      warnings: [],
      unlinkedSites: ['Alpha (NA)', 'Beta (WPP)'],
    });
    const { container } = render(<KmlImportModal open onClose={jest.fn()} />);

    chooseFile(container);

    const block = await screen.findByTestId('unlinked-sites');
    expect(within(block).getByText('2 sites have no boundary')).toBeInTheDocument();
    expect(within(block).getByText('Alpha (NA)')).toBeInTheDocument();
    expect(within(block).getByText('Beta (WPP)')).toBeInTheDocument();
  });

  it('(6.0.1 AT3) hides the boundary list when every site has a boundary', async () => {
    mockImport.mockResolvedValue({
      success: true,
      upserted: 1,
      skipped: 0,
      warnings: [],
      unlinkedSites: [],
    });
    const { container } = render(<KmlImportModal open onClose={jest.fn()} />);

    chooseFile(container);

    expect(await screen.findByText('Imported 1 protected areas.')).toBeInTheDocument();
    expect(screen.queryByTestId('unlinked-sites')).not.toBeInTheDocument();
  });

  it('does not tell the page when the import fails', async () => {
    mockImport.mockResolvedValue({ success: false, error: 'Bad file.' });
    const onImported = jest.fn();
    const { container } = render(<KmlImportModal open onClose={jest.fn()} onImported={onImported} />);

    chooseFile(container);

    expect(await screen.findByText('Bad file.')).toBeInTheDocument();
    expect(onImported).not.toHaveBeenCalled();
  });
});
