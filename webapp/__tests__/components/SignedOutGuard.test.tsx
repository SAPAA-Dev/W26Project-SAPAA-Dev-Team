import { render, waitFor } from '@testing-library/react';
import SignedOutGuard from '@/components/SignedOutGuard';

const getSession = jest.fn();
jest.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { getSession } }) }));

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

  it('does nothing on public pages', async () => {
    window.history.pushState({}, '', '/login');
    const redirect = jest.fn();
    getSession.mockResolvedValue({ data: { session: null } });
    render(<SignedOutGuard redirect={redirect} />);
    pageShow(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(getSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
