import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoActions from '@/app/v2/_components/admin/AdminPhotoActions';
import { AdminPhotoActions as LazyPhotoActions } from '@/app/v2/_components/admin/lazy';
import { useIsAdmin } from '@/app/v2/_components/admin/shared';
import type { Photo } from '@/lib/api/v1/types';
const mockInvalidate = jest.fn();
jest.mock('@/app/v2/_lib/useApi', () => ({ invalidate: (...args: unknown[]) => mockInvalidate(...args), useApi: () => ({ data: { role: 'steward' } }) }));
jest.mock('@/app/v2/_components/admin/shared', () => ({ useIsAdmin: jest.fn(), Confirm: ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => <div><button onClick={onClose}>Cancel delete</button><button onClick={onConfirm}>Confirm delete</button></div>, toast: jest.fn(), errMsg: (error: Error) => error.message }));
jest.mock('next/dynamic', () => () => function Lazy({ photo }: { photo?: Photo }) { return <span>Lazy photo {photo?.id}</span>; });
const photo = { id: 1, kind: 'attachments', caption: 'Pond', identifier: 'P1', date: '2023-07-23', photographer: 'Ann', canEdit: true } as Photo;
beforeEach(() => { jest.clearAllMocks(); (useIsAdmin as jest.Mock).mockReturnValue(false); global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ updated: true }) }); });
it('(V3-12 AT1) loads the tools for a steward owner through the lazy wrapper', () => {
  const view = render(<LazyPhotoActions photo={photo} onDeleted={jest.fn()} />); expect(screen.getByText('Lazy photo 1')).toBeInTheDocument();
  view.rerender(<LazyPhotoActions photo={{ ...photo, canEdit: false }} onDeleted={jest.fn()} />); expect(screen.queryByText('Lazy photo 1')).not.toBeInTheDocument();
});
it('(V3-12 AT1) saves edited fields and refreshes both galleries without a file upload', async () => {
  const saved = jest.fn(); render(<PhotoActions photo={photo} onDeleted={saved} />);
  expect(screen.queryByRole('button', { name: 'Delete photo' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit photo details' }));
  expect(screen.getByLabelText('date')).toHaveValue('2023-07-23');
  fireEvent.change(screen.getByLabelText('caption'), { target: { value: 'New caption' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save photo details' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(global.fetch).toHaveBeenCalledWith('/api/site-images?id=1&kind=attachments', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ caption: 'New caption', identifier: 'P1', photographer: 'Ann', date: '2023-07-23' }) }));
  expect(mockInvalidate.mock.calls).toEqual([['photos'], ['site-photos']]);
});
it('(V3-12 AT2) keeps the fields and reports a failed save', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Save failed' }) });
  const saved = jest.fn(); render(<PhotoActions photo={photo} onDeleted={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit photo details' })); fireEvent.click(screen.getByRole('button', { name: 'Save photo details' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save failed'); expect(screen.getByLabelText('caption')).toHaveValue('Pond'); expect(saved).not.toHaveBeenCalled();
});
it('(V3-12 AT2) hides all tools from another steward and keeps deletion admin-only', () => {
  const view = render(<PhotoActions photo={{ ...photo, canEdit: false }} onDeleted={jest.fn()} />); expect(screen.queryByRole('button')).not.toBeInTheDocument();
  (useIsAdmin as jest.Mock).mockReturnValue(true); view.rerender(<PhotoActions photo={photo} onDeleted={jest.fn()} />); expect(screen.getByRole('button', { name: 'Delete photo' })).toBeInTheDocument();
});

it('(V3-12 AT2) closes nested editing without sending a photo-navigation key or saving', () => {
  const outside = jest.fn(); render(<div onKeyDown={outside}><PhotoActions photo={photo} onDeleted={jest.fn()} /></div>);
  fireEvent.click(screen.getByRole('button', { name: 'Edit photo details' }));
  fireEvent.keyDown(screen.getByLabelText('caption'), { key: 'ArrowRight' }); expect(outside).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' })); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(global.fetch).not.toHaveBeenCalled();
});
it('(V3-12 AT2) retains admin confirmation before deletion and supports cancellation', async () => {
  (useIsAdmin as jest.Mock).mockReturnValue(true); const saved = jest.fn(); render(<PhotoActions photo={photo} onDeleted={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete photo' })); fireEvent.click(screen.getByRole('button', { name: 'Cancel delete' })); expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete photo' })); fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
  await waitFor(() => expect(saved).toHaveBeenCalled()); expect(global.fetch).toHaveBeenCalledWith('/api/site-images?id=1&kind=attachments', { method: 'DELETE' });
});
