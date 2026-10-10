import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('does not tell the page when the import fails', async () => {
    mockImport.mockResolvedValue({ success: false, error: 'Bad file.' });
    const onImported = jest.fn();
    const { container } = render(<KmlImportModal open onClose={jest.fn()} onImported={onImported} />);

    chooseFile(container);

    expect(await screen.findByText('Bad file.')).toBeInTheDocument();
    expect(onImported).not.toHaveBeenCalled();
  });
});
