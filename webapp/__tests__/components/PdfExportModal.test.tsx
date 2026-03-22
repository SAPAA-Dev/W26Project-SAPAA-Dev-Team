import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PdfExportModal from '@/components/PdfExportModal';
import { FormResponse } from '@/utils/supabase/queries';

// Mock lucide-react icons to simple spans
jest.mock('lucide-react', () => {
  const icons = [
    'X', 'Download', 'Loader2', 'FileText', 'Calendar', 'Image',
    'Settings', 'ChevronDown', 'ChevronUp', 'CheckSquare', 'Square',
    'AlertCircle', 'Sparkles', 'MapPin', 'Search',
  ];
  const mocks: Record<string, React.FC<{ className?: string }>> = {};
  icons.forEach((name) => {
    mocks[name] = ({ className }: { className?: string }) =>
      React.createElement('span', { 'data-testid': `icon-${name}`, className });
  });
  return mocks;
});

const mockInspections: FormResponse[] = [
  {
    id: 1,
    user_id: 'u1',
    created_at: '2024-06-15T10:00:00Z',
    inspection_no: 'INS-001',
    naturalness_score: '3.5',
    naturalness_details: 'Good habitat',
    steward: 'Jane',
    answers: [
      {
        question_id: 1,
        question_text: 'Vegetation',
        obs_value: 'Healthy',
        obs_comm: null,
        section_id: 1,
        section_title: 'Flora',
      },
      {
        question_id: 2,
        question_text: 'Wildlife',
        obs_value: 'Present',
        obs_comm: null,
        section_id: 2,
        section_title: 'Fauna',
      },
    ],
  },
  {
    id: 2,
    user_id: 'u2',
    created_at: '2023-12-01T10:00:00Z',
    inspection_no: 'INS-002',
    naturalness_score: '2.0',
    naturalness_details: null,
    steward: null,
    answers: [
      {
        question_id: 1,
        question_text: 'Vegetation',
        obs_value: '',
        obs_comm: null,
        section_id: 1,
        section_title: 'Flora',
      },
    ],
  },
];

