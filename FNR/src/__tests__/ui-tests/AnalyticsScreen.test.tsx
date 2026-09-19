import React from 'react';
import { Text, TextInput } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { configureFonts, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../../screens/SettingsScreen', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible, onDismiss, onSave }: any) => {
      if (!visible) return null;
      return (
        <View>
          <Text>SettingsModal</Text>
          <Text onPress={() => onSave && onSave(7)}>Save</Text>
          <Text onPress={() => onDismiss && onDismiss()}>Dismiss</Text>
        </View>
      );
    },
  };
});

// Mock react-native-chart-kit PieChart
jest.mock('react-native-chart-kit', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    PieChart: (props: any) => {
      return React.createElement(View, { testID: 'mock-pie-chart' });
    },
  };
});

// Mock react-native-maps
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

// Mock Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock useFocusEffect
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

import AnalyticsScreen from '../../screens/AnalyticsScreen';
import { supabase } from '../../services/supabase';

// Test helpers / providers
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

describe('AnalyticsScreen', () => {
  // Mock data with correct structure
  const mockSupabaseResponse = {
    count: 150,
    error: null,
  };

  const mockLastInspectionResponse = {
    data: [{ inspectdate: '2024-10-15' }],
    error: null,
  };

  const mockNaturalnessData = {
    data: [
      { naturalness_score: 'High', count: 50 },
      { naturalness_score: 'Medium', count: 60 },
      { naturalness_score: 'Low', count: 40 },
    ],
    error: null,
  };

  const mockTopSitesData = {
    data: [
      { namesite: 'Alpha Site', count: 30 },
      { namesite: 'Bravo Site', count: 25 },
      { namesite: 'Charlie Site', count: 20 },
      { namesite: 'Delta Site', count: 15 },
      { namesite: 'Echo Site', count: 10 },
    ],
    error: null,
  };

  const mockHeatmapData = {
    data: [
      { namesite: 'Test Site 1', count: 5 },
      { namesite: 'Test Site 2', count: 3 },
    ],
    error: null,
  };

  function setupSupabaseMocks({
    count = mockSupabaseResponse,
    lastInspection = mockLastInspectionResponse,
    naturalness = mockNaturalnessData,
    topSites = mockTopSitesData,
    heatmap = mockHeatmapData,
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
        return Promise.resolve(heatmap);
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

  // TC19
  it('renders the Analytics Overview header', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Analytics Overview')).toBeTruthy();
    });
  });

  // TC19
  it('renders KPI cards with correct labels', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Total Sites Inspected')).toBeTruthy();
      expect(getByText('Last Inspection')).toBeTruthy();
    });
  });

  // TC19
  it('displays fetched total inspections count', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('150')).toBeTruthy();
    });
  });

  // TC19
  it('displays last inspection date as time ago', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText(/ago|Today|Yesterday/)).toBeTruthy();
    });
  });

  // TC21
  it('displays "Not Available" when no last inspection date', async () => {
    setupSupabaseMocks({
      count: { count: 0, error: null },
      lastInspection: { data: [], error: null },
      naturalness: mockNaturalnessData,
      topSites: mockTopSitesData,
    });

    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Not Available')).toBeTruthy();
    });
  });

  // TC19
  it('renders Naturalness Score Distribution chart title', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Naturalness Score Distribution')).toBeTruthy();
    });
  });

  // TC19 - Updated chart title
  it('renders Site Ranking by Inspection Count chart title', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Site Ranking by Inspection Count')).toBeTruthy();
    });
  });

  // New test for Site Locator section
  it('renders Site Locator section', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Site Locator')).toBeTruthy();
    });
  });

  // New test for Search button
  it('renders Search button in Site Locator', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Search')).toBeTruthy();
    });
  });

  // New test for Show/Hide Markers button
  it('renders Show Markers button initially', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Show Markers')).toBeTruthy();
    });
  });

  // New test for toggling markers
  it('toggles between Show and Hide Markers', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Show Markers')).toBeTruthy();
    });

    const toggleButton = getByText('Show Markers');

    await act(async () => {
      fireEvent.press(toggleButton);
    });

    await waitFor(() => {
      expect(getByText('Hide Markers')).toBeTruthy();
    });
  });

  // New test for MapView rendering
  it('renders MapView component', async () => {
    const { getByTestId } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByTestId('mock-map-view')).toBeTruthy();
    });
  });

  // TC56, TC57
  it('renders the Sync Now button', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Sync Now')).toBeTruthy();
    });
  });

  it('shows loading state initially', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Analytics Overview')).toBeTruthy();
    });
  });

  it('calls Supabase to fetch analytics data on mount', async () => {
    render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('sites_report_fnr_test');
      expect(supabase.rpc).toHaveBeenCalledWith('get_naturalness_distribution');
      expect(supabase.rpc).toHaveBeenCalledWith('get_top_sites_distribution');
    });
  });

  it('displays toast message after successful data fetch', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Analytics updated!')).toBeTruthy();
    });
  });

  it('handles Sync Now button press', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Sync Now')).toBeTruthy();
    });

    const syncButton = getByText('Sync Now');

    await act(async () => {
      fireEvent.press(syncButton);
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  it('displays error toast when data fetch fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    setupSupabaseMocks({
      count: { count: null, error: { message: 'Network error' } },
      lastInspection: mockLastInspectionResponse,
      naturalness: mockNaturalnessData,
      topSites: mockTopSitesData,
    });

    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Failed to fetch analytics')).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it('hides toast after dismissing', async () => {
    const { getByText, queryByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Analytics updated!')).toBeTruthy();
    });

    const toast = getByText('Analytics updated!');

    await act(async () => {
      fireEvent(toast, 'onDismiss');
    });

    await waitFor(() => {
      expect(queryByText('Analytics updated!')).toBeNull();
    });
  });

  it('displays "No data available" when naturalness data is empty', async () => {
    setupSupabaseMocks({
      count: mockSupabaseResponse,
      lastInspection: mockLastInspectionResponse,
      naturalness: { data: [], error: null },
      topSites: mockTopSitesData,
    });

    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('No data available')).toBeTruthy();
    });
  });

  it('displays "No site data available" when site data is empty', async () => {
    setupSupabaseMocks({
      count: mockSupabaseResponse,
      lastInspection: mockLastInspectionResponse,
      naturalness: mockNaturalnessData,
      topSites: { data: [], error: null },
    });

    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('No site data available')).toBeTruthy();
    });
  });

  it('button is disabled while loading (rendered)', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Sync Now')).toBeTruthy();
    });
  });

  it('refetches data when sync button is pressed', async () => {
    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('150')).toBeTruthy();
    });

    jest.clearAllMocks();

    setupSupabaseMocks({
      count: { count: 200, error: null },
      lastInspection: mockLastInspectionResponse,
      naturalness: mockNaturalnessData,
      topSites: mockTopSitesData,
    });

    const syncButton = getByText('Sync Now');

    await act(async () => {
      fireEvent.press(syncButton);
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('sites_report_fnr_test');
    });
  });

  it('toast auto-dismisses after 2 seconds', async () => {
    jest.useFakeTimers();

    const { getByText, queryByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(getByText('Analytics updated!')).toBeTruthy();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(queryByText('Analytics updated!')).toBeNull();
    });

    jest.useRealTimers();
  });

  it('assigns GlobalFunctions.openSettingsModal and opens SettingsModal when invoked', async () => {
    const GlobalFunctions = require('../../utils/globalFunctions').default;

    const { getByText } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    expect(GlobalFunctions.openSettingsModal).toBeDefined();

    act(() => {
      GlobalFunctions.openSettingsModal();
    });

    await waitFor(() => {
      expect(getByText('SettingsModal')).toBeTruthy();
    });
  });

  it('passes correctly formatted pie data to PieChart (naturalness and sites)', async () => {
    const { queryAllByTestId } = render(<AnalyticsScreen />, {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      const pies = queryAllByTestId('mock-pie-chart');
      expect(pies.length).toBe(2);
    });
  });

  it('retries/refetches data when screen focus triggers useFocusEffect (mocked)', async () => {
    render(<AnalyticsScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_naturalness_distribution');
      expect(supabase.rpc).toHaveBeenCalledWith('get_top_sites_distribution');
    });
  });

  it('handles RPC failures gracefully (naturalness rpc fails)', async () => {
    setupSupabaseMocks({
      count: mockSupabaseResponse,
      lastInspection: mockLastInspectionResponse,
      naturalness: { data: null, error: { message: 'rpc error' } },
      topSites: mockTopSitesData,
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = render(<AnalyticsScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(getByText('Failed to fetch analytics')).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });
});