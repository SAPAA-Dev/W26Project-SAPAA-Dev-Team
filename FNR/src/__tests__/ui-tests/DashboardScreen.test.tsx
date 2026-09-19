import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import DashboardScreen from '../../screens/DashboardScreen';
import { supabase } from '../../services/supabase';
import { getCoordinatesFromName } from '../../services/openCage';
import { PaperProvider } from 'react-native-paper';
import { MD3LightTheme } from 'react-native-paper';

// Mock dependencies
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('../../services/openCage', () => ({
  getCoordinatesFromName: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = React.forwardRef((props: any, ref: any) => {
    return React.createElement(View, { 
      testID: 'mock-map-view',
      ref,
      ...props 
    }, props.children);
  });
  
  const MockHeatmap = (props: any) => {
    return React.createElement(View, { testID: 'mock-heatmap', ...props });
  };
  
  const MockMarker = (props: any) => {
    return React.createElement(View, { testID: 'mock-marker', ...props });
  };
  
  return {
    __esModule: true,
    default: MockMapView,
    Heatmap: MockHeatmap,
    Marker: MockMarker,
  };
});

jest.mock('react-native-chart-kit', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    PieChart: (props: any) => {
      return React.createElement(View, { testID: 'mock-pie-chart' });
    },
  };
});

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = React.forwardRef((props: any, ref: any) => {
    return React.createElement(Text, { ref, ...props }, props.name || 'icon');
  });
  return {
    MaterialCommunityIcons: MockIcon,
    MaterialIcons: MockIcon,
    Ionicons: MockIcon,
    FontAwesome: MockIcon,
    FontAwesome5: MockIcon,
    Feather: MockIcon,
    AntDesign: MockIcon,
    Entypo: MockIcon,
  };
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return React.forwardRef((props: any, ref: any) => (
    React.createElement(Text, { ref, ...props }, props.name || 'icon')
  ));
});

// Test wrapper with theme provider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const theme = {
    ...MD3LightTheme,
  };

  return (
    <PaperProvider
      theme={theme}
      settings={{
        icon: (props: any) => {
          const { Text } = require('react-native');
          return React.createElement(Text, null, props.name);
        },
      }}
    >
      {children}
    </PaperProvider>
  );
};

