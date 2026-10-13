import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeClient, { daysSince } from '../../app/sites/page';


// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/sites',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));


// Mock Supabase client
let mockGetSession: jest.Mock;

jest.mock('@/utils/supabase/client', () => {
  const getSession = jest.fn();
  const onAuthStateChange = jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));

  return {
    createClient: () => ({
      auth: {
        getSession,
        onAuthStateChange,
      },
    }),
    __mockGetSession: getSession,
    __mockOnAuthStateChange: onAuthStateChange,
  };
});

// Then at the top of your describe blocks:
beforeAll(() => {
  const { __mockGetSession } = jest.requireMock('@/utils/supabase/client');
  mockGetSession = __mockGetSession;
});
// Mock getSitesOnline and getTotalInspectionCount queries
const mockGetSitesOnline = jest.fn();
const mockGetProtectedAreaBoundaries = jest.fn();
jest.mock('@/utils/supabase/queries', () => ({
  getSitesOnline: () => mockGetSitesOnline(),
  getTotalInspectionCount: () => Promise.resolve(0),
  getProtectedAreaBoundaries: () => mockGetProtectedAreaBoundaries(),
}));

// The first-visit tutorial starts 800 ms after load and takes focus. On a slow run it
// opened in the middle of a test and the keys went to the tour, not to the search box.
jest.mock('@/components/TutorialOverlay', () => ({
  ...jest.requireActual('@/components/TutorialOverlay'),
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/map/SiteMap', () => ({
  __esModule: true,
  default: function MockSiteMap({
    boundaries,
    focusedArea,
  }: {
    boundaries?: { features: Array<{ id: number; properties: { name: string } }> } | null;
    focusedArea?: { properties: { name: string } } | null;
  }) {
    return (
      <ul data-testid="site-map" data-focused={focusedArea?.properties.name ?? ''}>
        {(boundaries?.features ?? []).map((feature) => (
          <li key={feature.id}>{feature.properties.name}</li>
        ))}
      </ul>
    );
  },
}));

