import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GpxTrackUpload, { canUploadGpxTracks } from '@/components/GpxTrackUpload';
import { saveGpxTrack } from '@/utils/gpx-track-actions';
import { getGpxTracksBySite } from '@/utils/supabase/queries';

const mockUpload = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    storage: { from: () => ({ upload: mockUpload }) },
  }),
}));

jest.mock('@/utils/gpx-track-actions', () => ({
  saveGpxTrack: jest.fn(),
}));

jest.mock('@/utils/supabase/queries', () => ({
  getGpxTracksBySite: jest.fn(),
}));

const mockSave = saveGpxTrack as jest.Mock;
const mockTracks = getGpxTracksBySite as jest.Mock;

function makeFile(name: string, sizeBytes = 100): File {
  const file = new File(['<?xml version="1.0"?><gpx/>'], name, { type: 'application/gpx+xml' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function openModal() {
  fireEvent.click(screen.getByTestId('gpx-upload-button'));
}

function chooseFiles(container: HTMLElement, files: File[]) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
}

function statusText(container: HTMLElement, index: number): string | null {
  return container.querySelector(`[data-testid="gpx-file-status-${index}"]`)?.textContent ?? null;
}

describe('canUploadGpxTracks (US 2.0.9)', () => {
  it('allows only a signed-in approved steward or admin', () => {
    expect(canUploadGpxTracks({ role: 'steward', approved: true })).toBe(true);
    expect(canUploadGpxTracks({ role: 'admin', approved: true })).toBe(true);

    expect(canUploadGpxTracks(null)).toBe(false);
    expect(canUploadGpxTracks({ role: 'steward', approved: false })).toBe(false);
    expect(canUploadGpxTracks({ role: 'admin', approved: false })).toBe(false);
    expect(canUploadGpxTracks({ role: 'viewer', approved: true })).toBe(false);
  });
});

describe('GpxTrackUpload (US 2.0.9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } }, error: null });
    mockUpload.mockResolvedValue({ error: null });
    mockSave.mockResolvedValue({ success: true, trackId: 42, trackPointCount: 5 });
    mockTracks.mockResolvedValue([]);
  });

  it('uploads a valid .gpx file and shows it as saved (AT1)', async () => {
    const { container } = render(<GpxTrackUpload siteId={7} />);
    openModal();
    chooseFiles(container, [makeFile('visit.gpx')]);

    await waitFor(() => expect(statusText(container, 0)).toContain('visit.gpx was saved.'));
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(
      7,
      expect.stringMatching(/^user-uuid\/[^/]+\/visit\.gpx$/),
      'visit.gpx'
    );
  });

  it('refuses every file with a fixed message when the session is gone', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { container } = render(<GpxTrackUpload siteId={7} />);
    openModal();
    chooseFiles(container, [makeFile('visit.gpx'), makeFile('second.gpx')]);

    await waitFor(() =>
      expect(statusText(container, 0)).toContain('was refused: Sign in again to upload a GPX track.')
    );
    await waitFor(() =>
      expect(statusText(container, 1)).toContain('was refused: Sign in again to upload a GPX track.')
    );
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('refuses a file without the .gpx extension with a message that only GPX is accepted (AT2)', async () => {
    const { container } = render(<GpxTrackUpload siteId={7} />);
    openModal();
    chooseFiles(container, [makeFile('notes.txt')]);

    await waitFor(() =>
      expect(statusText(container, 0)).toContain('was refused: Only .gpx files are accepted.')
    );
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('refuses a file larger than 50 MB with a message that names the limit (AT5)', async () => {
    const { container } = render(<GpxTrackUpload siteId={7} />);
    openModal();
    chooseFiles(container, [makeFile('huge.gpx', 50 * 1024 * 1024 + 1)]);

    await waitFor(() =>
      expect(statusText(container, 0)).toContain('was refused: The file is larger than 50 MB.')
    );
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('lists every file of a multi-file choice with its own result (AT6)', async () => {
    mockSave
      .mockResolvedValueOnce({ success: true, trackId: 41, trackPointCount: 3 })
      .mockResolvedValueOnce({ success: false, error: 'The file is not a valid GPX track.' });

    const { container } = render(<GpxTrackUpload siteId={7} />);
    openModal();
    chooseFiles(container, [makeFile('morning.gpx'), makeFile('broken.gpx')]);

    await waitFor(() => expect(statusText(container, 0)).toContain('morning.gpx was saved.'));
    await waitFor(() =>
      expect(statusText(container, 1)).toContain('broken.gpx was refused: The file is not a valid GPX track.')
    );
    expect(mockUpload).toHaveBeenCalledTimes(2);
    expect(mockSave).toHaveBeenCalledTimes(2);
  });

  it('shows the reason when the server refuses a staged file (AT3, AT6)', async () => {
    mockSave.mockResolvedValue({ success: false, error: 'The GPX file has no track points.' });

    const { container } = render(<GpxTrackUpload siteId={7} />);
    openModal();
    chooseFiles(container, [makeFile('empty.gpx')]);

    await waitFor(() =>
      expect(statusText(container, 0)).toContain('empty.gpx was refused: The GPX file has no track points.')
    );
  });

  it('shows a fixed message when the bucket upload itself fails', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'bucket not reachable' } });

    const { container } = render(<GpxTrackUpload siteId={7} />);
    openModal();
    chooseFiles(container, [makeFile('visit.gpx')]);

    await waitFor(() =>
      expect(statusText(container, 0)).toContain('visit.gpx was refused: The upload failed. Try again.')
    );
    expect(statusText(container, 0)).not.toContain('bucket not reachable');
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('lists the saved tracks of the site with their point counts (AT4)', async () => {
    mockTracks.mockResolvedValue([
      {
        id: 9,
        originalFileName: 'visit.gpx',
        trackPointCount: 12,
        createdAt: '2026-10-20T12:00:00Z',
      },
    ]);

    render(<GpxTrackUpload siteId={7} />);
    openModal();

    expect(await screen.findByText(/1 saved track on this site/)).toBeInTheDocument();
    expect(screen.getByText(/visit\.gpx \(12 track points\)/)).toBeInTheDocument();
    expect(mockTracks).toHaveBeenCalledWith(7);
  });
});
