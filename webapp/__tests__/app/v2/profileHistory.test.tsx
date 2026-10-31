import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { invalidate } from '@/app/v2/_lib/useApi';
import YouPage from '@/app/v2/me/page';

const mockKeys: (string | null)[] = [];
let mockProfileFailed = false;
let mockLegacyProfile = false;
jest.mock('next/navigation', () => ({ useRouter: () => ({ back: jest.fn() }), usePathname: () => '/v2/me', useSearchParams: () => new URLSearchParams() }));
jest.mock('@/app/v2/me/EditProfileSheet', () => ({ EditProfileSheet: ({ open, onSaved, onClose }: { open: boolean; onSaved: (value: { displayName: string }, done: boolean) => void; onClose: () => void }) => open ? <div role="dialog"><button onClick={() => onSaved({ displayName: 'Saved Owner' }, true)}>Save profile</button><button onClick={() => onSaved({ displayName: 'Partial Owner' }, false)}>Partial save</button><button onClick={onClose}>Close editor</button></div> : null }));
jest.mock('@/app/v2/_components/sites/PhotoHero', () => ({ __esModule: true, default: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('@/app/v2/_components/flows/ui', () => {
  const React = jest.requireActual('react');
  return {
    btn: { onPhoto: '', secondary: '' }, card: '', heroTitle: '', raised: '', tabBarPadding: {},
    useToast: () => React.useState(''),
    Toast: ({ message }: { message: string }) => <p role="status">{message}</p>,
    SectionTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
    ErrorState: ({ title }: { title: string }) => <p role="alert">{title}</p>,
  };
});
jest.mock('@/app/v2/_lib/useApi', () => ({
  invalidate: jest.fn(),
  useApi: (key: string | null) => {
    mockKeys.push(key);
    const page = key?.endsWith(':2') ? 2 : 1;
    const history = { items: [{ id: 7, siteId: 5, siteSlug: 'Park', siteName: 'Park', siteArchived: false, siteInactive: false, canOpen: true, date: '2026-09-12' }], page, pageSize: 10, total: 12 };
    const profile = { profile: { id: 1, displayName: 'Owner', skills: ['Botany'], focusAreas: ['Wetlands'], socials: { email: 'owner@example.test', website: 'https://example.test' }, role: 'Steward' }, isOwner: true, history: mockLegacyProfile ? history.items.map(({ id, siteId, siteName, siteArchived, siteInactive, date }) => ({ id, siteId, siteName, siteArchived, siteInactive, inspectionDate: date })) : history.items, pagination: { page: 1, pageSize: 10, total: 12 }, stats: { inspectionCount: 12, distinctSiteCount: 1 } };
    return {
      data: key === 'me' ? { email: 'owner@example.test', role: 'steward', person: { id: 1, name: 'Owner' }, stats: { reports: 12, sites: 1 }, assignedSiteIds: [5] }
        : key === 'profile:me' ? mockProfileFailed ? undefined : profile
        : key?.startsWith('profile:history:') ? history : key === 'sites' ? [{ id: 5, name: 'Park', slug: 'Park', steward: { id: 1, name: 'Owner' }, status: 'recent', daysSince: 5 }] : key === 'reports' ? [{ id: 7, isOwn: true, date: '2026-09-12', siteId: 5, siteName: 'Park' }] : key ? [] : undefined,
      error: key === 'profile:me' && mockProfileFailed ? new Error('Unavailable') : null,
      loading: false, refetch: jest.fn(),
    };
  },
}));
beforeEach(() => { mockKeys.length = 0; mockProfileFailed = false; mockLegacyProfile = false; });

it('uses profile history for page one and requests later pages only when needed', () => {
  render(<YouPage />);
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  expect(mockKeys).not.toContain('profile:history:me:1');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(mockKeys).toContain('profile:history:me:2');
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
});
it('keeps history available when the main profile read fails', () => {
  mockProfileFailed = true;
  render(<YouPage />);
  expect(mockKeys).toContain('profile:history:me:1');
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
});

it('uses the history endpoint for an older profile payload', () => {
  mockLegacyProfile = true;
  render(<YouPage />);
  expect(mockKeys).toContain('profile:history:me:1');
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
});

it('keeps editing and cache refresh working after reusing the history payload', () => {
  render(<YouPage />);
  expect(screen.getByText('Botany')).toBeVisible();
  expect(screen.getByRole('link', { name: /owner@example.test/ })).toHaveAttribute('href', 'mailto:owner@example.test');
  fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Partial save' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Partial Owner' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Saved Owner' })).toBeVisible();
  expect(invalidate).toHaveBeenCalledWith('me');
  expect(invalidate).toHaveBeenCalledWith('profile');
  fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
