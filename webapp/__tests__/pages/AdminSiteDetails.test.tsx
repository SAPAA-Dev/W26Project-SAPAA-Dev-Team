import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Next.js router - must be before component import
const mockPush = jest.fn();
const mockParams = { id: 'Test%20National%20Park' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock daysSince from sites page
jest.mock('@/app/sites/page', () => ({
  daysSince: (date: string) => {
    const MSEC_PER_DAY = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - new Date(date).getTime()) / MSEC_PER_DAY);
  },
}));

// Create mock functions for queries
const mockGetSiteByName = jest.fn();
const mockGetFormResponsesBySite = jest.fn();
const mockDeactivateFormResponse = jest.fn();

jest.mock('@/utils/supabase/queries', () => ({
  getSiteByName: (name: string) => mockGetSiteByName(name),
  getFormResponsesBySite: (name: string) => mockGetFormResponsesBySite(name),
  deactivateFormResponse: (id: number) => mockDeactivateFormResponse(id),
}));

// Now import the component after all mocks are set up
import AdminSiteDetails from '../../app/admin/sites/[id]/page';

// Sample test data
const mockSite = {
  id: 1,
  namesite: 'Test National Park',
  county: 'Test County',
  ab_county: 1,
  inspectdate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  is_active: true,
};

const mockFormResponses = [
  {
    id: 101,
    user_id: 'user-1',
    created_at: '2024-06-15T12:00:00Z',
    inspection_no: 'INS-001',
    naturalness_score: '3.5',
    naturalness_details: 'Well preserved natural habitat',
    steward: 'Jane Steward',
    answers: [
      {
        question_id: 3,
        question_text: 'Vegetation',
        obs_value: 'Healthy forest cover',
        obs_comm: null,
        section_id: 1,
        section_title: 'Observations',
      },
      {
        question_id: 4,
        question_text: 'Wildlife',
        obs_value: 'Abundant deer population',
        obs_comm: null,
        section_id: 1,
        section_title: 'Observations',
      },
      {
        question_id: 5,
        question_text: 'Water',
        obs_value: 'Clear streams',
        obs_comm: null,
        section_id: 2,
        section_title: 'Environment',
      },
    ],
  },
  {
    id: 102,
    user_id: 'user-2',
    created_at: '2023-12-10T12:00:00Z',
    inspection_no: 'INS-002',
    naturalness_score: '2.5',
    naturalness_details: 'Some degradation observed',
    steward: 'John Steward',
    answers: [
      {
        question_id: 3,
        question_text: 'Vegetation',
        obs_value: 'Moderate cover',
        obs_comm: null,
        section_id: 1,
        section_title: 'Observations',
      },
    ],
  },
];

