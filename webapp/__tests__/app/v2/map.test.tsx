import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { BoundaryProperties } from '@/lib/map/boundaries';

const mockUpdate = jest.fn();
let mockRole: 'steward' | 'admin' = 'steward';
jest.mock('@/app/v2/_components/admin/lazy', () => ({ KmlImportSheet: () => <div role="dialog" aria-label="Upload site data" /> }));
jest.mock('next/dynamic', () => () => function Canvas(props: { sites: { name: string }[]; boundaries?: { features: unknown[] } }) {
  return <div data-testid="canvas">{props.sites.map((site) => site.name).join(',')}:{props.boundaries?.features.length}</div>;
});
jest.mock('motion/react', () => ({ AnimatePresence: ({ children }: React.PropsWithChildren) => children, useReducedMotion: () => true }));
jest.mock('motion/react-m', () => ({ div: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('@/app/v2/_lib/MotionProvider', () => ({ __esModule: true, default: ({ children }: React.PropsWithChildren) => children }));
jest.mock('@/app/v2/_components/sites/QueryBar', () => ({ __esModule: true, default: () => null }));
jest.mock('@/app/v2/_components/sites/SiteRow', () => ({ __esModule: true, default: ({ site }: { site: { name: string } }) => <span>{site.name}</span> }));
jest.mock('@/app/v2/_components/sites/useSites', () => ({ prefetchSite: jest.fn() }));
jest.mock('@/app/v2/_components/map/MapControls', () => ({ MapButtons: () => null, MapKey: () => null, CHROME: '' }));
jest.mock('@/app/v2/_components/map/MapSheet', () => ({ __esModule: true, default: ({ children }: React.PropsWithChildren) => children, useHeight: () => 0 }));
jest.mock('@/components/map/OfflineSavePanel', () => ({ __esModule: true, default: () => null }));
jest.mock('@/app/v2/_lib/siteQuery', () => ({
  useSiteQuery: () => ({ query: { sort: 'name', q: '', selected: null }, update: mockUpdate }),
  applySiteQuery: (sites: unknown[]) => sites,
}));

const mockSites = [{ id: 1, slug: 'Natural', name: 'Natural', isActive: true }, { id: 2, slug: 'Reserve', name: 'Reserve', isActive: true }, { id: 3, slug: 'Inactive', name: 'Inactive', isActive: false }];
const mockAreas = mockSites.map((site, index) => ({
  type: 'Feature', id: site.id,
  properties: {
    name: site.name, siteSlug: site.slug,
    details: { name: site.name, site_name: site.name, area_type: index === 0 ? 'Natural Area' : 'Ecological Reserve', subtype: null, oc_name: null, county: null, is_active: site.isActive } as BoundaryProperties,
  },
  geometry: { type: 'MultiPolygon', coordinates: [] },
}));
jest.mock('@/app/v2/_lib/useApi', () => ({
  useApi: (key: string) => ({ data: key === 'sites:map' ? mockSites : key === 'boundaries' ? { type: 'FeatureCollection', features: mockAreas } : key === 'me' ? { role: mockRole } : undefined }),
}));

import SitesMap from '@/app/v2/_components/map/SitesMap';

beforeEach(() => {
  jest.clearAllMocks();
  mockRole = 'steward';
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
});

it('filters polygons, pins and list rows together, then clears the area filter', () => {
  render(<SitesMap />);
  expect(screen.getByTestId('canvas')).toHaveTextContent('Natural,Reserve:2');
  fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Natural Area' }));
  expect(screen.getByTestId('canvas')).toHaveTextContent('Reserve:1');
  expect(screen.queryByText('Natural', { selector: 'span' })).not.toBeInTheDocument();
  expect(screen.getByText('Reserve', { selector: 'span' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear area filters' }));
  expect(screen.getByTestId('canvas')).toHaveTextContent('Natural,Reserve:2');
});

it('clears protected-area search from an empty result', () => {
  render(<SitesMap />);
  fireEvent.change(screen.getByPlaceholderText('Search protected areas'), { target: { value: 'missing' } });
  expect(screen.getByTestId('canvas')).toHaveTextContent(':0');
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByPlaceholderText('Search protected areas')).toHaveValue('');
  expect(screen.getByTestId('canvas')).toHaveTextContent('Natural,Reserve:2');
});

it('shows inactive boundaries and site pins when their status is selected', () => {
  render(<SitesMap />);
  fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
  for (const name of ['Active', 'No status', 'Inactive']) fireEvent.click(screen.getByRole('checkbox', { name }));
  expect(screen.getByTestId('canvas')).toHaveTextContent('Inactive:1');
  expect(screen.getByText('Inactive', { selector: 'span' })).toBeInTheDocument();
});

it('opens the shared KML/KMZ uploader from the admin map', () => {
  mockRole = 'admin';
  render(<SitesMap />);
  fireEvent.click(screen.getByRole('button', { name: 'Upload KML/KMZ' }));
  expect(screen.getByRole('dialog', { name: 'Upload site data' })).toBeInTheDocument();
});

it('does not show boundary upload to stewards', () => {
  render(<SitesMap />);
  expect(screen.queryByRole('button', { name: 'Upload KML/KMZ' })).not.toBeInTheDocument();
});