// Sample test data
const mockSites = [
  {
    id: '1',
    namesite: 'Elk Island National Park',
    county: 'Strathcona County',
    inspectdate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
  },
  {
    id: '2',
    namesite: 'Banff National Park',
    county: 'Banff',
    inspectdate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 200 days ago
  },
  {
    id: '3',
    namesite: 'Jasper National Park',
    county: 'Jasper',
    inspectdate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 400 days ago
  },
  {
    id: '4',
    namesite: 'Waterton Lakes',
    county: 'Cardston',
    inspectdate: new Date(Date.now() - 800 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 800 days ago (needs review)
  },
];

const mockStewardUser = {
  user: {
    email: 'steward@example.com',
    app_metadata: { role: 'steward', authenticated: true  },
  },
};

describe('HomeClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSitesOnline.mockResolvedValue(mockSites);
    mockGetSession.mockResolvedValue({ data: { session: mockStewardUser }, error: null });
  });

  describe('daysSince utility function', () => {
    it('should calculate days since a date correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(daysSince(today)).toBe(0);
    });

    it('should return positive number for past dates', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      expect(daysSince(pastDate)).toBe(10);
    });

    it('should handle dates from years ago', () => {
      const oldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      expect(daysSince(oldDate)).toBe(365);
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner initially', () => {
      render(<HomeClient />);
      expect(screen.getByText('Loading protected areas...')).toBeInTheDocument();
    });

    it('should have a spinning loader element', () => {
      render(<HomeClient />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when sites fail to load', async () => {
      mockGetSitesOnline.mockRejectedValue(new Error('Network error'));

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Sites')).toBeInTheDocument();
      });
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows Awaiting Admin Approval, not the load error, to an unapproved user', async () => {
      // Middleware answers an unapproved user's server action with 403, so the load fails.
      mockGetSession.mockResolvedValue({
        data: { session: { user: { ...mockStewardUser.user, app_metadata: { role: 'steward', authenticated: false } } } },
        error: null,
      });
      mockGetSitesOnline.mockRejectedValue(new Error('An unexpected response was received from the server.'));

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Awaiting Admin Approval')).toBeInTheDocument();
      });
      expect(screen.queryByText('Unable to Load Sites')).not.toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      mockGetSitesOnline.mockRejectedValue(new Error('Failed to fetch'));

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Loading', () => {
    it('should display the SAPAA logo', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByAltText('SAPAA')).toBeInTheDocument();
      });
    });

    it('should display all sites from the data', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
        expect(screen.getByText('Banff National Park')).toBeInTheDocument();
        expect(screen.getByText('Jasper National Park')).toBeInTheDocument();
        expect(screen.getByText('Waterton Lakes')).toBeInTheDocument();
      });
    });

    it('should display county information for sites', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Strathcona County')).toBeInTheDocument();
        expect(screen.getByText('Banff')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display total sites count', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Total Sites')).toBeInTheDocument();
      });

      const totalSitesLabel = screen.getByText('Total Sites');
      const totalSitesCard = totalSitesLabel.closest('div.bg-white') as HTMLElement | null;
      expect(totalSitesCard).toBeInTheDocument();
      expect(within(totalSitesCard!).getByText('4')).toBeInTheDocument();
    });

    it('should display total inspected sites count', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Total Inspected Sites')).toBeInTheDocument();
      });
    });

    it('should display total responses count', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Total Responses')).toBeInTheDocument();
      });
    });

    it('should display active this year count', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Active over 365 Days')).toBeInTheDocument();
      });
    });

    it('should display needs attention count', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by site name or county...')).toBeInTheDocument();
      });
    });

    it('should filter sites by name', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by site name or county...');
      await user.type(searchInput, 'Banff');

      expect(screen.getByText('Banff National Park')).toBeInTheDocument();
      expect(screen.queryByText('Elk Island National Park')).not.toBeInTheDocument();
    });

    it('should filter sites by county', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by site name or county...');
      await user.type(searchInput, 'Strathcona');

      expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      expect(screen.queryByText('Banff National Park')).not.toBeInTheDocument();
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by site name or county...');
      await user.type(searchInput, 'NonexistentPark');

      expect(screen.getByText('No sites found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by site name or county...');
      await user.type(searchInput, 'BANFF');

      expect(screen.getByText('Banff National Park')).toBeInTheDocument();
    });

    it('should display correct count after filtering', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('4 sites found')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by site name or county...');
      await user.type(searchInput, 'Banff');

      expect(screen.getByText('1 site found')).toBeInTheDocument();
    });
  });

  describe('Sort Functionality', () => {
    it('should render sort button', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
      });
    });

    it('should open sort menu on click', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const sortButton = screen.getByRole('button', { name: /sort/i });
      await user.click(sortButton);

      expect(screen.getByText('Name (A-Z)')).toBeInTheDocument();
      expect(screen.getByText('Name (Z-A)')).toBeInTheDocument();
      expect(screen.getByText('Most Recent')).toBeInTheDocument();
      expect(screen.getByText('Oldest First')).toBeInTheDocument();
    });

    it('should close sort menu after selection', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const sortButton = screen.getByRole('button', { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText('Name (Z-A)'));

      expect(screen.queryByText('Most Recent')).not.toBeInTheDocument();
    });

    it('should sort sites by name A-Z', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const sortButton = screen.getByRole('button', { name: /sort/i });
      await user.click(sortButton);
      await user.click(screen.getByText('Name (A-Z)'));

      const siteButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('National Park') || btn.textContent?.includes('Waterton')
      );

      expect(siteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Site Navigation', () => {
    it('should navigate to site detail on click', async () => {
      const user = userEvent.setup();
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const siteCard = screen.getByText('Elk Island National Park').closest('button');
      await user.click(siteCard!);

      expect(mockPush).toHaveBeenCalledWith('/detail/Elk Island National Park');
    });
  });

  describe('Inspection Status Badges', () => {
    it('should display "Recent" for sites inspected within 180 days', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Recent')).toBeInTheDocument();
      });
    });

    it('should display "Past Year" for sites inspected 180-365 days ago', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Past Year')).toBeInTheDocument();
      });
    });

    it('should display "Over 1 Year" for sites inspected 365-730 days ago', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Over 1 Year')).toBeInTheDocument();
      });
    });

    it('should display "Needs Review" for sites not inspected in over 2 years', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Needs Review')).toBeInTheDocument();
      });
    });
  });


  describe('Empty State', () => {
    it('should handle empty sites array', async () => {
      mockGetSitesOnline.mockResolvedValue([]);

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('0 sites found')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should display formatted inspection dates', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const dateElements = screen.getAllByText(/\w{3} \d{1,2}, \d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should handle sites with no inspection date', async () => {
      mockGetSitesOnline.mockResolvedValue([
        {
          id: '5',
          namesite: 'New Site',
          county: 'Test County',
          inspectdate: null,
        },
      ]);

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Never inspected')).toBeInTheDocument();
      });
    });
  });

  describe('Age Badge Formatting', () => {
    it('should display days ago for recent inspections', async () => {
      mockGetSitesOnline.mockResolvedValue([
        {
          id: '1',
          namesite: 'Recent Site',
          county: 'Test',
          inspectdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ]);

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('5d ago')).toBeInTheDocument();
      });
    });

    it('should display months ago for older inspections', async () => {
      mockGetSitesOnline.mockResolvedValue([
        {
          id: '1',
          namesite: 'Older Site',
          county: 'Test',
          inspectdate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ]);

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('3mo ago')).toBeInTheDocument();
      });
    });

    it('should display years ago for very old inspections', async () => {
      mockGetSitesOnline.mockResolvedValue([
        {
          id: '1',
          namesite: 'Old Site',
          county: 'Test',
          inspectdate: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ]);

      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('1yr ago')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render grid layout for sites', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
      });

      const sitesGrid = document.querySelector('.grid.gap-4.md\\:grid-cols-5');
      expect(sitesGrid).toBeInTheDocument();
    });

    it('should render stats in a grid', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        expect(screen.getByText('Total Sites')).toBeInTheDocument();
      });

      const statsGrid = document.querySelector('.grid-cols-2.md\\:grid-cols-5');
      expect(statsGrid).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by site name or county...');
        expect(searchInput).toHaveAttribute('type', 'text');
      });
    });

    it('should have clickable site cards as buttons', async () => {
      render(<HomeClient />);

      await waitFor(() => {
        const siteButtons = screen.getAllByRole('button').filter(
          btn => btn.textContent?.includes('National Park') || btn.textContent?.includes('Waterton')
        );
        expect(siteButtons.length).toBe(4);
      });
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSitesOnline.mockResolvedValue(mockSites);
    mockGetSession.mockResolvedValue({ data: { session: mockStewardUser }, error: null });
  });

  it('should handle complete user flow: load, search, sort, navigate', async () => {
    const user = userEvent.setup();
    render(<HomeClient />);

    await waitFor(() => {
      expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by site name or county...');
    await user.type(searchInput, 'Banff');

    expect(screen.getByText('Banff National Park')).toBeInTheDocument();
    expect(screen.queryByText('Elk Island National Park')).not.toBeInTheDocument();

    await user.clear(searchInput);

    expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();

    const sortButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortButton);
    await user.click(screen.getByText('Name (Z-A)'));

    const siteCard = screen.getByText('Waterton Lakes').closest('button');
    await user.click(siteCard!);

    expect(mockPush).toHaveBeenCalledWith('/detail/Waterton Lakes');
  });

function mapFeature(
  id: number,
  name: string,
  areaType: string,
  subtype: string | null,
  ocName: string | null,
  isActive: boolean | null = null
) {
  return {
    type: 'Feature' as const,
    id,
    properties: {
      name,
      fid: id,
      area_type: areaType,
      subtype,
      iucn: null,
      oc_no: null,
      acres: null,
      hectares: null,
      oc_date: null,
      date_est: null,
      oc_name: ocName,
      notes: null,
      county: null,
      is_active: isActive,
    },
    geometry: { type: 'MultiPolygon' as const, coordinates: [] },
  };
}

it('filters the map by type, subtype and name, and keeps the search text across views (2.0.6 AT1)', async () => {
  const user = userEvent.setup();
  mockGetProtectedAreaBoundaries.mockResolvedValue({
    type: 'FeatureCollection',
    features: [
      mapFeature(1, 'Pembina River', 'NA', 'Conservation', 'Pembina River Natural Area', true),
      mapFeature(2, 'Jasper', 'WPP', null, 'Jasper National Park', true),
      mapFeature(3, 'Gooseberry', 'NA', 'Recreation', 'Gooseberry Natural Area', null),
      mapFeature(4, 'Hidden Site', 'NA', 'Conservation', 'Hidden Site Natural Area', false),
    ],
  });

  render(<HomeClient />);

  await waitFor(() => {
    expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
  });

  const searchInput = screen.getByPlaceholderText('Search by site name or county...');
  await user.type(searchInput, 'Natural');
  await user.click(screen.getByRole('button', { name: 'Map View' }));

  await waitFor(() => {
    expect(screen.getByTestId('site-map')).toBeInTheDocument();
  });

  expect(screen.queryByRole('button', { name: /^sort$/i })).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Search by name, OC name or county...')).toHaveValue('Natural');
  expect(screen.getByText('Pembina River')).toBeInTheDocument();
  expect(screen.getByText('Gooseberry')).toBeInTheDocument();
  expect(screen.queryByText('Jasper')).not.toBeInTheDocument();
  expect(screen.queryByText('Hidden Site')).not.toBeInTheDocument();

  await user.clear(screen.getByPlaceholderText('Search by name, OC name or county...'));
  await user.click(screen.getByRole('button', { name: 'Filter' }));
  await user.click(screen.getByRole('checkbox', { name: 'WPP' }));
  await user.click(screen.getByRole('checkbox', { name: 'Recreation' }));

  expect(screen.getByText('Pembina River')).toBeInTheDocument();
  expect(screen.queryByText('Gooseberry')).not.toBeInTheDocument();
  expect(screen.queryByText('Jasper')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Cards View' }));

  const cardSearch = screen.getByPlaceholderText('Search by site name or county...');
  expect(cardSearch).toHaveValue('');
  expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();

  // One change event instead of typed keys, so a slow run cannot drop letters
  fireEvent.change(cardSearch, { target: { value: 'River' } });
  expect(cardSearch).toHaveValue('River');
  await user.click(screen.getByRole('button', { name: 'Map View' }));

  await waitFor(() => {
    expect(screen.getByPlaceholderText('Search by name, OC name or county...')).toHaveValue('River');
  });
  // The area is on the map and in the search matches list (2.0.6 AT3)
  expect(screen.getAllByText('Pembina River').length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: /^sort$/i })).not.toBeInTheDocument();
});

