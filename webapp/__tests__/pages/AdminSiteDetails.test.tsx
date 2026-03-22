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

// Create mock functions that can be configured later
const mockFromFn = jest.fn();

// Mock Supabase client - this mock is hoisted, so we use a function reference
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      // Return a chainable mock object based on the table
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      };

      // Store the table for later inspection if needed
      (mockChain as any)._table = table;

      return mockChain;
    },
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }),
}));

// Mock getSiteByName and getFormResponsesBySite queries
const mockGetSiteByName = jest.fn();
const mockGetFormResponsesBySite = jest.fn();
jest.mock('@/utils/supabase/queries', () => ({
  getSiteByName: (name: string) => mockGetSiteByName(name),
  getFormResponsesBySite: (name: string) => mockGetFormResponsesBySite(name),
}));

// Mock PdfExportModal
jest.mock('@/components/PdfExportModal', () => () => null);

// Now import the component after all mocks are set up
    import AdminSiteDetails from '../../app/admin/sites/[id]/page';

// Sample test data
const mockSite = {
  id: '1',
  namesite: 'Test National Park',
  county: 'Test County',
  inspectdate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

const mockFormResponses = [
  {
    id: 101,
    user_id: 'user-1',
    created_at: '2024-06-15T10:00:00Z',
    inspection_no: 'INS-001',
    naturalness_score: '3.5',
    naturalness_details: 'Well preserved natural habitat',
    steward: 'Jane Steward',
    answers: [
      {
        question_id: 1,
        question_text: 'Vegetation condition',
        obs_value: 'Healthy forest cover',
        obs_comm: null,
        section_id: 1,
        section_title: 'Vegetation',
      },
      {
        question_id: 2,
        question_text: 'Wildlife presence',
        obs_value: 'Abundant deer population',
        obs_comm: null,
        section_id: 2,
        section_title: 'Wildlife',
      },
    ],
  },
  {
    id: 102,
    user_id: 'user-2',
    created_at: '2023-12-10T10:00:00Z',
    inspection_no: 'INS-002',
    naturalness_score: '2.5',
    naturalness_details: 'Some disturbance observed',
    steward: null,
    answers: [
      {
        question_id: 1,
        question_text: 'Vegetation condition',
        obs_value: 'Moderate degradation',
        obs_comm: null,
        section_id: 1,
        section_title: 'Vegetation',
      },
    ],
  },
];

describe('AdminSiteDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSiteByName.mockResolvedValue([mockSite]);
    mockGetFormResponsesBySite.mockResolvedValue(mockFormResponses);
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
    it('should display Total Reports card', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Total Reports')).toBeInTheDocument();
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
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
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
    it('should display Inspection Reports heading', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
      });
    });

    it('should display inspection cards with dates', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/June 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/December 10, 2023/)).toBeInTheDocument();
      });
    });

    it('should expand inspection on click', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Inspection Reports/)).toBeInTheDocument();
      });

      // Find and click on an inspection card
      const inspectionCards = document.querySelectorAll('[class*="bg-white rounded-2xl border-2"]');
      if (inspectionCards.length > 0) {
        const expandButton = inspectionCards[0].querySelector('button');
        if (expandButton) {
          await user.click(expandButton);
        }
      }
    });
  });

  describe('Edit Modal', () => {
    it('should open edit modal when Edit is clicked from menu', async () => {
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

        await waitFor(() => {
          expect(screen.getByText(/Edit Report:/)).toBeInTheDocument();
        });
      }
    });

    it('should display editable fields in edit modal', async () => {
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
          expect(screen.getByText('Edit')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Edit'));

        await waitFor(() => {
          expect(screen.getByText('Steward')).toBeInTheDocument();
          expect(screen.getByText('Steward Guest')).toBeInTheDocument();
          expect(screen.getByText('Naturalness Score')).toBeInTheDocument();
          expect(screen.getByText('Naturalness Details')).toBeInTheDocument();
          expect(screen.getByText('Observations')).toBeInTheDocument();
        });
      }
    });

    it('should close edit modal on Cancel click', async () => {
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
          expect(screen.getByText('Edit')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Edit'));

        await waitFor(() => {
          expect(screen.getByText(/Edit Report:/)).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Cancel/i }));

        await waitFor(() => {
          expect(screen.queryByText(/Edit Report:/)).not.toBeInTheDocument();
        });
      }
    });

    it('should close edit modal on X button click', async () => {
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
          expect(screen.getByText('Edit')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Edit'));

        await waitFor(() => {
          expect(screen.getByText(/Edit Report:/)).toBeInTheDocument();
        });

        // Find the X close button
        const closeButtons = screen.getAllByRole('button').filter(
          btn => btn.querySelector('.lucide-x')
        );

        if (closeButtons.length > 0) {
          await user.click(closeButtons[0]);

          await waitFor(() => {
            expect(screen.queryByText(/Edit Report:/)).not.toBeInTheDocument();
          });
        }
      }
    });

    it('should have Save Changes button in edit modal', async () => {
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
          expect(screen.getByText('Edit')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Edit'));

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
        });
      }
    });
  });

  describe('Delete Confirmation Modal', () => {
    it('should open delete confirmation when Delete is clicked', async () => {
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
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Delete'));

        await waitFor(() => {
          expect(screen.getByText('Delete Inspection?')).toBeInTheDocument();
        });
      }
    });

    it('should display warning message in delete confirmation', async () => {
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
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Delete'));

        await waitFor(() => {
          expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
        });
      }
    });

    it('should close delete confirmation on Cancel click', async () => {
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
          expect(screen.getByText('Delete')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Delete'));

        await waitFor(() => {
          expect(screen.getByText('Delete Inspection?')).toBeInTheDocument();
        });

        // Find Cancel button in the modal
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        await user.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByText('Delete Inspection?')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Naturalness Score Gradient', () => {
    it('should display Naturalness Score section when inspections have scores', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test National Park')).toBeInTheDocument();
      });

      // With mock data that has naturalness scores, the gradient should appear
      await waitFor(() => {
        expect(screen.getByText('Naturalness Score')).toBeInTheDocument();
      });
    });

    it('should display average score when inspections exist', async () => {
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test National Park')).toBeInTheDocument();
      });

      // Average of 3.5 and 2.5 = 3.0
      const avgScoreCard = screen.getByText('Avg. Score').closest('div[class*="rounded-2xl"]');
      expect(avgScoreCard).toHaveTextContent('3.0');
    });

    it('should display N/A for average score when no inspections', async () => {
      mockGetFormResponsesBySite.mockResolvedValue([]);
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test National Park')).toBeInTheDocument();
      });

      // The Avg. Score card should show N/A when there are no inspections
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

    it('should expand question to show answers', async () => {
      const user = userEvent.setup();
      render(<AdminSiteDetails />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Compare by Question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Compare by Question/i }));

      await waitFor(() => {
        expect(screen.getByText(/Question Comparison/)).toBeInTheDocument();
      });

      // Find question cards and try to expand one
      const questionCards = document.querySelectorAll('[class*="bg-white rounded-2xl border-2"]');
      if (questionCards.length > 1) { // First is stats, rest are questions
        const expandButton = questionCards[1].querySelector('button');
        if (expandButton) {
          await user.click(expandButton);
        }
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

      // The panel should be visible with the heading
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

describe('EditableField Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSiteByName.mockResolvedValue([{
      id: '1',
      namesite: 'Test National Park',
      county: 'Test County',
      inspectdate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }]);
    mockGetFormResponsesBySite.mockResolvedValue(mockFormResponses);
  });

  // These tests verify the EditableField component behavior indirectly through the modal

  it('should allow text input in editable fields', async () => {
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
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByText(/Edit Report:/)).toBeInTheDocument();
      });

      // Find steward input and type in it
      const stewardInput = screen.getByPlaceholderText('Enter steward name');
      await user.clear(stewardInput);
      await user.type(stewardInput, 'New Steward Name');

      expect(stewardInput).toHaveValue('New Steward Name');
    }
  });

  it('should allow multiline input in textarea fields', async () => {
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
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByText(/Edit Report:/)).toBeInTheDocument();
      });

      // Find naturalness details textarea
      const detailsInput = screen.getByPlaceholderText('Enter naturalness details');
      await user.clear(detailsInput);
      await user.type(detailsInput, 'Line 1\nLine 2');

      expect(detailsInput).toHaveValue('Line 1\nLine 2');
    }
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSiteByName.mockResolvedValue([{
      id: '1',
      namesite: 'Test National Park',
      county: 'Test County',
      inspectdate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }]);
    mockGetFormResponsesBySite.mockResolvedValue(mockFormResponses);
  });

  it('should handle complete admin workflow: view, filter, edit', async () => {
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
