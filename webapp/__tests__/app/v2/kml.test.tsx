import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import KmlImportSheet from '@/app/v2/_components/admin/KmlImportSheet';
import { importProtectedAreasFromStorage } from '@/utils/kml-import-actions';
import { invalidate } from '@/app/v2/_lib/useApi';

const mockUpload = jest.fn();
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ storage: { from: (bucket: string) => {
    expect(bucket).toBe('kml-imports');
    return { upload: mockUpload };
  } } }),
}));
jest.mock('@/utils/kml-import-actions', () => ({ importProtectedAreasFromStorage: jest.fn() }));
jest.mock('@/app/v2/_lib/useApi', () => ({
  invalidate: jest.fn(),
}));
jest.mock('@/app/v2/_components/admin/shared', () => ({
  toast: jest.fn(),
  errMsg: (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback,
  plural: (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`,
}));
jest.mock('@/app/v2/_components/flows/ui', () => ({
  btn: { primary: '' },
  Sheet: ({ open, title, children }: React.PropsWithChildren<{ open: boolean; title: string }>) => open ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUpload.mockResolvedValue({ error: null });
  jest.mocked(importProtectedAreasFromStorage).mockResolvedValue({ success: true, upserted: 2, warnings: [], unlinkedSites: [] });
});

function choose(container: HTMLElement, file: File) {
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
}

it.each([
  ['areas.kml', 'application/vnd.google-earth.kml+xml'],
  ['areas.kmz', 'application/vnd.google-earth.kmz'],
])('uploads %s, calls the main import action and refreshes all affected views', async (name, contentType) => {
  const file = new File(['example'], name);
  const { container } = render(<KmlImportSheet open onClose={jest.fn()} />);
  choose(container, file);
  expect(await screen.findByText('Imported 2 protected areas.')).toBeInTheDocument();
  const path = mockUpload.mock.calls[0][0];
  expect(path).toMatch(/^kml-imports\/[^/]+\/areas\.km[lz]$/);
  expect(mockUpload).toHaveBeenCalledWith(path, file, { cacheControl: '3600', upsert: false, contentType });
  expect(importProtectedAreasFromStorage).toHaveBeenCalledWith(path);
  expect(jest.mocked(invalidate).mock.calls.map(([prefix]) => prefix)).toEqual(['boundaries', 'admin:', 'site:', 'sites']);
});

it('rejects the wrong extension and files larger than 50 MB before upload', () => {
  const { container } = render(<KmlImportSheet open onClose={jest.fn()} />);
  choose(container, new File(['example'], 'areas.txt'));
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a .kml or .kmz file.');
  const file = new File(['example'], 'areas.kml');
  Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 + 1 });
  choose(container, file);
  expect(screen.getByRole('alert')).toHaveTextContent('The file is larger than 50 MB.');
  expect(mockUpload).not.toHaveBeenCalled();
  expect(importProtectedAreasFromStorage).not.toHaveBeenCalled();
});

it('shows storage errors and does not start parsing after a failed upload', async () => {
  mockUpload.mockResolvedValue({ error: { message: 'Upload refused' } });
  const { container } = render(<KmlImportSheet open onClose={jest.fn()} />);
  choose(container, new File(['example'], 'areas.kml'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Upload refused');
  expect(importProtectedAreasFromStorage).not.toHaveBeenCalled();
});

it('shows parser errors without reporting a successful import', async () => {
  jest.mocked(importProtectedAreasFromStorage).mockResolvedValue({ success: false, error: 'The file is not a KML document.' });
  const { container } = render(<KmlImportSheet open onClose={jest.fn()} />);
  choose(container, new File(['example'], 'areas.kml'));
  expect(await screen.findByRole('alert')).toHaveTextContent('The file is not a KML document.');
  expect(invalidate).not.toHaveBeenCalled();
});

it('keeps import warnings and the names of sites with no matching boundary', async () => {
  jest.mocked(importProtectedAreasFromStorage).mockResolvedValue({ success: true, upserted: 2, skipped: 1, warnings: ['One point was skipped'], unlinkedSites: ['Unmatched site'] });
  const { container } = render(<KmlImportSheet open onClose={jest.fn()} />);
  choose(container, new File(['example'], 'areas.kmz'));
  expect(await screen.findByText('Unmatched site')).toBeInTheDocument();
  expect(screen.getByText('One point was skipped')).toBeInTheDocument();
  expect(screen.getByText(/1 placemark was skipped/)).toBeInTheDocument();
});