it('US 2.0.6 AT2: clearing a county filter shows every active area again', async () => {
  const user = userEvent.setup();
  const inCounty = (feature: ReturnType<typeof mapFeature>, county: string) => ({
    ...feature,
    properties: { ...feature.properties, county },
  });
  mockGetProtectedAreaBoundaries.mockResolvedValue({
    type: 'FeatureCollection',
    features: [
      inCounty(mapFeature(1, 'Pembina River', 'NA', null, 'Pembina River Natural Area', true), 'Parkland County'),
      inCounty(mapFeature(2, 'Jasper', 'WPP', null, 'Jasper National Park', true), 'Jasper County'),
      inCounty(mapFeature(3, 'Hidden Site', 'NA', null, 'Hidden Site Natural Area', false), 'Jasper County'),
    ],
  });

  render(<HomeClient />);
  await screen.findByText('Elk Island National Park');
  await user.click(screen.getByRole('button', { name: 'Map View' }));
  await screen.findByText('2 protected areas found');

  await user.click(screen.getByRole('button', { name: 'Filter' }));
  const countySection = screen.getByRole('region', { name: 'County' });
  await user.click(within(countySection).getByRole('checkbox', { name: 'Jasper County' }));

  const map = screen.getByTestId('site-map');
  expect(within(map).getByText('Pembina River')).toBeInTheDocument();
  expect(within(map).queryByText('Jasper')).not.toBeInTheDocument();

  await user.click(within(countySection).getByRole('button', { name: 'Select all' }));

  expect(within(map).getByText('Pembina River')).toBeInTheDocument();
  expect(within(map).getByText('Jasper')).toBeInTheDocument();
  expect(within(map).queryByText('Hidden Site')).not.toBeInTheDocument();
  expect(screen.getByText('2 protected areas found')).toBeInTheDocument();
});

