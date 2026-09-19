import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PDFViewerScreen from '../../screens/PDFViewerScreen';
import * as FileSystem from 'expo-file-system/legacy';

// --- Mock expo-file-system/legacy ---
jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  readAsStringAsync: jest.fn(async (uri: string) => 'FAKE_BASE64_DATA'),
}));

// --- Mock react-native-webview ---
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    WebView: React.forwardRef(({ onLoadEnd }: any, ref: any) => {
      React.useEffect(() => {
        // simulate that the WebView finished loading
        onLoadEnd && onLoadEnd();
      }, [onLoadEnd]);
      return (
        <View testID="mock-webview">
          <Text>Mock WebView</Text>
        </View>
      );
    }),
  };
});

// --- Clear mocks before each test ---
beforeEach(() => {
  jest.clearAllMocks();
});

describe('PDFViewerScreen', () => {
  const renderScreen = (uri: string) =>
    render(<PDFViewerScreen route={{ params: { uri } }} />);

  // TC52: Shows loading indicator initially
  it('shows loading indicator initially', async () => {
    const { getByText, getByTestId } = renderScreen('file:///some/path.pdf');
    
    // Check ActivityIndicator and loading text
    expect(getByText('Loading PDF...')).toBeTruthy();
    
    // Wait for FileSystem.readAsStringAsync to be called
    await waitFor(() => {
      expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
    });
  });

  // TC52: Loads remote PDF without using FileSystem
  it('loads remote PDF without using FileSystem', async () => {
    const { getByText } = renderScreen('https://example.com/sample.pdf');
    
    // Wait for WebView to render
    await waitFor(() => {
      expect(getByText('Mock WebView')).toBeTruthy();
    });
    
    // Ensure local file read was not called
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });

  // TC52, TC14: Reads local PDF file as base64
  it('reads local PDF file as base64', async () => {
    // Provide a valid base64 string so component succeeds
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('VALID_BASE64');

    const { getByText } = renderScreen('file:///local/test.pdf');

    await waitFor(() => {
      expect(getByText('Mock WebView')).toBeTruthy();
    });

    // Ensure FileSystem was called correctly
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      'file:///local/test.pdf',
      expect.objectContaining({ encoding: FileSystem.EncodingType.Base64 })
    );
  });


  // TC21, TC35: Shows error message if FileSystem fails
  it('shows error message if FileSystem fails', async () => {
    // Force readAsStringAsync to fail
    (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(
      new Error('file read fail')
    );
    
    const { findByText } = renderScreen('file:///broken.pdf');
    
    // Expect error message to appear
    expect(await findByText(/PDF error/i)).toBeTruthy();
    expect(await findByText(/file read fail/i)).toBeTruthy();
  });
});
