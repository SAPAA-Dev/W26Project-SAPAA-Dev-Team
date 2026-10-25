import { act, fireEvent, render, screen } from '@testing-library/react';
import ExportAllFilesButton from '@/components/ExportAllFilesButton';

const response = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });

describe('ExportAllFilesButton (3.0.3)', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });
  afterEach(() => jest.useRealTimers());

  async function click() {
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Export all files' })); });
  }

  async function tick() {
    await act(async () => { await jest.advanceTimersByTimeAsync(3000); });
  }

  it('starts the export, waits while it runs and then offers the ZIP (AT1, AT2)', async () => {
    fetchMock
      .mockResolvedValueOnce(response(202, { jobId: 'job-1' }))
      .mockResolvedValueOnce(response(200, { status: 'processing', error: null }))
      .mockResolvedValueOnce(response(200, { status: 'complete', downloadUrl: 'https://s3.example.com/all.zip' }));
    render(<ExportAllFilesButton />);

    await click();
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/export', { method: 'POST' });
    expect(screen.getByRole('button', { name: /Preparing the ZIP/ })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Keep this page open');

    await tick();
    expect(screen.queryByTestId('export-download')).not.toBeInTheDocument();

    await tick();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/export/status/job-1');
    expect(screen.getByTestId('export-download')).toHaveAttribute('href', 'https://s3.example.com/all.zip');
    expect(screen.getByRole('button', { name: 'Export all files' })).toBeEnabled();
  });

  it('shows the reason when the export fails and offers no download', async () => {
    fetchMock
      .mockResolvedValueOnce(response(202, { jobId: 'job-1' }))
      .mockResolvedValueOnce(response(200, { status: 'failed', error: 'These files could not be read: images/a.jpg.' }));
    render(<ExportAllFilesButton />);

    await click();
    await tick();

    expect(screen.getByRole('alert')).toHaveTextContent('These files could not be read: images/a.jpg.');
    expect(screen.queryByTestId('export-download')).not.toBeInTheDocument();
  });

  it('shows the refusal when a person who is not an admin calls the route', async () => {
    fetchMock.mockResolvedValueOnce(response(403, { error: 'Forbidden - admin access required' }));
    render(<ExportAllFilesButton />);

    await click();

    expect(screen.getByRole('alert')).toHaveTextContent('Forbidden - admin access required');
  });

  it('follows the export that is already running when the server answers 409', async () => {
    fetchMock
      .mockResolvedValueOnce(response(409, { error: 'An export is already running.', jobId: 'job-0' }))
      .mockResolvedValueOnce(response(200, { status: 'complete', downloadUrl: 'https://s3.example.com/old.zip' }));
    render(<ExportAllFilesButton />);

    await click();
    await act(async () => { await Promise.resolve(); });

    expect(fetchMock).toHaveBeenLastCalledWith('/api/export/status/job-0');
    expect(screen.getByTestId('export-download')).toHaveAttribute('href', 'https://s3.example.com/old.zip');
  });

  it('stops asking for the status when the page is closed', async () => {
    fetchMock
      .mockResolvedValueOnce(response(202, { jobId: 'job-1' }))
      .mockResolvedValue(response(200, { status: 'processing', error: null }));
    const { unmount } = render(<ExportAllFilesButton />);

    await click();
    unmount();
    await tick();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
