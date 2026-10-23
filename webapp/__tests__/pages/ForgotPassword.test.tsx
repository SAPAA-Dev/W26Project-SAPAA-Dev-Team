import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '../../app/forgot-password/page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...properties }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...properties}>{children}</a>
  ),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => body };
}

// window.location is non-configurable in jsdom, so the href setter is reached
// through the jsdom impl object behind the Location wrapper.
function spyOnLocationHrefSetter() {
  const wrapper = window.location as unknown as Record<symbol, unknown>;
  const implSymbol = Object.getOwnPropertySymbols(wrapper).find((symbol) => String(symbol) === 'Symbol(impl)');
  const impl = wrapper[implSymbol as symbol] as object;
  return jest.spyOn(Object.getPrototypeOf(impl), 'href', 'set').mockImplementation(() => undefined);
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the email form and a link back to login', () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send verification code/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Login/i })).toHaveAttribute('href', '/login');
  });

  it('requests a code and moves to the code step', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sent: true, message: 'If an account exists, a code is on its way.' }));

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send verification code/i }));

    expect(await screen.findByLabelText(/Verification Code/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/auth/password-reset/request-code',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows the provider message for a Google or Microsoft account', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ providerRequired: 'google', error: 'This account signs in with Google.' }),
    );

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'g@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send verification code/i }));

    expect(await screen.findByText(/signs in with Google/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Verification Code/i)).not.toBeInTheDocument();
  });

  it('takes the user to the reset password page when the code is correct', async () => {
    const hrefSpy = spyOnLocationHrefSetter();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ sent: true }))
      .mockResolvedValueOnce(jsonResponse({ verified: true }));

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send verification code/i }));

    fireEvent.change(await screen.findByLabelText(/Verification Code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify code/i }));

    await waitFor(() => expect(hrefSpy).toHaveBeenCalledWith('/reset-password'));
    expect(screen.queryByText(/invalid or has expired/i)).not.toBeInTheDocument();
    hrefSpy.mockRestore();
  });

  it('shows an error when the code is rejected', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ sent: true }))
      .mockResolvedValueOnce(jsonResponse({ error: 'That code is invalid or has expired.' }, false));

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send verification code/i }));

    fireEvent.change(await screen.findByLabelText(/Verification Code/i), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify code/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
  });
});