it('US 2.0.6 AT3: offers the map matches and centres the map on the chosen one', async () => {
  const user = userEvent.setup();
  mockGetProtectedAreaBoundaries.mockResolvedValue({
    type: 'FeatureCollection',
    features: [
      mapFeature(1, 'Pembina River', 'NA', 'Conservation', 'Pembina River Natural Area', true),
      mapFeature(2, 'Jasper', 'WPP', null, 'Jasper National Park', true),
      mapFeature(3, 'Red Deer River', 'NA', null, 'Red Deer River Natural Area', true),
    ],
  });

  render(<HomeClient />);
  await waitFor(() => {
    expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
  });
  await user.click(screen.getByRole('button', { name: 'Map View' }));
  await waitFor(() => {
    expect(screen.getByTestId('site-map')).toBeInTheDocument();
  });

  const search = screen.getByRole('combobox', { name: 'Search' });
  await user.type(search, 'river');

  const list = await screen.findByRole('listbox', { name: 'Matching protected areas' });
  const options = within(list).getAllByRole('option');
  expect(options.map((option) => option.textContent)).toEqual([
    'Pembina RiverPembina River Natural Area',
    'Red Deer RiverRed Deer River Natural Area',
  ]);

  await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

  expect(screen.getByTestId('site-map')).toHaveAttribute('data-focused', 'Red Deer River');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await user.type(search, ' ');
  await user.click(await screen.findByRole('option', { name: /Pembina River/ }));
  expect(screen.getByTestId('site-map')).toHaveAttribute('data-focused', 'Pembina River');
});

