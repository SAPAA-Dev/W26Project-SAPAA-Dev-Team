import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetPasswordPage from '../../app/reset-password/page';
import { createClient } from '@/utils/supabase/client';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...properties }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...properties}>{children}</a>
  ),
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('ResetPasswordPage', () => {
  const mockGetSession = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: { getSession: mockGetSession, updateUser: mockUpdateUser, signOut: mockSignOut },
    });
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'a' } } });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('5.0.2 AT2: shows an expired session message when there is no recovery session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<ResetPasswordPage />);

    expect(await screen.findByText(/Link expired/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request a new code/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('5.0.2 AT3: blocks a mismatched confirmation', async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText(/^New Password$/i), { target: { value: 'abcdef' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /Update password/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('5.0.2 AT3: blocks a password shorter than six characters', async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText(/^New Password$/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /Update password/i }));

    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('5.0.2 AT3, AT4: updates the password, signs out, and shows success', async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText(/^New Password$/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Update password/i }));

    expect(await screen.findByText(/Password updated/i)).toBeInTheDocument();
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpass123' });
    expect(mockSignOut).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /Back to Login/i })).toHaveAttribute('href', '/login');
  });

  it('5.0.2 AT3: shows an error when the update fails', async () => {
    mockUpdateUser.mockResolvedValue({ data: null, error: { message: 'Password is too weak' } });

    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText(/^New Password$/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Update password/i }));

    expect(await screen.findByText(/Password is too weak/i)).toBeInTheDocument();
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