describe('PdfExportModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──

  it('returns null when open is false', () => {
    const { container } = render(
      <PdfExportModal open={false} onClose={onClose} mode="site" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open is true', () => {
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Elk Island" />
    );
    expect(screen.getByText('Export PDF Report')).toBeInTheDocument();
    expect(screen.getByText(/Elk Island/)).toBeInTheDocument();
  });

  it('displays correct mode label for single mode', () => {
    render(
      <PdfExportModal open={true} onClose={onClose} mode="single" responseId={42} />
    );
    expect(screen.getByText('Single Inspection')).toBeInTheDocument();
  });

  it('displays correct mode label for multi-site mode', () => {
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="multi-site"
        siteNames={['A', 'B', 'C']}
      />
    );
    expect(screen.getByText('3 of 3 Sites')).toBeInTheDocument();
  });

  it('shows preview count for site mode', () => {
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Test"
        inspections={mockInspections}
      />
    );
    expect(screen.getByText('2 inspections')).toBeInTheDocument();
  });

  it('shows "1 inspection" for single mode', () => {
    render(
      <PdfExportModal open={true} onClose={onClose} mode="single" responseId={1} />
    );
    expect(screen.getByText('1 inspection')).toBeInTheDocument();
  });

  // ── Quick Options ──

  it('renders all quick option buttons', () => {
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );
    expect(screen.getByText('Include Images')).toBeInTheDocument();
    expect(screen.getByText('Cover Page')).toBeInTheDocument();
    expect(screen.getByText('Score Summary')).toBeInTheDocument();
    expect(screen.getByText('Empty Answers')).toBeInTheDocument();
  });

  it('toggles Include Images option', async () => {
    const user = userEvent.setup();
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );

    // Initially off
    expect(screen.getByText('Off')).toBeInTheDocument();

    // Click to enable
    await user.click(screen.getByText('Include Images'));
    expect(screen.getByText(/Max 5\/inspection/)).toBeInTheDocument();
  });

  // ── Date Range ──

  it('shows date range for site mode', () => {
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  it('hides date range for single mode', () => {
    render(
      <PdfExportModal open={true} onClose={onClose} mode="single" responseId={1} />
    );
    expect(screen.queryByText('Date Range')).not.toBeInTheDocument();
  });

  it('filters preview count by date range', async () => {
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Test"
        inspections={mockInspections}
      />
    );

    // Both inspections visible
    expect(screen.getByText('2 inspections')).toBeInTheDocument();

    // Set "from" date to only include the 2024 inspection
    const dateInputs = screen.getAllByDisplayValue('');
    const fromInput = dateInputs.find(
      (el) => el.getAttribute('type') === 'date'
    )!;
    fireEvent.change(fromInput, { target: { value: '2024-01-01' } });

    await waitFor(() => {
      expect(screen.getByText('1 inspection')).toBeInTheDocument();
    });
  });

  // ── Inspection Selection ──

  it('shows inspection selection for site mode with inspections', () => {
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Test"
        inspections={mockInspections}
      />
    );
    expect(screen.getByText('Select Inspections')).toBeInTheDocument();
    expect(screen.getByText('All selected')).toBeInTheDocument();
  });

  it('hides inspection selection for multi-site mode', () => {
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="multi-site"
        siteNames={['A']}
        inspections={mockInspections}
      />
    );
    expect(screen.queryByText('Select Inspections')).not.toBeInTheDocument();
  });

  // ── Advanced Options ──

  it('toggles advanced options panel', async () => {
    const user = userEvent.setup();
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );

    expect(screen.queryByText('Sort Order')).not.toBeInTheDocument();

    await user.click(screen.getByText('Advanced Options'));

    expect(screen.getByText('Sort Order')).toBeInTheDocument();
    expect(screen.getByText('Page Size')).toBeInTheDocument();
    expect(screen.getByText('Newest First')).toBeInTheDocument();
    expect(screen.getByText('US Letter')).toBeInTheDocument();
  });

  it('shows section filter when inspections have sections', async () => {
    const user = userEvent.setup();
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Test"
        inspections={mockInspections}
      />
    );

    await user.click(screen.getByText('Advanced Options'));

    expect(screen.getByText('Sections')).toBeInTheDocument();
    expect(screen.getByText('Flora')).toBeInTheDocument();
    expect(screen.getByText('Fauna')).toBeInTheDocument();
  });

  it('shows max images slider only when images enabled', async () => {
    const user = userEvent.setup();
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );

    await user.click(screen.getByText('Advanced Options'));
    expect(screen.queryByText(/Max images per inspection/)).not.toBeInTheDocument();

    await user.click(screen.getByText('Include Images'));
    expect(screen.getByText(/Max images per inspection: 5/)).toBeInTheDocument();
  });

  // ── Close Behavior ──

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );

    await user.click(screen.getByTestId('icon-X').closest('button')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking backdrop', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PdfExportModal open={true} onClose={onClose} mode="site" siteName="Test" />
    );

    const backdrop = container.firstChild as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Export Button State ──

  it('disables export when preview count is 0 in site mode', () => {
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Test"
        inspections={[]}
      />
    );

    const exportBtn = screen.getByText('Export PDF').closest('button');
    expect(exportBtn).toBeDisabled();
  });

  it('enables export for single mode even without inspections', () => {
    render(
      <PdfExportModal open={true} onClose={onClose} mode="single" responseId={1} />
    );

    const exportBtn = screen.getByText('Export PDF').closest('button');
    expect(exportBtn).not.toBeDisabled();
  });

  // ── Export Flow ──

  it('calls fetch with correct body on export', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf'])),
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="test.pdf"',
      }),
    });
    global.fetch = mockFetch;
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();

    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Elk Island"
        inspections={mockInspections}
      />
    );

    await user.click(screen.getByText('Export PDF'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.mode).toBe('site');
    expect(body.siteName).toBe('Elk Island');
    expect(body.options.includeCoverPage).toBe(true);
    expect(body.options.includeNaturalnessSummary).toBe(true);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays error when export fails', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Test"
        inspections={mockInspections}
      />
    );

    await user.click(screen.getByText('Export PDF'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows loading state during export', async () => {
    let resolveExport: (value: any) => void;
    const exportPromise = new Promise((resolve) => {
      resolveExport = resolve;
    });
    global.fetch = jest.fn().mockReturnValue(exportPromise);

    const user = userEvent.setup();
    render(
      <PdfExportModal
        open={true}
        onClose={onClose}
        mode="site"
        siteName="Test"
        inspections={mockInspections}
      />
    );

    await user.click(screen.getByText('Export PDF'));

    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    // Resolve the fetch
    resolveExport!({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf'])),
      headers: new Headers({ 'Content-Disposition': 'attachment; filename="t.pdf"' }),
    });

    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });
});
