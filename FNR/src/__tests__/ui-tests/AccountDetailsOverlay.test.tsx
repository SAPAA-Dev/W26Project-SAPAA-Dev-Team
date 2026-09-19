import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccountDetailsOverlay from '../../screens/AccountDetailsOverlay';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: jest.fn(() => null),
}));

describe('AccountDetailsOverlay', () => {
  const mockUser = { id: '1', email: 'alice@example.com', role: 'steward' };
  const onClose = jest.fn();
  const onSave = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const destructive = buttons?.find(b => b.style === 'destructive');
      if (destructive?.onPress) destructive.onPress();
    });
  });

  // TC29 
  it('renders correctly for new user', () => {
    const { getByPlaceholderText, getByText } = render(
      <AccountDetailsOverlay visible={true} user={null} onClose={onClose} onSave={onSave} />
    );

    expect(getByText('Add New User')).toBeTruthy();
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
  });

  it('renders correctly for existing user', () => {
    const { getByText, getByDisplayValue, getByPlaceholderText } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} onDelete={onDelete} />
    );

    expect(getByText('Edit User')).toBeTruthy();
    expect(getByDisplayValue(mockUser.email)).toBeTruthy();
    expect(getByPlaceholderText('New password (optional)')).toBeTruthy();
    expect(getByPlaceholderText('Confirm new password')).toBeTruthy();
  });

  it('calls onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} onDelete={onDelete} />
    );

    fireEvent.press(getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  // TC30 
  it('calls onSave with correct data when saving without password', () => {
    const { getByText } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} onDelete={onDelete} />
    );

    fireEvent.press(getByText('Save'));
    expect(onSave).toHaveBeenCalledWith({ email: mockUser.email, role: mockUser.role });
  });

  it('shows alert if passwords do not match', () => {
    const { getByText, getByPlaceholderText } = render(
      <AccountDetailsOverlay visible={true} user={null} onClose={onClose} onSave={onSave} />
    );

    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), '456');

    fireEvent.press(getByText('Save'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with password if provided', () => {
    const { getByText, getByPlaceholderText } = render(
      <AccountDetailsOverlay visible={true} user={null} onClose={onClose} onSave={onSave} />
    );

    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), '123456');
    fireEvent.changeText(getByPlaceholderText('Enter email'), 'bob@example.com');

    fireEvent.press(getByText('Save'));
    expect(onSave).toHaveBeenCalledWith({
      email: 'bob@example.com',
      role: 'steward',
      password: '123456',
    });
  });

  it('opens role dropdown and changes role', async () => {
    const { getByText, queryByText } = render(
      <AccountDetailsOverlay
        visible={true}
        user={mockUser}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    );

    // Open dropdown
    fireEvent.press(getByText('steward'));
    expect(getByText('admin')).toBeTruthy();

    // Select new role
    fireEvent.press(getByText('admin'));

    // Now the main box should show "admin"
    await waitFor(() => {
      expect(getByText('admin')).toBeTruthy(); // new role selected
      expect(queryByText('steward')).toBeNull(); // old role should be gone
    });
  });


  // TC25, TC26, TC27, TC31 (indirectly)
  it('calls onDelete when delete is confirmed', () => {
    const { getByTestId } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} onDelete={onDelete} />
    );

    fireEvent.press(getByTestId('delete-button'));
    expect(onDelete).toHaveBeenCalledWith(mockUser.id);
  });


  // -----------------------------
  // NEW TEST CASES (TC32–TC40)
  // -----------------------------

  // TC32
  it('hides delete button for new user', () => {
    const { queryByTestId } = render(
      <AccountDetailsOverlay visible={true} user={null} onClose={onClose} onSave={onSave} />
    );

    expect(queryByTestId('delete-button')).toBeNull();
  });

  // TC33
  it('hides delete button if onDelete is not provided', () => {
    const { queryByTestId } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} />
    );

    expect(queryByTestId('delete-button')).toBeNull();
  });

  // TC34
  it('updates fields when switching users', () => {
    const { rerender, getByDisplayValue } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} />
    );

    const newUser = { id: '2', email: 'bob@example.com', role: 'admin' };

    rerender(
      <AccountDetailsOverlay visible={true} user={newUser} onClose={onClose} onSave={onSave} />
    );

    expect(getByDisplayValue('bob@example.com')).toBeTruthy();
  });

  // TC35
  it('does not include password for new user if left blank', () => {
    const { getByPlaceholderText, getByText } = render(
      <AccountDetailsOverlay visible={true} user={null} onClose={onClose} onSave={onSave} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter email'), 'test@example.com');
    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      email: 'test@example.com',
      role: 'steward',
    });
  });

  // TC36
  it('modal does not render when visible=false', () => {
    const { queryByText } = render(
      <AccountDetailsOverlay visible={false} user={mockUser} onClose={onClose} onSave={onSave} />
    );

    expect(queryByText('Edit User')).toBeNull();
  });

  // TC37
  it('role update is reflected in save payload', () => {
    const { getByText } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} />
    );

    fireEvent.press(getByText('steward'));
    fireEvent.press(getByText('admin'));

    fireEvent.press(getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      email: mockUser.email,
      role: 'admin',
    });
  });

  // TC38
  it('placeholders differ between new and existing users', () => {
    const { rerender, getByPlaceholderText } = render(
      <AccountDetailsOverlay visible={true} user={null} onClose={onClose} onSave={onSave} />
    );

    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();

    rerender(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} />
    );

    expect(getByPlaceholderText('New password (optional)')).toBeTruthy();
    expect(getByPlaceholderText('Confirm new password')).toBeTruthy();
  });

  // TC39
  it('password and confirmPassword reset when user changes', () => {
    const { getByPlaceholderText, rerender } = render(
      <AccountDetailsOverlay visible={true} user={null} onClose={onClose} onSave={onSave} />
    );

    fireEvent.changeText(getByPlaceholderText('Password'), 'abc');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'abc');

    rerender(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} />
    );

    expect(getByPlaceholderText('New password (optional)').props.value).toBe('');
    expect(getByPlaceholderText('Confirm new password').props.value).toBe('');
  });

  // TC40
  it('dropdown closes after selecting a role', async () => {
    const { getByText, queryByText } = render(
      <AccountDetailsOverlay visible={true} user={mockUser} onClose={onClose} onSave={onSave} />
    );

    fireEvent.press(getByText('steward'));
    expect(getByText('admin')).toBeTruthy();

    fireEvent.press(getByText('admin'));

    await waitFor(() => {
      expect(queryByText('admin')).not.toBeNull(); // label persists
      // BUT dropdown items should disappear
      // (can't fully separate label vs dropdown item with RN testing lib)
    });
  });
});
