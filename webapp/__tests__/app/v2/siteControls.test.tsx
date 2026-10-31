import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { useSiteQuery, applySiteQuery } from '@/app/v2/_lib/siteQuery';
import QueryBar, { SiteSort } from '@/app/v2/_components/sites/QueryBar';
import { BASE_QUERY } from '@/app/v2/_components/sites/ui';
import type { SiteSummary } from '@/lib/api/v1/types';
let mockParams = new URLSearchParams();
let mockSites: SiteSummary[] = [];
let mockRole = 'steward';
jest.mock('next/navigation', () => ({ usePathname: () => '/v2/sites', useSearchParams: () => mockParams }));
jest.mock('@/app/v2/_components/sites/useSites', () => ({ useSites: () => ({ sites: mockSites, me: { role: mockRole, assignedSiteIds: [] }, meSettled: true }) }));
jest.mock('@/app/v2/_components/map/preload', () => ({ preloadMap: jest.fn() }));
beforeEach(() => {
  mockParams = new URLSearchParams(); mockSites = []; mockRole = 'steward';
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  global.ResizeObserver = class { observe() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
it.each(['', 'mode=map', 'sort=invalid'])('(V3-01 AT1, V3-05 AT1) defaults to A–Z for %s', (params) => {
  mockParams = new URLSearchParams(params); expect(renderHook(useSiteQuery).result.current.query.sort).toBe('name');
});
it('(V3-03 AT1) sorts A–Z and Z–A without changing the source array', () => {
  const sites = [{ id: 1, name: 'Zebra' }, { id: 2, name: 'Alpha' }] as SiteSummary[];
  expect(applySiteQuery(sites, BASE_QUERY, null).map((site) => site.name)).toEqual(['Alpha', 'Zebra']);
  expect(applySiteQuery(sites, { ...BASE_QUERY, sort: 'name-desc' }, null).map((site) => site.name)).toEqual(['Zebra', 'Alpha']);
  expect(sites[0].name).toBe('Zebra');
});
it('(V3-02 AT1) changes sort from the visible control while keeping map filters', () => {
  mockParams = new URLSearchParams('mode=map&q=Riverlot&county=Parkland');
  const replace = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  render(<SiteSort />); fireEvent.change(screen.getByRole('combobox', { name: 'Sort sites' }), { target: { value: 'name-desc' } });
  expect(replace.mock.calls[0][2]).toBe('/v2/sites?mode=map&q=Riverlot&county=Parkland&sort=name-desc'); replace.mockRestore();
});
it('(V3-06 AT1) clears carried search, selection and filters from the map dialog', () => {
  mockParams = new URLSearchParams('mode=map&q=Riverlot&sel=Riverlot&county=Parkland&view=mine&boundary=with');
  const replace = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  render(<QueryBar tone="paper" />); fireEvent.click(screen.getByRole('button', { name: /^Filter/ })); fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
  expect(replace.mock.calls.at(-1)?.[2]).toBe('/v2/sites?mode=map'); expect(screen.getByRole('searchbox')).toHaveValue(''); replace.mockRestore();
});

it('(V3-02 AT1) applies the dialog sort and filters together, including after a county search', () => {
  mockRole = 'admin';
  mockSites = [{ id: 1, name: 'Alpha', status: 'recent', county: 'Parkland', center: [-113, 53] }, { id: 2, name: 'Beta', status: 'overdue', county: 'Other', center: null }] as SiteSummary[];
  const replace = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  render(<QueryBar tone="paper" />); fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Up to date' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Up to date' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Up to date' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Search counties' }), { target: { value: 'No county' } });
  expect(screen.getByText(/No county matches/)).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search counties' }), { target: { value: 'Park' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Parkland/ }));
  fireEvent.click(screen.getByRole('radio', { name: 'Name (Z–A)' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Has a boundary' }));
  fireEvent.click(screen.getByRole('button', { name: 'Show 1 site' }));
  expect(replace.mock.calls.at(-1)?.[2]).toBe('/v2/sites?status=recent&county=Parkland&sort=name-desc&boundary=with'); replace.mockRestore();
});
it('(V3-06 AT1) clears search during typing and switches views without dropping the query', async () => {
  const replace = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  render(<QueryBar tone="paper" />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Riverlot' } });
  await waitFor(() => expect(replace).toHaveBeenCalledWith(null, '', '/v2/sites?q=Riverlot'));
  fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByRole('searchbox')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Map' }));
  expect(replace.mock.calls.at(-1)?.[2]).toBe('/v2/sites?mode=map');
  fireEvent.click(screen.getByRole('button', { name: /Overdue/ }));
  expect(replace.mock.calls.at(-1)?.[2]).toBe('/v2/sites?view=overdue'); replace.mockRestore();
});
