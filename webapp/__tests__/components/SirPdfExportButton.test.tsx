import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SirPdfExportButton from '@/components/SirPdfExportButton';

jest.mock('lucide-react', () => {
  const icons = ['Download', 'Loader2'];
  const mocks: Record<string, React.FC<{ className?: string }>> = {};
  icons.forEach((name) => {
    mocks[name] = ({ className }: { className?: string }) =>
      React.createElement('span', { 'data-testid': `icon-${name}`, className });
  });
  return mocks;
});

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('SirPdfExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders an Export PDF button', () => {
    render(<SirPdfExportButton responseId={42} />);

    const button = screen.getByTestId('export-pdf-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Export PDF');
    expect(button).not.toBeDisabled();
  });

  it('starts a single-report export job with images included and tracks it to completion', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ jobId: 'job-1' }, true, 202))
      .mockResolvedValueOnce(jsonResponse({ status: 'complete', downloadUrl: 'https://example.com/report.pdf' }));

    render(<SirPdfExportButton responseId={42} />);
    fireEvent.click(screen.getByTestId('export-pdf-button'));

    await waitFor(() => {
      expect(screen.getByTestId('export-pdf-button')).toHaveTextContent('Downloaded');
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/pdf');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      mode: 'single',
      responseId: 42,
      options: expect.objectContaining({
        includeImages: true,
        maxImagesPerInspection: 20,
        includeEmptyAnswers: false,
      }),
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/pdf/status/job-1');
  });

  it('shows the server error when the export request is refused', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: 'Forbidden - you can only export reports you submitted' }, false, 403)
    );

    render(<SirPdfExportButton responseId={42} />);
    fireEvent.click(screen.getByTestId('export-pdf-button'));

    await waitFor(() => {
      expect(screen.getByTestId('export-pdf-error')).toHaveTextContent(
        'Forbidden - you can only export reports you submitted'
      );
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('shows the job error when PDF generation fails', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ jobId: 'job-1' }, true, 202))
      .mockResolvedValueOnce(jsonResponse({ status: 'failed', error: 'Render failed' }));

    render(<SirPdfExportButton responseId={42} />);
    fireEvent.click(screen.getByTestId('export-pdf-button'));

    await waitFor(() => {
      expect(screen.getByTestId('export-pdf-error')).toHaveTextContent('Render failed');
    });
  });
});