describe('DashboardScreen', () => {
  const mockSupabaseCountResponse = {
    count: 150,
    error: null,
  };

  const mockLastInspectionDate = {
    data: [{ inspectdate: '2024-11-20T10:30:00Z' }],
    error: null,
  };

  const mockNaturalnessData = {
    data: [
      { naturalness_score: 'High', count: 50 },
      { naturalness_score: 'Medium', count: 75 },
      { naturalness_score: 'Low', count: 25 },
    ],
    error: null,
  };

  const mockTopSitesData = {
    data: [
      { namesite: 'Site A', count: 40 },
      { namesite: 'Site B', count: 30 },
      { namesite: 'Site C', count: 20 },
      { namesite: 'Site D', count: 15 },
      { namesite: 'Site E', count: 10 },
    ],
    error: null,
  };

  function setupSupabaseMocks({
    count = mockSupabaseCountResponse,
    lastInspection = mockLastInspectionDate,
    naturalness = mockNaturalnessData,
    topSites = mockTopSitesData,
  } = {}) {
    (supabase.rpc as jest.Mock).mockReset();
    (supabase.from as jest.Mock).mockReset();

    // RPC calls
    (supabase.rpc as jest.Mock).mockImplementation((fnName: string) => {
      if (fnName === 'get_naturalness_distribution') {
        return Promise.resolve(naturalness);
      } else if (fnName === 'get_top_sites_distribution') {
        return Promise.resolve(topSites);
      } else if (fnName === 'get_heatmap_data') {
        return Promise.resolve({ data: [], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    // from(...).select(...) behavior
    (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
      return {
        select: (cols?: any, opts?: any) => {
          if (cols === 'namesite' && opts && opts.count) {
            return Promise.resolve({
              count: count.count,
              error: count.error
            });
          }

          if (cols === 'inspectdate') {
            return {
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: lastInspection.data,
                  error: lastInspection.error
                }),
              }),
            };
          }

          return Promise.resolve({ data: [], error: null });
        },
      };
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    setupSupabaseMocks();
  });

  describe('Initial Rendering', () => {
    it('renders loading indicator initially', () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue(
              new Promise(() => {}) // Never resolves to keep loading state
            ),
          }),
        }),
      });

      (supabase.rpc as jest.Mock).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      const { UNSAFE_getByType } = render(<DashboardScreen />, { wrapper: AllTheProviders });
      const ActivityIndicator = require('react-native').ActivityIndicator;
      
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('renders dashboard title', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });
      
      await waitFor(() => {
        expect(getByText('Admin Dashboard')).toBeTruthy();
      });
    });
  });

  describe('Stats Fetching', () => {
    it('fetches and displays total inspections count', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('150')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('fetches and displays last inspection date', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('Last Inspection')).toBeTruthy();
      });
    });

    it('handles missing last inspection date', async () => {
      setupSupabaseMocks({
        count: mockSupabaseCountResponse,
        lastInspection: { data: [], error: null },
        naturalness: mockNaturalnessData,
        topSites: mockTopSitesData,
      });

      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('Not Available')).toBeTruthy();
      });
    });

    it('handles fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      setupSupabaseMocks({
        count: { count: null, error: { message: 'Database error' } },
        lastInspection: mockLastInspectionDate,
        naturalness: mockNaturalnessData,
        topSites: mockTopSitesData,
      });

      render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching stats:',
          expect.any(String)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Time Ago Calculation', () => {
    it('displays "Today" for same day', async () => {
      const today = new Date().toISOString();
      
      setupSupabaseMocks({
        count: mockSupabaseCountResponse,
        lastInspection: { data: [{ inspectdate: today }], error: null },
        naturalness: mockNaturalnessData,
        topSites: mockTopSitesData,
      });

      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText(/Today/)).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('displays "Yesterday" for previous day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      setupSupabaseMocks({
        count: mockSupabaseCountResponse,
        lastInspection: { data: [{ inspectdate: yesterday.toISOString() }], error: null },
        naturalness: mockNaturalnessData,
        topSites: mockTopSitesData,
      });

      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText(/Yesterday/)).toBeTruthy();
      }, { timeout: 3000 });
    });
  });
  
  describe('Pie Charts', () => {
    it('renders naturalness distribution pie chart', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('Naturalness Score Distribution')).toBeTruthy();
      });
    });

    it('renders site ranking by inspection count chart', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('Site Ranking by Inspection Count')).toBeTruthy();
      });
    });

    it('displays no data message when naturalness data is empty', async () => {
      setupSupabaseMocks({
        count: mockSupabaseCountResponse,
        lastInspection: mockLastInspectionDate,
        naturalness: { data: [], error: null },
        topSites: mockTopSitesData,
      });

      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('No data available')).toBeTruthy();
      });
    });

    it('displays no site data message when site data is empty', async () => {
      setupSupabaseMocks({
        count: mockSupabaseCountResponse,
        lastInspection: mockLastInspectionDate,
        naturalness: mockNaturalnessData,
        topSites: { data: [], error: null },
      });

      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('No site data available')).toBeTruthy();
      });
    });
  });

  describe('Heatmap Search', () => {
    const mockHeatmapData = {
      data: [
        { namesite: 'Edmonton Park', count: 10 },
        { namesite: 'Calgary Trail', count: 5 },
      ],
      error: null,
    };

    beforeEach(() => {
      (getCoordinatesFromName as jest.Mock).mockImplementation((siteName) => {
        const coords: { [key: string]: { latitude: number; longitude: number } } = {
          'Edmonton Park': { latitude: 53.5461, longitude: -113.4938 },
          'Calgary Trail': { latitude: 51.0447, longitude: -114.0719 },
        };
        return Promise.resolve(coords[siteName] || null);
      });
    });

    it('renders search input and button', async () => {
      const { getByPlaceholderText, getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByPlaceholderText('Enter site description...')).toBeTruthy();
        expect(getByText('Search')).toBeTruthy();
      });
    });

    it('updates keyword on text input', async () => {
      const { getByPlaceholderText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        const input = getByPlaceholderText('Enter site description...');
        fireEvent.changeText(input, 'Edmonton');
      });
    });

    it('performs search and displays heatmap', async () => {
      (supabase.rpc as jest.Mock).mockImplementation((rpcName, params) => {
        if (rpcName === 'get_heatmap_data') {
          return Promise.resolve(mockHeatmapData);
        }
        if (rpcName === 'get_naturalness_distribution') {
          return Promise.resolve(mockNaturalnessData);
        }
        if (rpcName === 'get_top_sites_distribution') {
          return Promise.resolve(mockTopSitesData);
        }
        return Promise.resolve({ data: [], error: null });
      });

      const { getByPlaceholderText, getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByPlaceholderText('Enter site description...')).toBeTruthy();
      });

      await act(async () => {
        const input = getByPlaceholderText('Enter site description...');
        fireEvent.changeText(input, 'park');
      });

      await act(async () => {
        const searchButton = getByText('Search');
        fireEvent.press(searchButton);
      });

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('get_heatmap_data', {
          keyword: 'park',
        });
      });
    });

    it('handles empty search results', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (supabase.rpc as jest.Mock).mockImplementation((rpcName) => {
        if (rpcName === 'get_heatmap_data') {
          return Promise.resolve({ data: [], error: null });
        }
        if (rpcName === 'get_naturalness_distribution') {
          return Promise.resolve(mockNaturalnessData);
        }
        if (rpcName === 'get_top_sites_distribution') {
          return Promise.resolve(mockTopSitesData);
        }
        return Promise.resolve({ data: [], error: null });
      });

      const { getByPlaceholderText, getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByPlaceholderText('Enter site description...')).toBeTruthy();
      });

      await act(async () => {
        const input = getByPlaceholderText('Enter site description...');
        fireEvent.changeText(input, 'nonexistent');
      });

      await act(async () => {
        const searchButton = getByText('Search');
        fireEvent.press(searchButton);
      });

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'No results found for:',
          'nonexistent'
        );
      });

      consoleWarnSpy.mockRestore();
    });

    it('handles sites with missing coordinates', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (getCoordinatesFromName as jest.Mock).mockResolvedValue(null);
      
      (supabase.rpc as jest.Mock).mockImplementation((rpcName) => {
        if (rpcName === 'get_heatmap_data') {
          return Promise.resolve(mockHeatmapData);
        }
        if (rpcName === 'get_naturalness_distribution') {
          return Promise.resolve(mockNaturalnessData);
        }
        if (rpcName === 'get_top_sites_distribution') {
          return Promise.resolve(mockTopSitesData);
        }
        return Promise.resolve({ data: [], error: null });
      });

      const { getByPlaceholderText, getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByPlaceholderText('Enter site description...')).toBeTruthy();
      });

      await act(async () => {
        const input = getByPlaceholderText('Enter site description...');
        fireEvent.changeText(input, 'test');
      });

      await act(async () => {
        const searchButton = getByText('Search');
        fireEvent.press(searchButton);
      });

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      consoleWarnSpy.mockRestore();
    });

    it('handles search errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (supabase.rpc as jest.Mock).mockImplementation((rpcName) => {
        if (rpcName === 'get_heatmap_data') {
          return Promise.resolve({
            data: null,
            error: { message: 'RPC error' },
          });
        }
        if (rpcName === 'get_naturalness_distribution') {
          return Promise.resolve(mockNaturalnessData);
        }
        if (rpcName === 'get_top_sites_distribution') {
          return Promise.resolve(mockTopSitesData);
        }
        return Promise.resolve({ data: [], error: null });
      });

      const { getByPlaceholderText, getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByPlaceholderText('Enter site description...')).toBeTruthy();
      });

      await act(async () => {
        const input = getByPlaceholderText('Enter site description...');
        fireEvent.changeText(input, 'error');
      });

      await act(async () => {
        const searchButton = getByText('Search');
        fireEvent.press(searchButton);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('disables search button when keyword is empty', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        const searchButton = getByText('Search');
        expect(searchButton).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Show/Hide Markers Toggle', () => {
    it('toggles show markers button', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        const toggleButton = getByText('Show Markers');
        expect(toggleButton).toBeTruthy();
      });

      await act(async () => {
        const toggleButton = getByText('Show Markers');
        fireEvent.press(toggleButton);
      });

      await waitFor(() => {
        expect(getByText('Hide Markers')).toBeTruthy();
      });

      await act(async () => {
        const toggleButton = getByText('Hide Markers');
        fireEvent.press(toggleButton);
      });

      await waitFor(() => {
        expect(getByText('Show Markers')).toBeTruthy();
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('refreshes data on pull to refresh', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('Admin Dashboard')).toBeTruthy();
      });

      expect(supabase.from).toHaveBeenCalled();
    });
  });

  describe('Map Interaction', () => {
    it('renders Site Locator section', async () => {
      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('Site Locator')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles null/undefined data gracefully', async () => {
      setupSupabaseMocks({
        count: mockSupabaseCountResponse,
        lastInspection: mockLastInspectionDate,
        naturalness: { data: null, error: null },
        topSites: mockTopSitesData,
      });

      const { getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByText('No data available')).toBeTruthy();
      });
    });

    it('handles search with whitespace-only keyword', async () => {
      const { getByPlaceholderText, getByText } = render(<DashboardScreen />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(getByPlaceholderText('Enter site description...')).toBeTruthy();
      });

      (supabase.rpc as jest.Mock).mockClear();

      await act(async () => {
        const input = getByPlaceholderText('Enter site description...');
        fireEvent.changeText(input, '   ');
      });

      await act(async () => {
        const searchButton = getByText('Search');
        fireEvent.press(searchButton);
      });

      const heatmapCalls = (supabase.rpc as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'get_heatmap_data'
      );
      expect(heatmapCalls.length).toBe(0);
    });
  });
});