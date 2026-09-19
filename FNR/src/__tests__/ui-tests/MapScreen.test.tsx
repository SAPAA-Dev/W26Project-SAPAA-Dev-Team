import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Linking } from 'react-native';
import MapScreen from '../../screens/MapScreen';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: (props: any) => <View testID="webview" {...props} />,
  };
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <PaperProvider>{children}</PaperProvider>;
};

describe('MapScreen', () => {
  let mockUnsubscribe: jest.Mock;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe = jest.fn();
    // Spy on Linking.openURL
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  // TC36, TC54
  it('shows loading state while checking network', () => {
    // Mock NetInfo to not call the listener immediately
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { getByText } = render(<MapScreen />, { wrapper: AllTheProviders });
    
    expect(getByText('Checking for network...')).toBeTruthy();
  });

  // TC33, TC36, TC54 
  it('renders WebView when connected to network', async () => {
    // Mock NetInfo to call listener with connected state
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return mockUnsubscribe;
    });

    const { getByTestId, getByText } = render(<MapScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(getByTestId('webview')).toBeTruthy();
      expect(getByText('Open in Google Maps')).toBeTruthy();
    });
  });

  // TC35, TC36, TC54
  it('renders offline message when not connected', async () => {
    // Mock NetInfo to call listener with disconnected state
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: false });
      return mockUnsubscribe;
    });

    const { getByText, queryByTestId } = render(<MapScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(queryByTestId('webview')).toBeNull();
      expect(getByText(/Offline or unable to load the map/)).toBeTruthy();
      expect(getByText('Open in Google Maps')).toBeTruthy();
    });
  });

  // TC33, TC34, TC54
  it('opens Google Maps link when button pressed (online)', async () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return mockUnsubscribe;
    });

    const { getByText } = render(<MapScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(getByText('Open in Google Maps')).toBeTruthy();
    });

    fireEvent.press(getByText('Open in Google Maps'));

    expect(openURLSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/d/u/0/viewer?mid=17UmWFgWahEs8KFgClfjU6TjRBpgLOUc'
    );
  });

  // TC33, TC34, TC54
  it('opens Google Maps link when button pressed (offline)', async () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: false });
      return mockUnsubscribe;
    });

    const { getByText } = render(<MapScreen />, { wrapper: AllTheProviders });

    await waitFor(() => {
      expect(getByText('Open in Google Maps')).toBeTruthy();
    });

    fireEvent.press(getByText('Open in Google Maps'));

    expect(openURLSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/d/u/0/viewer?mid=17UmWFgWahEs8KFgClfjU6TjRBpgLOUc'
    );
  });

  // TC36, TC54
  it('unsubscribes from NetInfo on unmount', () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      callback({ isConnected: true });
      return mockUnsubscribe;
    });

    const { unmount } = render(<MapScreen />, { wrapper: AllTheProviders });
    
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  // TC36, TC25, TC54
  it('updates view when network state changes', async () => {
    let networkCallback: (state: any) => void;
    
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      callback({ isConnected: true });
      return mockUnsubscribe;
    });

    const { getByTestId, getByText, queryByTestId } = render(
      <MapScreen />, 
      { wrapper: AllTheProviders }
    );

    // Initially online
    await waitFor(() => {
      expect(getByTestId('webview')).toBeTruthy();
    });

    // Simulate going offline
    await waitFor(() => {
      networkCallback!({ isConnected: false });
    });
    
    await waitFor(() => {
      expect(queryByTestId('webview')).toBeNull();
      expect(getByText(/Offline or unable to load the map/)).toBeTruthy();
    });
  });
});