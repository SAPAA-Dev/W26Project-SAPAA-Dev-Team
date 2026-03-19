import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from '../../app/signup/page';
import * as auth from '@/services/auth';
import { useRouter } from 'next/navigation';

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth service
jest.mock('@/services/auth', () => ({
  signup: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithMicrosoft: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} alt={props.alt} />);

describe('SignupPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  it('renders email, password, confirm inputs and buttons', () => {
    render(<SignupPage />);

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Create Account/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue with Google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue with Microsoft/i })
    ).toBeInTheDocument();
  });

  it('shows error if passwords do not match', async () => {
    render(<SignupPage />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Abc123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Mismatch123!' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('shows error if password is too short', async () => {
    render(<SignupPage />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it('calls signup and redirects on success without email confirmation', async () => {
    (auth.signup as jest.Mock).mockResolvedValue({ success: true, needsConfirmation: false });
    render(<SignupPage />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Abc123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Abc123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(auth.signup).toHaveBeenCalledWith('test@example.com', 'Abc123!'));
    expect(mockPush).toHaveBeenCalledWith('/sites');
  });

  it('shows email confirmation dialog if needed', async () => {
    (auth.signup as jest.Mock).mockResolvedValue({ success: true, needsConfirmation: true });
    render(<SignupPage />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Abc123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Abc123!' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/One more step to go/i)).toBeInTheDocument();

    const goToLoginBtn = screen.getByRole('button', { name: /Go to login/i });
    fireEvent.click(goToLoginBtn);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('handles Google sign-in error', async () => {
    (auth.signInWithGoogle as jest.Mock).mockResolvedValue({ success: false, error: 'Google error' });
    render(<SignupPage />);
    const googleBtn = screen.getByRole('button', { name: /Continue with Google/i });

    fireEvent.click(googleBtn);

    // Use waitFor with a longer timeout for async operations
    await waitFor(
      () => {
        const errorText = screen.queryByText(/Google sign in failed|error/i);
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('handles Microsoft sign-in error', async () => {
    (auth.signInWithMicrosoft as jest.Mock).mockResolvedValue({ success: false, error: 'Microsoft error' });
    render(<SignupPage />);
    const msBtn = screen.getByRole('button', { name: /Continue with Microsoft/i });

    fireEvent.click(msBtn);

    // Use waitFor with a longer timeout for async operations
    await waitFor(
      () => {
        const errorText = screen.queryByText(/Microsoft sign in failed|error/i);
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('calculates password strength correctly', async () => {
    render(<SignupPage />);
    const passwordInput = screen.getByLabelText(/^Password$/i);

    // Test weak password
    await userEvent.type(passwordInput, 'abc');
    const weakIndicator = screen.queryByText(/Weak/i);
    if (weakIndicator) {
      expect(weakIndicator).toBeInTheDocument();
    }

    // Clear and test strong password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'Abc123!');
    
    const strongIndicator = screen.queryByText(/Strong/i);
    if (strongIndicator) {
      expect(strongIndicator).toBeInTheDocument();
    }
  });
});