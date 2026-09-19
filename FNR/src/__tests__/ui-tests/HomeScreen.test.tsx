import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import HomeScreen from '../../screens/HomeScreen';
import NetInfo from '@react-native-community/netinfo';
import * as database from '../../services/database';
import { NavigationContainer } from '@react-navigation/native';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
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

const mockNavigate = jest.fn();

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NavigationContainer>
      <PaperProvider>{children}</PaperProvider>
    </NavigationContainer>
  );
};

describe('HomeScreen', () => {
  let mockUnsubscribe: jest.Mock;

  const mockSitesOnline = [
    {
      id: 1,
      namesite: 'Alpha Site',
      county: 'Jasper',
      inspectdate: '2025-01-01',
    },
    {
      id: 2,
      namesite: 'Bravo Site',
      county: 'Banff',
      inspectdate: '2024-01-01',
    },
    {
      id: 3,
      namesite: 'Charlie Site',
      county: 'Canmore',
      inspectdate: '2023-01-01',
    },
  ];

  const mockDownloadedSites = [
    {
      id: 1,
      namesite: 'Alpha Site',
      county: 'Jasper',
      inspectdate: '2025-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    mockNavigate.mockClear();

    // Mock database functions
    (database.getSitesOnline as jest.Mock).mockResolvedValue(mockSitesOnline);
    (database.getDownloadedSites as jest.Mock).mockResolvedValue(mockDownloadedSites);
    (database.getSites as jest.Mock).mockResolvedValue(mockDownloadedSites);
  });

  // TC36, TC45
  it('shows loading state while checking network', () => {
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    expect(getByText('Checking network...')).toBeTruthy();
  });

  // TC36, TC45
  it('shows loading state while loading sites', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText, queryByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    // Initially should show "Checking network..."
    expect(getByText('Checking network...')).toBeTruthy();

    // Trigger network status update
    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    // Should briefly show "Loading sites..." or quickly load data
    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });
  });

  // TC37, TC38
  it('loads and displays online sites when connected', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(database.getSitesOnline).toHaveBeenCalled();
      expect(database.getDownloadedSites).toHaveBeenCalled();
      expect(getByText('Alpha Site')).toBeTruthy();
      expect(getByText('Bravo Site')).toBeTruthy();
      expect(getByText('Charlie Site')).toBeTruthy();
    }, { timeout: 3000 });
  });

  // TC26, TC45
  it('loads offline sites when not connected', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: false });
    });

    await waitFor(() => {
      expect(database.getDownloadedSites).toHaveBeenCalled();
      expect(database.getSitesOnline).not.toHaveBeenCalled();
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });
  });

  // TC37
  it('displays county information for sites', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Jasper')).toBeTruthy();
      expect(getByText('Banff')).toBeTruthy();
      expect(getByText('Canmore')).toBeTruthy();
    }, { timeout: 3000 });
  });

  // TC36, TC45
  it('displays Online status when connected', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Online')).toBeTruthy();
    }, { timeout: 3000 });
  });

  // TC36, TC45
  it('displays Offline status when not connected', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: false });
    });

    await waitFor(() => {
      expect(getByText('Offline')).toBeTruthy();
    }, { timeout: 3000 });
  });

  // TC39, TC40
  it('filters sites by name when searching', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    const searchBar = getByPlaceholderText('Search site name');
    
    await act(async () => {
      fireEvent.changeText(searchBar, 'Alpha');
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
      expect(queryByText('Bravo Site')).toBeNull();
      expect(queryByText('Charlie Site')).toBeNull();
    });
  });

  // TC39, TC40
  it('filters sites by county when searching', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    const searchBar = getByPlaceholderText('Search site name');
    
    await act(async () => {
      fireEvent.changeText(searchBar, 'Banff');
    });

    await waitFor(() => {
      expect(getByText('Bravo Site')).toBeTruthy();
      expect(queryByText('Alpha Site')).toBeNull();
      expect(queryByText('Charlie Site')).toBeNull();
    });
  });

  // TC39
  it('search is case-insensitive', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByPlaceholderText, getByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    const searchBar = getByPlaceholderText('Search site name');
    
    await act(async () => {
      fireEvent.changeText(searchBar, 'ALPHA');
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    });
  });

  // TC39
  it('test common name element search', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByPlaceholderText, getByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    const searchBar = getByPlaceholderText('Search site name');
    
    await act(async () => {
      fireEvent.changeText(searchBar, 'Site');
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
      expect(getByText('Bravo Site')).toBeTruthy();
      expect(getByText('Charlie Site')).toBeTruthy();
    });
  });

  // TC39
  it('test invalid search responses', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByPlaceholderText, queryByText, getByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    const searchBar = getByPlaceholderText('Search site name');
    
    await act(async () => {
      fireEvent.changeText(searchBar, 'Edmonton');
    });

    await waitFor(() => {
      expect(queryByText('Alpha Site')).toBeNull();
      expect(queryByText('Bravo Site')).toBeNull();
      expect(queryByText('Charlie Site')).toBeNull();
    });
  });

  // TC39
  it('opens sort menu when sort button pressed', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    // Open sort menu
    await act(async () => {
      fireEvent.press(getByText(/Sort:/));
    });

    await waitFor(() => {
      expect(getByText('Name (A-Z)')).toBeTruthy();
      expect(getByText('Name (Z-A)')).toBeTruthy();
      expect(getByText('Inspection (Newest)')).toBeTruthy();
      expect(getByText('Inspection (Oldest)')).toBeTruthy();
    });
  });

  // TC40, TC41
  it('sorts sites by name alphabetically (A-Z)', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    // Open sort menu
    await act(async () => {
      fireEvent.press(getByText(/Sort:/));
    });

    await waitFor(() => {
      expect(getByText('Name (A-Z)')).toBeTruthy();
    });

    // Select sort by name A-Z
    await act(async () => {
      fireEvent.press(getByText('Name (A-Z)'));
    });

    await waitFor(() => {
      expect(getByText('Sort: Name (A-Z)')).toBeTruthy();
    });

    // Verify all sites are still displayed
    expect(getByText('Alpha Site')).toBeTruthy();
    expect(getByText('Bravo Site')).toBeTruthy();
    expect(getByText('Charlie Site')).toBeTruthy();
  });

  // TC40, TC41
  it('sorts sites by name reverse alphabetically (Z-A)', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    // Open sort menu
    await act(async () => {
      fireEvent.press(getByText(/Sort:/));
    });

    await waitFor(() => {
      expect(getByText('Name (Z-A)')).toBeTruthy();
    });

    // Select sort by name Z-A
    await act(async () => {
      fireEvent.press(getByText('Name (Z-A)'));
    });

    await waitFor(() => {
      expect(getByText('Sort: Name (Z-A)')).toBeTruthy();
    });

    // Verify all sites are still displayed
    expect(getByText('Alpha Site')).toBeTruthy();
    expect(getByText('Bravo Site')).toBeTruthy();
    expect(getByText('Charlie Site')).toBeTruthy();
  });

  // TC42
  it('sorts sites by most recent inspection date', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    // Open sort menu
    await act(async () => {
      fireEvent.press(getByText(/Sort:/));
    });

    await waitFor(() => {
      expect(getByText('Inspection (Newest)')).toBeTruthy();
    });

    // Select sort by most recent
    await act(async () => {
      fireEvent.press(getByText('Inspection (Newest)'));
    });

    await waitFor(() => {
      expect(getByText('Sort: Inspection (Newest)')).toBeTruthy();
    });

    // Verify all sites are still displayed
    expect(getByText('Alpha Site')).toBeTruthy();
    expect(getByText('Bravo Site')).toBeTruthy();
    expect(getByText('Charlie Site')).toBeTruthy();
  });

  // TC42
  it('sorts sites by oldest inspection date', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    // Open sort menu
    await act(async () => {
      fireEvent.press(getByText(/Sort:/));
    });

    await waitFor(() => {
      expect(getByText('Inspection (Oldest)')).toBeTruthy();
    });

    // Select sort by oldest
    await act(async () => {
      fireEvent.press(getByText('Inspection (Oldest)'));
    });

    await waitFor(() => {
      expect(getByText('Sort: Inspection (Oldest)')).toBeTruthy();
    });

    // Verify all sites are still displayed
    expect(getByText('Alpha Site')).toBeTruthy();
    expect(getByText('Bravo Site')).toBeTruthy();
    expect(getByText('Charlie Site')).toBeTruthy();
  });

  // TC43
  it('navigates to detail screen when site card pressed', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.press(getByText('Alpha Site'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('Detail', {
      site: mockSitesOnline[0],
    });
  });

  // TC43
  it('navigates to detail page of selected site by pressing card', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
      expect(getByText('Bravo Site')).toBeTruthy();
    }, { timeout: 3000 });

    // Press the second site card
    await act(async () => {
      fireEvent.press(getByText('Bravo Site'));
    });

    // Check that navigation was called correctly
    expect(mockNavigate).toHaveBeenCalledWith('Detail', { site: mockSitesOnline[1] });
  });

  // TC21
  it('displays error message when loading fails', async () => {
    const errorMessage = 'Failed to load sites';
    (database.getSitesOnline as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );
    (database.getDownloadedSites as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );
    
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText(errorMessage)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('displays all sites when search is cleared', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<HomeScreen />, {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    const searchBar = getByPlaceholderText('Search site name');
    
    // Search for specific site
    await act(async () => {
      fireEvent.changeText(searchBar, 'Alpha');
    });
    
    await waitFor(() => {
      expect(queryByText('Bravo Site')).toBeNull();
    });

    // Clear search
    await act(async () => {
      fireEvent.changeText(searchBar, '');
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
      expect(getByText('Bravo Site')).toBeTruthy();
      expect(getByText('Charlie Site')).toBeTruthy();
    });
  });

  // TC36
  it('unsubscribes from NetInfo on unmount', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { unmount, getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      expect(getByText('Alpha Site')).toBeTruthy();
    }, { timeout: 3000 });

    await act(async () => {
      unmount();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  // TC37
  it('displays badge with days/months/years since inspection', async () => {
    let networkCallback: ((state: any) => void) | null = null;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      return mockUnsubscribe;
    });

    const { getAllByText } = render(<HomeScreen />, { wrapper: AllTheProviders });

    await act(async () => {
      networkCallback?.({ isConnected: true });
    });

    await waitFor(() => {
      // Match badges with D/M/Y, including 0D
      const badges = getAllByText(/\d+\s?[DMY]/i);
      expect(badges.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});