import { render } from '@testing-library/react';
import SitesPage from '@/app/v2/sites/page';
import { prefetch } from '@/app/v2/_lib/useApi';
import { preloadMap } from '@/app/v2/_components/map/preload';

let mockMode = 'map';
jest.mock('@/app/v2/_lib/siteQuery', () => ({ useSiteQuery: () => ({ query: { mode: mockMode } }) }));
jest.mock('@/app/v2/_lib/useApi', () => ({ prefetch: jest.fn() }));
jest.mock('@/app/v2/_components/map/preload', () => ({ preloadMap: jest.fn() }));
jest.mock('@/app/v2/_components/sites/SitesList', () => ({ __esModule: true, default: () => null, SitesSkeleton: () => null }));
jest.mock('next/dynamic', () => () => function Map() { return null; });

beforeEach(() => jest.clearAllMocks());
it('starts map data and code loading together on a direct map visit', () => {
  mockMode = 'map';
  render(<SitesPage />);
  expect(preloadMap).toHaveBeenCalledTimes(1);
  expect((prefetch as jest.Mock).mock.calls.map(([key]) => key)).toEqual(['sites:map', 'me', 'boundaries', 'tracks']);
});
it('does not download boundary data for a list-only visit', () => {
  mockMode = 'list';
  render(<SitesPage />);
  expect(prefetch).not.toHaveBeenCalled();
  expect(preloadMap).not.toHaveBeenCalled();
});
