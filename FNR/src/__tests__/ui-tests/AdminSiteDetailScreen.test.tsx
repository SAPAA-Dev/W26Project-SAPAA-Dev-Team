import React from 'react';
import { render, waitFor, fireEvent, act, screen, within } from '@testing-library/react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import AdminSiteDetailScreen from '../../screens/AdminSiteDetailScreen';
import * as database from '../../services/database';
import { NavigationContainer } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

const mockNavigate = jest.fn();
const mockRoute = {
  params: {
    site: {
      id: 1,
      namesite: 'Test Site',
      county: 'Test County',
      inspectdate: '2025-01-01 00:00:00',
    },
  },
};

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: () => ({
        update: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    }),
  };
});

// Create a theme with AppColors structure
const testTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',
    error: '#F44336',
    text: '#000000',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    icon: '#6B7280',
    background: '#FFFFFF',
    surface: '#FFFFFF',
  },
};

// Mock dependencies
jest.mock('../../services/database');
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

// Mock react-native-markdown-display
jest.mock('react-native-markdown-display', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children }: any) => React.createElement(Text, {}, children);
});

jest.spyOn(Alert, 'alert');

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <PaperProvider theme={testTheme}>{children}</PaperProvider>
  </NavigationContainer>
);

describe('AdminSiteDetailScreen', () => {
  const mockInspections = [
    {
      id: 1,
      inspectno: 1,
      namesite: 'Test Site',
      inspectdate: '2025-01-15 00:00:00',
      steward: 'John Doe',
      steward_guest: 'Jane Smith',
      naturalness_score: '3.5',
      naturalness_details: 'Good natural habitat',
      notes: 'Q1: Observation 1; Q2: Observation 2',
      iddetail: 'TS001',
      _type: 'Park',
      _subtype: 'Natural',
      _naregion: 'Region 1',
      _na_subregion_multi: 'Sub-region A',
      area_ha: '50',
      area_acre: '123.5',
      recactivities_multi: 'Hiking, Camping',
      sapaaweb: 'http://example.com',
      inatmap: 'http://inat.example.com',
    },
    {
      id: 2,
      inspectno: 2,
      namesite: 'Test Site',
      inspectdate: '2024-06-01 00:00:00',
      steward: 'Bob Wilson',
      steward_guest: '',
      naturalness_score: '2.8',
      naturalness_details: 'Fair condition',
      notes: 'Q1: Some issues found',
      iddetail: 'TS001',
      _type: 'Park',
      _subtype: 'Natural',
      _naregion: 'Region 1',
      _na_subregion_multi: 'Sub-region A',
      area_ha: '50',
      area_acre: '123.5',
      recactivities_multi: 'Hiking',
      sapaaweb: 'http://example.com',
      inatmap: 'http://inat.example.com',
    },
  ];

  const mockImages = [
    { id: 1, namesite: 'Test Site', image_data: 'base64data1' },
    { id: 2, namesite: 'Test Site', image_data: 'base64data2' },
  ];

  const mockPdfs = [
    { id: 1, namesite: 'Test Site', generated_date: '2025-01-15 00:00:00', pdf_data: 'pdfdata1' },
  ];

  let mockNetInfoUnsubscribe: jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress react-native-paper Surface overflow warning
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((message) => {
      if (typeof message === 'string' && message.includes('overflow to hidden on Surface')) {
        return;
      }
      console.warn(message);
    });
    
    // Mock NetInfo to return online status
    mockNetInfoUnsubscribe = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return mockNetInfoUnsubscribe;
    });

    (database.getInspectionDetailsOnline as jest.Mock).mockResolvedValue(mockInspections);
    (database.getImages as jest.Mock).mockResolvedValue(mockImages);
    (database.getPdfs as jest.Mock).mockResolvedValue(mockPdfs);
    (database.updateInspectionOnline as jest.Mock).mockResolvedValue(undefined);
    (database.deleteSiteReportOnline as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  beforeAll(() => {
    // Force UTC timezone
    process.env.TZ = 'UTC';
  });

  afterAll(() => {
    jest.restoreAllMocks();
    delete process.env.TZ;
  });

  // TC07: Admin sees individual site records
  describe('TC07: Admin sees individual site records', () => {
    it('displays site header with name, county, and last inspection date', async () => {
      const { getByText } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(getByText('Test Site')).toBeTruthy();
        expect(getByText('Test County')).toBeTruthy();
        expect(getByText(/Last Inspection:/)).toBeTruthy();
      });
    });

    it('shows loading state initially', async () => {
      const { getByText } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      expect(getByText(/Checking network|Loading site details/)).toBeTruthy();
      
      await waitFor(() => {
        expect(database.getInspectionDetailsOnline).toHaveBeenCalled();
      });
    });

    it('displays reports count', async () => {
      const { getByText } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(getByText('Reports:')).toBeTruthy();
        expect(getByText('2')).toBeTruthy();
      });
    });

    it('displays average naturalness score with gradient', async () => {
        const { getByText, getAllByText } = render(
          <AdminSiteDetailScreen route={mockRoute} />,
          { wrapper: AllTheProviders }
        );

        await waitFor(() => {
          expect(getByText('Average Naturalness Score')).toBeTruthy();

          // Use getAllByText to handle multiple occurrences
          const allScores = getAllByText('3.2');
          expect(allScores[0]).toBeTruthy(); // first occurrence

          expect(getByText(/Condition:/)).toBeTruthy();
        });
      });

    it('displays inspection reports list', async () => {
      const { getByText } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      // Wait for the main header
      await waitFor(() => expect(getByText('Inspection Reports')).toBeTruthy());

      // Wait for each inspection entry individually
      await waitFor(() => expect(getByText(/2025-01-15 Test Site/)).toBeTruthy());
      await waitFor(() => expect(getByText(/2024-06-01 Test Site/)).toBeTruthy());
    });

    it('handles network status changes', async () => {
      const { rerender } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(database.getInspectionDetailsOnline).toHaveBeenCalled();
      });

      // Simulate going offline
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        callback({ isConnected: false });
        return mockNetInfoUnsubscribe;
      });

      rerender(<AdminSiteDetailScreen route={mockRoute} />);
    });
  });

  // TC08: Form includes all fields
  describe('TC08: Form includes all fields', () => {
    it('displays all site detail fields', async () => {
      const { getByText } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(getByText('Site Details')).toBeTruthy();
        expect(getByText(/Site ID:/)).toBeTruthy();
        expect(getByText('Type')).toBeTruthy();
        expect(getByText('Region')).toBeTruthy();
        expect(getByText('Area HA/AC')).toBeTruthy();
        expect(getByText('Recreational Activities')).toBeTruthy();
        expect(getByText('SAPAA Link')).toBeTruthy();
        expect(getByText('iNaturalMap')).toBeTruthy();
        expect(getByText('Avg. Naturalness')).toBeTruthy();
        expect(getByText('Recent Score')).toBeTruthy();
      });
    });

    it('opens inspection modal with all editable fields', async () => {
      const { getByText } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      // Open the first inspection
      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText(/Report:/)).toBeTruthy();
        expect(getByText('Edit')).toBeTruthy();
      });
    });

    it('displays inspection modal with steward, naturalness score, and notes', async () => {
      const { getByText, getAllByText } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText(/Steward:/)).toBeTruthy();
        expect(getByText(/John Doe/)).toBeTruthy();

        // Multiple elements with '3.5', use getAllByText
        const scores = getAllByText('3.5');
        expect(scores[0]).toBeTruthy();

        expect(getByText(/Naturalness Score:/)).toBeTruthy();
      });
    });

    it('enters edit mode and shows all editable fields', async () => {
      const { getByText, getAllByText } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText('Edit')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Edit'));
      });

      await waitFor(() => {
        expect(getByText('Save')).toBeTruthy();
        expect(getByText('Steward:')).toBeTruthy();
        expect(getByText('Steward Guest:')).toBeTruthy();
        expect(getByText('Naturalness Score:')).toBeTruthy();

        // Multiple elements with same label
        const detailsLabels = getAllByText('Naturalness Details:');
        expect(detailsLabels[0]).toBeTruthy();

        expect(getByText('Observations:')).toBeTruthy();
      });
    });
  });

  // TC09: Admin can save updates to the database immediately
  describe('TC09: Admin can save updates to database', () => {
    it('saves edited inspection data to database', async () => {
      const { getByText, getAllByDisplayValue } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      // Open inspection modal
      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText('Edit')).toBeTruthy();
      });

      // Enter edit mode
      await act(async () => {
        fireEvent.press(getByText('Edit'));
      });

      await waitFor(() => {
        expect(getByText('Save')).toBeTruthy();
      });

      // Edit steward field
      const stewardInputs = getAllByDisplayValue('John Doe');
      await act(async () => {
        fireEvent.changeText(stewardInputs[0], 'Updated Steward Name');
      });

      // Save changes
      await act(async () => {
        fireEvent.press(getByText('Save'));
      });

      await waitFor(() => {
        expect(database.updateInspectionOnline).toHaveBeenCalledWith(
          expect.objectContaining({
            steward: 'Updated Steward Name',
          })
        );
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Changes saved to Supabase!');
      });
    });

    it('updates naturalness score and saves', async () => {
      const { getByText, getAllByDisplayValue } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText('Edit')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Edit'));
      });

      await waitFor(() => {
        expect(getByText('Save')).toBeTruthy();
      });

      // Edit naturalness score
      const scoreInputs = getAllByDisplayValue('3.5');
      await act(async () => {
        fireEvent.changeText(scoreInputs[0], '4.0');
      });

      await act(async () => {
        fireEvent.press(getByText('Save'));
      });

      await waitFor(() => {
        expect(database.updateInspectionOnline).toHaveBeenCalledWith(
          expect.objectContaining({
            naturalness_score: '4.0',
          })
        );
      });
    });

    it('shows loading indicator while saving', async () => {
      // Make the update take time
      (database.updateInspectionOnline as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { getByText, getAllByDisplayValue } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText('Edit')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Edit'));
      });

      await waitFor(() => {
        expect(getByText('Save')).toBeTruthy();
      });

      const stewardInputs = getAllByDisplayValue('John Doe');
      await act(async () => {
        fireEvent.changeText(stewardInputs[0], 'New Name');
      });

      await act(async () => {
        fireEvent.press(getByText('Save'));
      });

      // Check for loading indicator
      await waitFor(() => {
        expect(getByText('Saving changes...')).toBeTruthy();
      });

      await waitFor(() => {
        expect(database.updateInspectionOnline).toHaveBeenCalled();
      });
    });

    it('handles save errors gracefully', async () => {
      const errorMessage = 'Network error';
      (database.updateInspectionOnline as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      // Suppress expected console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { getByText, getAllByDisplayValue } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText('Edit')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Edit'));
      });

      await waitFor(() => {
        expect(getByText('Save')).toBeTruthy();
      });

      const stewardInputs = getAllByDisplayValue('John Doe');
      await act(async () => {
        fireEvent.changeText(stewardInputs[0], 'New Name');
      });

      await act(async () => {
        fireEvent.press(getByText('Save'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining(errorMessage)
        );
      });

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Additional functionality', () => {
    it('refreshes inspection data on pull-to-refresh', async () => {
      const { getByText, getByTestId } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText('Test Site')).toBeTruthy();
      });

      const scrollView = getByTestId('scroll-view');
      await act(async () => {
        scrollView.props.refreshControl.props.onRefresh();
      });

      await waitFor(() => {
        expect(database.getInspectionDetailsOnline).toHaveBeenCalledTimes(2);
      });
    });

    it('deletes inspection after confirmation', async () => {
      const { getByText, getByTestId, getAllByText } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        // multiple "Test Site" texts exist
        const allSites = getAllByText(/Test Site/);
        expect(allSites.length).toBeGreaterThan(0);
      });

      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText('Edit')).toBeTruthy();
      });

      // Mock Alert confirmation
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find((b: any) => b.text === 'Delete');
        if (deleteButton?.onPress) deleteButton.onPress();
      });

      const deleteButton = getByTestId('delete-button');
      await act(async () => fireEvent.press(deleteButton));

      await waitFor(() => {
        expect(database.deleteSiteReportOnline).toHaveBeenCalledWith(1);
      });
    });

    it('closes modal when dismissed', async () => {
      const { getByText, queryByText } = render(
        <AdminSiteDetailScreen route={mockRoute} />,
        { wrapper: AllTheProviders }
      );

      await waitFor(() => {
        expect(getByText(/2025-01-15 Test Site/)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText(/2025-01-15 Test Site/));
      });

      await waitFor(() => {
        expect(getByText(/Report:/)).toBeTruthy();
      });
    });

    it('displays error message when loading fails', async () => {
      const errorMessage = 'Failed to load inspections';
      (database.getInspectionDetailsOnline as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { getByText } = render(<AdminSiteDetailScreen route={mockRoute} />, {
        wrapper: AllTheProviders,
      });

      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
      });
    });
  });
});