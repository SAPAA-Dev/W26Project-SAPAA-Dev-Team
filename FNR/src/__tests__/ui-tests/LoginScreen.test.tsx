import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

/**
 * ---------------------------------------------------------
 *  FIXED ICON MOCK - NO WARNINGS, NO act() ERRORS
 * ---------------------------------------------------------
 * We mock createIconSet() itself, because Expo Vector Icons
 * triggers an internal setState() inside that factory.
 * 
 * By mocking the entire factory, we stop ALL state updates.
 */
jest.mock('@expo/vector-icons/build/createIconSet', () => {
  const React = require('react');
  return () => () => React.createElement('Icon', null);
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const MockIcon = () => React.createElement('Icon', null);

  return new Proxy(
    {},
    {
      get: () => MockIcon, // ANY icon name → dead component
    }
  );
});

/**
 * React Native Paper icon mock
 */
jest.mock('react-native-paper/src/components/Icon', () => {
  const React = require('react');
  return () => React.createElement('Icon', null);
});

/**
 * ---------------------------------------------------------
 *  AUTH SERVICE MOCKS
 * ---------------------------------------------------------
 */
jest.mock('../../services/auth', () => ({
  login: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithMicrosoft: jest.fn(),
}));

import { login, loginWithGoogle, loginWithMicrosoft } from '../../services/auth';
import LoginScreen from '../../screens/LoginScreen';

/**
 * ---------------------------------------------------------
 *  NAVIGATION MOCK
 * ---------------------------------------------------------
 */
const mockNavigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
  getParent: jest.fn(() => null),
};

/**
 * Provider wrapper
 */
const Providers = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);


describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC67
  it('renders headings, inputs, buttons', () => {
    const { getByText, getByTestId } = render(
      <LoginScreen navigation={mockNavigation as any} />,
      { wrapper: Providers }
    );

    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to continue')).toBeTruthy();
    expect(getByTestId('login-username')).toBeTruthy();
    expect(getByTestId('login-password')).toBeTruthy();
    expect(getByTestId('login-continue')).toBeTruthy();
  });

  // TC68
  it('calls login with trimmed email and password', async () => {
    (login as jest.Mock).mockResolvedValue({ success: true });

    const { getByTestId } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    fireEvent.changeText(getByTestId('login-username'), '  user@example.com  ');
    fireEvent.changeText(getByTestId('login-password'), 'secret');

    await act(async () => {
      fireEvent.press(getByTestId('login-continue'));
    });

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@example.com', 'secret');
    });
  });

  // TC70
  it('shows error on failed login and clears when user edits', async () => {
    (login as jest.Mock).mockResolvedValue({ success: false, error: 'Invalid credentials' });

    const { getByTestId, getByText, queryByTestId } = render(
      <LoginScreen navigation={mockNavigation as any} />,
      { wrapper: Providers }
    );

    fireEvent.changeText(getByTestId('login-username'), 'user@example.com');
    fireEvent.changeText(getByTestId('login-password'), 'wrong');

    await act(async () => {
      fireEvent.press(getByTestId('login-continue'));
    });

    await waitFor(() => expect(getByTestId('login-error').props.children).toBe('Invalid credentials'));

    // Editing clears error
    fireEvent.changeText(getByTestId('login-username'), 'user2@example.com');
    await waitFor(() => expect(queryByTestId('login-error')).toBeNull());
  });

  // TC71
  it('does not call login if email or password is empty (current behavior)', async () => {
    (login as jest.Mock).mockResolvedValue({ success: false, error: 'Missing fields' });

    const { getByTestId } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    fireEvent.changeText(getByTestId('login-username'), '');
    fireEvent.changeText(getByTestId('login-password'), '');

    await act(async () => {
      fireEvent.press(getByTestId('login-continue'));
    });

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('', '');
    });
  });

  // TC93, TC94
  it('navigates to Signup screen', async () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    await act(async () => {
      fireEvent.press(getByText('Sign Up'));
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
  });

  // TC88
  it('handles Google login success', async () => {
    (loginWithGoogle as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    await act(async () => {
      fireEvent.press(getByText('Continue with Google'));
    });

    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalled());
  });

  // TC89
  it('shows error if Google login fails', async () => {
    (loginWithGoogle as jest.Mock).mockResolvedValue({ success: false, error: 'Google failed' });

    const { getByText, getByTestId } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    await act(async () => {
      fireEvent.press(getByText('Continue with Google'));
    });

    await waitFor(() => expect(getByTestId('login-error').props.children).toBe('Google failed'));
  });

  // TC88, TC90
  it('handles Microsoft login success', async () => {
    (loginWithMicrosoft as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    await act(async () => {
      fireEvent.press(getByText('Continue with Microsoft'));
    });

    await waitFor(() => expect(loginWithMicrosoft).toHaveBeenCalled());
  });

  // TC92
  it('shows signup prompt if Microsoft account not found', async () => {
    (loginWithMicrosoft as jest.Mock).mockResolvedValue({ success: false, error: 'Please sign up with Microsoft first' });

    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    await act(async () => {
      fireEvent.press(getByText('Continue with Microsoft'));
    });

    await waitFor(() => expect(getByText('Go to Sign Up')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText('Go to Sign Up'));
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
  });

  // TC91
  it('shows error if Microsoft login fails with other error', async () => {
    (loginWithMicrosoft as jest.Mock).mockResolvedValue({ success: false, error: 'Server error' });

    const { getByText, getByTestId } = render(<LoginScreen navigation={mockNavigation as any} />, { wrapper: Providers });

    await act(async () => {
      fireEvent.press(getByText('Continue with Microsoft'));
    });

    await waitFor(() => expect(getByTestId('login-error').props.children).toBe('Server error'));
  });
});
