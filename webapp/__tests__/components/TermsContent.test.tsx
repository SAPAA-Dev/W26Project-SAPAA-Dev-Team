import { fireEvent, render, screen } from '@testing-library/react';
import TermsContent from '@/app/terms/TermsContent';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/terms',
}));
jest.mock('@/services/auth', () => ({ logout: jest.fn() }));
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }),
}));

describe('TermsContent', () => {
  it('has the user menu with sign-out in the header (5.0.4 AT3)', async () => {
    render(<TermsContent />);

    fireEvent.click(screen.getByTitle('Open menu'));
    expect(await screen.findByText('Logout')).toBeInTheDocument();
  });
});