it('US 2.0.6: counts protected areas, not sites, in the map view', async () => {
  const user = userEvent.setup();
  mockGetProtectedAreaBoundaries.mockResolvedValue({
    type: 'FeatureCollection',
    features: [
      mapFeature(1, 'Pembina River', 'NA', null, 'Pembina River Natural Area', true),
      mapFeature(2, 'Jasper', 'WPP', null, 'Jasper National Park', null),
    ],
  });

  render(<HomeClient />);
  await waitFor(() => {
    expect(screen.getByText('4 sites found')).toBeInTheDocument();
  });
  await user.click(screen.getByRole('button', { name: 'Map View' }));

  expect(await screen.findByText('2 protected areas found')).toBeInTheDocument();
  await user.type(screen.getByRole('combobox', { name: 'Search' }), 'jasper');
  expect(screen.getByText('1 protected area found')).toBeInTheDocument();
});

it('US 2.0.6: the map search hint names county, and a county search finds the area', async () => {
  const user = userEvent.setup();
  const pembina = mapFeature(1, 'Pembina River', 'NA', null, 'Pembina River Natural Area', true);
  mockGetProtectedAreaBoundaries.mockResolvedValue({
    type: 'FeatureCollection',
    features: [
      { ...pembina, properties: { ...pembina.properties, county: 'Parkland County' } },
      mapFeature(2, 'Jasper', 'WPP', null, 'Jasper National Park', true),
    ],
  });

  render(<HomeClient />);
  await waitFor(() => {
    expect(screen.getByText('4 sites found')).toBeInTheDocument();
  });
  await user.click(screen.getByRole('button', { name: 'Map View' }));
  await screen.findByText('2 protected areas found');

  await user.type(screen.getByPlaceholderText('Search by name, OC name or county...'), 'parkland');

  expect(screen.getByText('1 protected area found')).toBeInTheDocument();
  expect(within(screen.getByTestId('site-map')).getByText('Pembina River')).toBeInTheDocument();
});

it('keeps the cards search a plain text box with no match list', async () => {
  const user = userEvent.setup();
  render(<HomeClient />);
  await waitFor(() => {
    expect(screen.getByText('Elk Island National Park')).toBeInTheDocument();
  });

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Banff');

  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('should maintain search state while sorting', async () => {
  const user = userEvent.setup();
  render(<HomeClient />);

  await waitFor(() => {
    expect(screen.getByText('4 sites found')).toBeInTheDocument();
  });

  const searchInput = screen.getByPlaceholderText('Search by site name or county...');
  await user.type(searchInput, 'National');

  await waitFor(() => {
    expect(searchInput).toHaveValue('National');
  });

  expect(screen.getByText('3 sites found')).toBeInTheDocument();

  const sortButton = screen.getByRole('button', { name: /sort/i });
  await user.click(sortButton);
  await user.click(screen.getByText('Most Recent'));

  await waitFor(() => {
    expect(screen.getByText('3 sites found')).toBeInTheDocument();
    expect(searchInput).toHaveValue('National');
  });
});

});