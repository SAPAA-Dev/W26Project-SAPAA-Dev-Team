import { render, waitFor } from '@testing-library/react';
import SignedOutGuard from '@/components/SignedOutGuard';

const getSession = jest.fn();
const unsubscribe = jest.fn();
const onAuthStateChange = jest.fn(() => ({ data: { subscription: { unsubscribe } } }));
jest.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { getSession, onAuthStateChange } }) }));

const pageShow = (persisted: boolean) =>
  window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted }));

describe('SignedOutGuard (5.0.4 AT2)', () => {
  beforeEach(() => getSession.mockReset());

  it('sends a signed-out user to /login when Back restores a cached page', async () => {
    window.history.pushState({}, '', '/sites');
    const redirect = jest.fn();
    getSession.mockResolvedValue({ data: { session: { user: {} } } });
    render(<SignedOutGuard redirect={redirect} />);
    await waitFor(() => expect(getSession).toHaveBeenCalledTimes(1));
    expect(redirect).not.toHaveBeenCalled();

    getSession.mockResolvedValue({ data: { session: null } });
    pageShow(true);
    await waitFor(() => expect(redirect).toHaveBeenCalledTimes(1));
  });

  it.each(['/login', '/forgot-password', '/reset-password'])(
    '5.0.2 AT4: does nothing on the public page %s',
    async (path) => {
      window.history.pushState({}, '', path);
      const redirect = jest.fn();
      getSession.mockResolvedValue({ data: { session: null } });
      render(<SignedOutGuard redirect={redirect} />);
      pageShow(true);
      await new Promise((r) => setTimeout(r, 0));
      expect(getSession).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    },
  );
});

it('clears the page after an account change but ignores refresh for the same account', async () => {
  window.history.pushState({}, '', '/v2/sites');
  getSession.mockResolvedValue({ data: { session: { user: { id: 'first' } } } });
  const redirect = jest.fn();
  const view = render(<SignedOutGuard redirect={redirect} />);
  await waitFor(() => expect(getSession).toHaveBeenCalled());
  await new Promise((resolve) => setTimeout(resolve, 0));
  const callback = (onAuthStateChange.mock.calls.at(-1) as unknown as [(event: string, session: unknown) => void])[0];
  callback('TOKEN_REFRESHED', { user: { id: 'first' } });
  callback('SIGNED_IN', { user: { id: 'first' } });
  expect(redirect).not.toHaveBeenCalled();
  callback('SIGNED_IN', { user: { id: 'second' } });
  expect(redirect).toHaveBeenCalledTimes(1);
  callback('SIGNED_OUT', null);
  expect(redirect).toHaveBeenCalledTimes(2);
  view.unmount();
  expect(unsubscribe).toHaveBeenCalled();
});

it('clears private memory when an account signs out from a public page', () => {
  window.history.pushState({}, '', '/login');
  const redirect = jest.fn();
  render(<SignedOutGuard redirect={redirect} />);
  const callback = (onAuthStateChange.mock.calls.at(-1) as unknown as [(event: string, session: unknown) => void])[0];
  callback('INITIAL_SESSION', { user: { id: 'first' } });
  callback('SIGNED_IN', { user: { id: 'first' } });
  expect(redirect).not.toHaveBeenCalled();
  callback('SIGNED_OUT', null);
  expect(redirect).toHaveBeenCalledTimes(1);
});

it('clears a restored page when another tab has changed the signed-in account', async () => {
  window.history.pushState({}, '', '/v2/reports');
  getSession.mockResolvedValue({ data: { session: { user: { id: 'first' } } } });
  const redirect = jest.fn();
  render(<SignedOutGuard redirect={redirect} />);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(redirect).not.toHaveBeenCalled();
  getSession.mockResolvedValue({ data: { session: { user: { id: 'second' } } } });
  pageShow(true);
  await waitFor(() => expect(redirect).toHaveBeenCalledTimes(1));
});
