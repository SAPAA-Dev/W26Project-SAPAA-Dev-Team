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
jest.mock('@/utils/supabase/queries', () => ({
  getSitesOnline: () => mockGetSitesOnline(),
  getTotalInspectionCount: () => Promise.resolve(0),
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

const mockAdminUser = {
  user: {
    email: 'admin@example.com',
    user_metadata: { role: 'admin', authenticated: true  },
  },
};

const mockStewardUser = {
  user: {
    email: 'steward@example.com',
    user_metadata: { role: 'steward', authenticated: true  },
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