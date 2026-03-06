import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../app/login/page';
import * as auth from '@/services/auth';
import { useRouter } from 'next/navigation';

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth service
jest.mock('@/services/auth', () => ({
  login: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithMicrosoft: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

describe('LoginPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  it('renders email, password inputs and sign in buttons', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Microsoft/i })).toBeInTheDocument();
  });

  it('shows error on failed login', async () => {
    (auth.login as jest.Mock).mockResolvedValue({ success: false, error: 'Invalid credentials' });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  it('redirects to /sites on successful login', async () => {
    (auth.login as jest.Mock).mockResolvedValue({ success: true });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Abc123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/sites'));
  });

  it('handles Google sign-in error', async () => {
    (auth.signInWithGoogle as jest.Mock).mockResolvedValue({ success: false, error: 'Google sign in failed' });

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(await screen.findByText(/Google sign in failed/i)).toBeInTheDocument();
  });

  it('handles Microsoft sign-in error', async () => {
    (auth.signInWithMicrosoft as jest.Mock).mockResolvedValue({ success: false, error: 'Microsoft sign in failed' });

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Continue with Microsoft/i }));

    expect(await screen.findByText(/Microsoft sign in failed/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/Password/i);
    const toggleBtn = passwordInput.nextSibling as HTMLElement;

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('disables buttons when busy', async () => {
    (auth.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<LoginPage />);
    const signInBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Abc123!' } });
    fireEvent.click(signInBtn);

    expect(signInBtn).toBeDisabled();
  });

  it('submits form on Enter key press', async () => {
    (auth.login as jest.Mock).mockResolvedValue({ success: true });

    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Abc123!' } });
    fireEvent.keyPress(passwordInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/sites'));
  });
});