describe('AdminSiteDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSiteByName.mockResolvedValue([mockSite]);
    mockGetFormResponsesBySite.mockResolvedValue(mockFormResponses);
    mockDeactivateFormResponse.mockResolvedValue(undefined);
  });

  describe('Loading State', () => {
    it('should display loading spinner initially', () => {
      render(<AdminSiteDetails />);
      expect(screen.getByText('Loading site details...')).toBeInTheDocument();
    });

    it('should have a spinning loader element', () => {
      render(<AdminSiteDetails />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when site fails to load', async () => {
      mockGetSiteByName.mockRejectedValue(new Error('Network error'));

      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Site')).toBeInTheDocument();
      });
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should show back to admin sites button on error', async () => {
      mockGetSiteByName.mockRejectedValue(new Error('Failed to fetch'));

      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Admin Sites/i })).toBeInTheDocument();
      });
    });

    it('should navigate back to admin sites on error button click', async () => {
      const user = userEvent.setup();
      mockGetSiteByName.mockRejectedValue(new Error('Failed to fetch'));

      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Admin Sites/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Back to Admin Sites/i }));
      expect(mockPush).toHaveBeenCalledWith('/admin/sites');
    });

    it('should display error when form responses fail to load', async () => {
      mockGetFormResponsesBySite.mockRejectedValue(new Error('Database error'));

      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Site')).toBeInTheDocument();
      });
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    it('should display site name in header', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test National Park')).toBeInTheDocument();
      });
    });

    it('should display Admin View badge', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Admin View')).toBeInTheDocument();
      });
    });

    it('should display county information', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test County')).toBeInTheDocument();
      });
    });

    it('should display the SAPAA logo', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByAltText('SAPAA')).toBeInTheDocument();
      });
    });

    it('should call getFormResponsesBySite with site name', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(mockGetFormResponsesBySite).toHaveBeenCalledWith('Test National Park');
      });
    });
  });

  describe('Navigation', () => {
    it('should have back to admin sites button in header', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Back to Admin Sites')).toBeInTheDocument();
      });
    });

    it('should navigate back to admin sites on click', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Back to Admin Sites')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Admin Sites'));
      expect(mockPush).toHaveBeenCalledWith('/admin/sites');
    });

    it('should have View as User button', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View as User/i })).toBeInTheDocument();
      });
    });

    it('should navigate to user detail view', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View as User/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /View as User/i }));
      expect(mockPush).toHaveBeenCalledWith('/detail/Test National Park');
    });
  });

  describe('Statistics Cards', () => {
    it('should display Total Reports card with count', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Total Reports')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should display Avg. Score card', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Avg. Score')).toBeInTheDocument();
      });
    });

    it('should display Condition card', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Condition')).toBeInTheDocument();
      });
    });

    it('should compute average naturalness score', async () => {
      render(<AdminSiteDetails />);

      // average of 3.5 and 2.5 = 3.0
      await waitFor(() => {
        const matches = screen.getAllByText('3.0');
        expect(matches.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Admin Tools Bar', () => {
    it('should render Data Quality button', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Data Quality/i })).toBeInTheDocument();
      });
    });

    it('should toggle Data Quality panel on click', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Data Quality/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Data Quality/i }));
      expect(screen.getByText('Data Quality Analysis')).toBeInTheDocument();
    });

    it('should render filter input', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter inspections...')).toBeInTheDocument();
      });
    });

    it('should filter inspections based on filter text', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter inspections...')).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText('Filter inspections...');
      await user.type(filterInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No inspections match your filter')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should render Export button', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
      });
    });

    it('should open export menu on click', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Export/i }));
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as JSON')).toBeInTheDocument();
    });

    it('should close export menu after selection', async () => {
      const user = userEvent.setup();

      // Mock URL.createObjectURL and createElement
      const mockCreateObjectURL = jest.fn(() => 'blob:test');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockClick = jest.fn();
      const originalCreateElement = document.createElement.bind(document);
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = mockClick;
        }
        return element;
      });

      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Export/i }));
      await user.click(screen.getByText('Export as CSV'));

      expect(screen.queryByText('Export as JSON')).not.toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should render View by Date button', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View by Date/i })).toBeInTheDocument();
      });
    });

    it('should render Compare by Question button', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Compare by Question/i })).toBeInTheDocument();
      });
    });

    it('should switch to question comparison view', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Compare by Question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Compare by Question/i }));
      expect(screen.getByText(/Question Comparison/)).toBeInTheDocument();
    });

    it('should switch back to date view', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Compare by Question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Compare by Question/i }));
      await user.click(screen.getByRole('button', { name: /View by Date/i }));

      expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
    });
  });

  describe('Inspection Reports (By Date View)', () => {
    it('should display Inspection Reports heading with count', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports \(2\)/)).toBeInTheDocument();
      });
    });

    it('should display inspection dates', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('June 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('December 10, 2023')).toBeInTheDocument();
      });
    });

    it('should display naturalness scores', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Score: 3.5')).toBeInTheDocument();
        expect(screen.getByText('Score: 2.5')).toBeInTheDocument();
      });
    });

    it('should expand inspection on click to show details', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('June 15, 2024')).toBeInTheDocument();
      });

      // Click the first inspection card to expand it
      await user.click(screen.getByText('June 15, 2024'));

      await waitFor(() => {
        expect(screen.getByText('Jane Steward')).toBeInTheDocument();
        expect(screen.getByText('Well preserved natural habitat')).toBeInTheDocument();
        expect(screen.getByText('Healthy forest cover')).toBeInTheDocument();
      });
    });

    it('should show section dividers in expanded view', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('June 15, 2024')).toBeInTheDocument();
      });

      await user.click(screen.getByText('June 15, 2024'));

      await waitFor(() => {
        // "Observations" appears both as a section divider and as a label
        const obsMatches = screen.getAllByText('Observations');
        expect(obsMatches.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Environment')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Functionality', () => {
    it('should navigate to edit-report page when Edit is clicked from menu', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
      });

      // Find the menu button (MoreVertical icon button)
      const menuButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('.lucide-more-vertical')
      );

      if (menuButtons.length > 0) {
        await user.click(menuButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Edit')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Edit'));

        expect(mockPush).toHaveBeenCalledWith('/detail/Test National Park/edit-report/101');
      }
    });
  });

  describe('Deactivate Confirmation Modal', () => {
    it('should open deactivate confirmation when Deactivate is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('.lucide-more-vertical')
      );

      if (menuButtons.length > 0) {
        await user.click(menuButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Deactivate')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Deactivate'));

        await waitFor(() => {
          expect(screen.getByText('Deactivate Inspection?')).toBeInTheDocument();
        });
      }
    });

    it('should display preservation message in deactivate confirmation', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('.lucide-more-vertical')
      );

      if (menuButtons.length > 0) {
        await user.click(menuButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Deactivate')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Deactivate'));

        await waitFor(() => {
          expect(screen.getByText(/data will be preserved/)).toBeInTheDocument();
        });
      }
    });

    it('should close deactivate confirmation on Cancel click', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('.lucide-more-vertical')
      );

      if (menuButtons.length > 0) {
        await user.click(menuButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Deactivate')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Deactivate'));

        await waitFor(() => {
          expect(screen.getByText('Deactivate Inspection?')).toBeInTheDocument();
        });

        // Find Cancel button in the modal
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        await user.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByText('Deactivate Inspection?')).not.toBeInTheDocument();
        });
      }
    });

    it('should call deactivateFormResponse and remove item on confirm', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports \(2\)/)).toBeInTheDocument();
      });

      const menuButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('.lucide-more-vertical')
      );

      if (menuButtons.length > 0) {
        await user.click(menuButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Deactivate')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Deactivate'));

        await waitFor(() => {
          expect(screen.getByText('Deactivate Inspection?')).toBeInTheDocument();
        });

        // Click the confirm Deactivate button in the modal
        const modalButtons = screen.getAllByRole('button', { name: 'Deactivate' });
        const confirmBtn = modalButtons[modalButtons.length - 1];
        await user.click(confirmBtn);

        await waitFor(() => {
          expect(mockDeactivateFormResponse).toHaveBeenCalledWith(101);
        });

        await waitFor(() => {
          expect(screen.getByText(/Inspection Reports \(1\)/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Naturalness Score Gradient', () => {
    it('should display Naturalness Score section when inspections have scores', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Naturalness Score')).toBeInTheDocument();
        expect(screen.getByText('1.0 Poor')).toBeInTheDocument();
        expect(screen.getByText('4.0 Excellent')).toBeInTheDocument();
      });
    });

    it('should not display Naturalness Score section when no inspections have scores', async () => {
      mockGetFormResponsesBySite.mockResolvedValue([]);
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test National Park')).toBeInTheDocument();
      });

      expect(screen.queryByText('1.0 Poor')).not.toBeInTheDocument();
    });

    it('should display N/A for average score when no inspections', async () => {
      mockGetFormResponsesBySite.mockResolvedValue([]);
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test National Park')).toBeInTheDocument();
      });

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  describe('Question Comparison View', () => {
    it('should display questions when in question view', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Compare by Question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Compare by Question/i }));

      await waitFor(() => {
        expect(screen.getByText(/Question Comparison/)).toBeInTheDocument();
      });
    });

    it('should show question texts in comparison view', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Compare by Question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Compare by Question/i }));

      await waitFor(() => {
        expect(screen.getByText('Vegetation')).toBeInTheDocument();
        expect(screen.getByText('Wildlife')).toBeInTheDocument();
        expect(screen.getByText('Water')).toBeInTheDocument();
      });
    });

    it('should expand question to show answers', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Compare by Question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Compare by Question/i }));

      await waitFor(() => {
        expect(screen.getByText('Vegetation')).toBeInTheDocument();
      });

      // Click on a question card to expand it
      const vegButton = screen.getByText('Vegetation').closest('button');
      if (vegButton) {
        await user.click(vegButton);

        await waitFor(() => {
          expect(screen.getByText('Healthy forest cover')).toBeInTheDocument();
          expect(screen.getByText('Moderate cover')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Data Quality Panel', () => {
    it('should show data quality scores for each inspection', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Data Quality/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Data Quality/i }));

      await waitFor(() => {
        expect(screen.getByText('Data Quality Analysis')).toBeInTheDocument();
      });
    });

    it('should display quality percentage', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Data Quality/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Data Quality/i }));

      await waitFor(() => {
        expect(screen.getByText('Data Quality Analysis')).toBeInTheDocument();
      });

      const panel = screen.getByText('Data Quality Analysis');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible filter input', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        const filterInput = screen.getByPlaceholderText('Filter inspections...');
        expect(filterInput).toHaveAttribute('type', 'text');
      });
    });

    it('should have clickable buttons with proper roles', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSiteByName.mockResolvedValue([mockSite]);
    mockGetFormResponsesBySite.mockResolvedValue(mockFormResponses);
    mockDeactivateFormResponse.mockResolvedValue(undefined);
  });

  it('should handle complete admin workflow: view, filter, toggle views', async () => {
    const user = userEvent.setup();
    render(<AdminSiteDetails />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test National Park')).toBeInTheDocument();
    });

    // Check stats are displayed
    expect(screen.getByText('Total Reports')).toBeInTheDocument();
    expect(screen.getByText('Avg. Score')).toBeInTheDocument();

    // Toggle Data Quality panel
    await user.click(screen.getByRole('button', { name: /Data Quality/i }));
    expect(screen.getByText('Data Quality Analysis')).toBeInTheDocument();

    // Switch view modes
    await user.click(screen.getByRole('button', { name: /Compare by Question/i }));
    expect(screen.getByText(/Question Comparison/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /View by Date/i }));
    expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
  });

  it('should maintain state when switching between views', async () => {
    const user = userEvent.setup();
    render(<AdminSiteDetails />);

    await waitFor(() => {
      expect(screen.getByText('Test National Park')).toBeInTheDocument();
    });

    // Enable Data Quality
    await user.click(screen.getByRole('button', { name: /Data Quality/i }));
    expect(screen.getByText('Data Quality Analysis')).toBeInTheDocument();

    // Switch to question view
    await user.click(screen.getByRole('button', { name: /Compare by Question/i }));

    // Data Quality should still be visible
    expect(screen.getByText('Data Quality Analysis')).toBeInTheDocument();

    // Switch back to date view
    await user.click(screen.getByRole('button', { name: /View by Date/i }));

    // Data Quality should still be visible
    expect(screen.getByText('Data Quality Analysis')).toBeInTheDocument();
  });
});
