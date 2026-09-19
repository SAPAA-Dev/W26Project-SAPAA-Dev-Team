import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import AdminSitesScreen from '../../screens/AdminSitesScreen';
import * as database from '../../services/database';
import { NavigationContainer } from '@react-navigation/native';

const mockNavigate = jest.fn();

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

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <PaperProvider>{children}</PaperProvider>
  </NavigationContainer>
);

describe('AdminSitesScreen', () => {
  const mockSitesOnline = [
    { id: 1, namesite: 'Alpha Site', county: 'Jasper', inspectdate: '2025-01-01' },
    { id: 2, namesite: 'Bravo Site', county: 'Banff', inspectdate: '2024-01-01' },
    { id: 3, namesite: 'Charlie Site', county: 'Canmore', inspectdate: '2023-01-01' },
  ];

  const mockDownloadedSites = [
    { id: 1, namesite: 'Alpha Site', county: 'Jasper', inspectdate: '2025-01-01' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (database.getSitesOnline as jest.Mock).mockResolvedValue(mockSitesOnline);
    (database.getDownloadedSites as jest.Mock).mockResolvedValue(mockDownloadedSites);
  });

  it('shows loading state initially', async () => {
    const { getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });
    expect(getByText('Loading sites...')).toBeTruthy();
    
    // Wait for async icon loading to complete
    await waitFor(() => expect(database.getSitesOnline).toHaveBeenCalled());
  });

  it('loads and displays online sites', async () => {
    const { getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(database.getSitesOnline).toHaveBeenCalled();
      expect(getByText('Alpha Site')).toBeTruthy();
      expect(getByText('Bravo Site')).toBeTruthy();
      expect(getByText('Charlie Site')).toBeTruthy();
    });
  });

  it('displays county information', async () => {
    const { getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(getByText('Jasper')).toBeTruthy();
      expect(getByText('Banff')).toBeTruthy();
      expect(getByText('Canmore')).toBeTruthy();
    });
  });

  it('displays downloaded badge', async () => {
    const { UNSAFE_root, getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
      // Find MaterialCommunityIcons with name "download-circle"
      const downloadIcons = UNSAFE_root.findAllByProps({ name: 'download-circle' });
      expect(downloadIcons.length).toBeGreaterThan(0);
    });
  });

  it('filters sites by name or county (case-insensitive)', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <AdminSitesScreen />,
      { wrapper: AllTheProviders }
    );

    await waitFor(() => getByText('Alpha Site'));

    const searchBar = getByPlaceholderText('Search site name');

    // Filter by name
    await act(() => fireEvent.changeText(searchBar, 'Alpha'));
    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
      expect(queryByText('Bravo Site')).toBeNull();
      expect(queryByText('Charlie Site')).toBeNull();
    });

    // Filter by county
    await act(() => fireEvent.changeText(searchBar, 'Banff'));
    await waitFor(() => {
      expect(getByText('Bravo Site')).toBeTruthy();
      expect(queryByText('Alpha Site')).toBeNull();
    });

    // Case-insensitive
    await act(() => fireEvent.changeText(searchBar, 'alpha'));
    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    });
  });

  it('opens sort menu and sorts sites', async () => {
    const { getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });
    await waitFor(() => getByText('Alpha Site'));

    // Open sort menu
    await act(() => fireEvent.press(getByText(/Sort:/)));

    // Sort by Name Z-A
    await act(() => fireEvent.press(getByText('Name (Z-A)')));
    await waitFor(() => expect(getByText('Sort: Name (Z-A)')).toBeTruthy());

    // Sort by newest inspection
    await act(() => fireEvent.press(getByText(/Sort:/)));
    await act(() => fireEvent.press(getByText('Inspection (Newest)')));
    await waitFor(() => expect(getByText('Sort: Inspection (Newest)')).toBeTruthy());
  });

  it('selects and deselects site checkboxes', async () => {
    const { getAllByRole, getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });

    await waitFor(() => getByText('Alpha Site'));

    const checkboxes = getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Select first site
    await act(() => fireEvent.press(checkboxes[0]));
    // Deselect first site
    await act(() => fireEvent.press(checkboxes[0]));
  });

  it('navigates to AdminSiteDetail when site pressed', async () => {
    const { getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });

    await waitFor(() => getByText('Alpha Site'));
    await act(() => fireEvent.press(getByText('Alpha Site')));

    expect(mockNavigate).toHaveBeenCalledWith('AdminSiteDetail', {
      site: mockSitesOnline[0],
    });
  });

  it('displays error message when load fails', async () => {
    const errorMessage = 'Failed to load sites';
    (database.getSitesOnline as jest.Mock).mockRejectedValue(new Error(errorMessage));
    (database.getDownloadedSites as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { getByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });

  it('refreshes site list', async () => {
    const { getByText, getByTestId } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });
    await waitFor(() => getByText('Alpha Site'));

    const list = getByTestId('flatlist');
    await act(() => list.props.refreshControl.props.onRefresh());

    expect(database.getSitesOnline).toHaveBeenCalledTimes(2); // initial load + refresh
  });

  it('displays inspection age badge', async () => {
    const { getAllByText } = render(<AdminSitesScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      const badges = getAllByText(/\d+\s?[DMY]/i); // matches 0D, 3M, 1Y etc
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});