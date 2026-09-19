import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccountManagementScreen from '../../screens/AccountManagementScreen';
import * as adminAuth from '../../services/adminAuth';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockIcon = ({ name, ...props }: any) => <Text {...props}>{name}</Text>;
  return {
    MaterialCommunityIcons: MockIcon,
  };
});

jest.mock('../../services/adminAuth', () => ({
  getAllUsers: jest.fn(),
  addUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('An update to AccountManagementScreen inside a test was not wrapped in act')
    ) {
      return;
    }
    // fallback to original console.error
    // eslint-disable-next-line no-console
    console.warn(...args);
  });
});

const mockUsers = [
  { id: '1', email: 'alice@example.com', role: 'admin' },
  { id: '2', email: 'bob@example.com', role: 'steward' },
  { id: '3', email: 'charlie@example.com', role: 'viewer' },
];

describe('AccountManagementScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (adminAuth.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
  });

  // TC22
  it('renders user list', async () => {
    const { findByText } = render(<AccountManagementScreen />);
    for (const user of mockUsers) {
      expect(await findByText(user.email)).toBeTruthy();
      expect(await findByText(`Role: ${user.role || 'viewer'}`)).toBeTruthy();
    }
  });

  it('filters users by search query', async () => {
    const { getByPlaceholderText, queryByText } = render(<AccountManagementScreen />);
    const searchInput = getByPlaceholderText('Search by email...');
    fireEvent.changeText(searchInput, 'bob');

    await waitFor(() => {
      expect(queryByText('bob@example.com')).toBeTruthy();
      expect(queryByText('alice@example.com')).toBeNull();
      expect(queryByText('charlie@example.com')).toBeNull();
    });
  });

  it('shows add user modal when add button is pressed', async () => {
    const { getByTestId, queryByText } = render(<AccountManagementScreen />);
    const addButton = getByTestId('add-button');
    fireEvent.press(addButton);

    // Overlay should now exist
    expect(queryByText('Save')).toBeTruthy();
  });

  // TC29
  it('opens and closes sort modal', async () => {
    const { getByTestId, queryByText } = render(<AccountManagementScreen />);
    const sortButton = getByTestId('sort-button');
    fireEvent.press(sortButton);

    expect(queryByText('Email (A-Z)')).toBeTruthy();
    expect(queryByText('Email (Z-A)')).toBeTruthy();
    expect(queryByText('Stewards')).toBeTruthy();
    expect(queryByText('Admins')).toBeTruthy();

    // Close modal by pressing overlay
    const overlay = getByTestId('sort-modal-overlay');
    fireEvent.press(overlay);

    await waitFor(() => {
      expect(queryByText('Email (A-Z)')).toBeNull();
    });
  });

  it('sorts users by email ascending', async () => {
    const { getByTestId, getByText, findAllByText } = render(<AccountManagementScreen />);
    
    fireEvent.press(getByTestId('sort-button'));      // open modal
    fireEvent.press(getByText('Email (A-Z)'));        // click ascending

    const emails = (await findAllByText(/@example.com/)).map(e => e.props.children);
    const sortedEmails = [...emails].sort();
    expect(emails).toEqual(sortedEmails);
  });

  it('sorts users by email descending', async () => {
    const { getByTestId, getByText, findAllByText } = render(<AccountManagementScreen />);
    
    fireEvent.press(getByTestId('sort-button'));      // open modal
    fireEvent.press(getByText('Email (Z-A)'));        // click descending

    const emails = (await findAllByText(/@example.com/)).map(e => e.props.children);
    const sortedEmails = [...emails].sort().reverse();
    expect(emails).toEqual(sortedEmails);
  });

  it('filters users by role', async () => {
    const { getByTestId, getByText, queryByText } = render(<AccountManagementScreen />);

    fireEvent.press(getByTestId('sort-button'));
    fireEvent.press(getByText('Stewards'));         // click steward filter

    await waitFor(() => {
      expect(queryByText('bob@example.com')).toBeTruthy(); // steward
      expect(queryByText('alice@example.com')).toBeNull();
      expect(queryByText('charlie@example.com')).toBeNull();
    });

    fireEvent.press(getByTestId('sort-button'));
    fireEvent.press(getByText('Admins'));           // click admin filter

    await waitFor(() => {
      expect(queryByText('alice@example.com')).toBeTruthy(); // admin
      expect(queryByText('bob@example.com')).toBeNull();
      expect(queryByText('charlie@example.com')).toBeNull();
    });
  });
});
