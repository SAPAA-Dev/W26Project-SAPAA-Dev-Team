import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../../context/ThemeContext';
import { DEFAULT_AUTO_DELETE_DAYS } from '../../services/database';
import { Alert } from 'react-native';

// --- Mock AsyncStorage ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// --- Mock Theme Context ---
jest.mock('../../context/ThemeContext', () => ({
  useThemeContext: jest.fn(),
}));

describe('SettingsScreen', () => {
  const mockToggleTheme = jest.fn();
  const mockOnDismiss = jest.fn(); // <-- needed for cancel button

  beforeEach(() => {
    jest.clearAllMocks();
    (useThemeContext as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
    });
  });

  // TC79, TC80: renders settings screen sections
  it('renders settings screen with offline data and appearance sections', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(DEFAULT_AUTO_DELETE_DAYS.toString());

    const { getByText, getByPlaceholderText } = render(<SettingsScreen onDismiss={mockOnDismiss} />);

    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Dark Mode')).toBeTruthy();
      expect(getByText('Auto-delete Offline Data (Days)')).toBeTruthy();
      expect(getByPlaceholderText('Days').props.value).toBe(DEFAULT_AUTO_DELETE_DAYS.toString());
    });
  });

  // TC81, TC83, TC86: loads and remembers custom auto-delete value
  it('loads preset value from AsyncStorage and allows custom input', async () => {
    const mockOnSave = jest.fn(); // <-- mock onSave
    const mockOnDismiss = jest.fn(); // reuse or create new

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('7');

    const { getByPlaceholderText, getByText } = render(
      <SettingsScreen 
        onDismiss={mockOnDismiss} 
        onSave={mockOnSave} 
        visible={true} // ensure useEffect runs
      />
    );

    // Wait until the value updates from AsyncStorage
    await waitFor(() => {
      expect(getByPlaceholderText('Days').props.value).toBe('7');
    });

    // Change the value and save
    fireEvent.changeText(getByPlaceholderText('Days'), '10');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      // Assert AsyncStorage.setItem is called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@SAPPA_autoDeleteDays', '10');
      // Assert onSave is called with the correct value
      expect(mockOnSave).toHaveBeenCalledWith(10);
      // Optionally check that onDismiss is called
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });


  // TC84, TC85: dark mode toggle works
  it('renders dark mode toggle and toggles theme', async () => {
    const { getByRole } = render(<SettingsScreen onDismiss={mockOnDismiss} />);

    const darkModeSwitch = getByRole('switch');
    expect(darkModeSwitch.props.value).toBe(false);

    fireEvent(darkModeSwitch, 'valueChange', true);
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  // TC82: validates auto-delete input
  it('prevents invalid auto-delete input', async () => {
    const alertMock = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByPlaceholderText, getByText } = render(<SettingsScreen onDismiss={mockOnDismiss} />);

    fireEvent.changeText(getByPlaceholderText('Days'), '0');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith(
        'Invalid Input',
        'Please enter a valid number of days (1 or more).'
      );
    });

    alertMock.mockRestore();
  });

  // TC86: cancel button closes screen without saving
  it('cancel button closes screen without saving', async () => {
    const { getByText } = render(<SettingsScreen onDismiss={mockOnDismiss} />);

    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  // TC81: fallback to default if AsyncStorage.getItem fails
  it('uses default value if AsyncStorage.getItem fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const { getByPlaceholderText } = render(<SettingsScreen onDismiss={mockOnDismiss} />);

    await waitFor(() => {
      expect(getByPlaceholderText('Days').props.value).toBe(DEFAULT_AUTO_DELETE_DAYS.toString());
    });
  });
});
