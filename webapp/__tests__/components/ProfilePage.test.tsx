import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProfilePage from '@/components/ProfilePage';
import { getSitesForSteward } from '@/utils/steward-actions';

jest.mock('@/utils/steward-actions', () => ({ getSitesForSteward: jest.fn() }));
const getSitesForStewardMock = getSitesForSteward as jest.Mock;

const routerMock = { back: jest.fn(), push: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => routerMock }));

const profilePayload = {
  profile: {
    id: 42,
    displayName: 'Jamie Rivera',
    skills: ['Bird ID'],
    focusAreas: ['Wetlands'],
    role: 'Steward',
  },
  isOwner: true,
  stats: { inspectionCount: 3, distinctSiteCount: 2 },
  history: [{ id: 7, siteId: 5, siteName: 'Beaver Hills', inspectionDate: '2026-09-12' }],
  pagination: { page: 1, pageSize: 10, total: 3 },
};

describe('ProfilePage', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => profilePayload });
    global.fetch = fetchMock;
    getSitesForStewardMock.mockReset();
    getSitesForStewardMock.mockResolvedValue([]);
    routerMock.back.mockReset();
    routerMock.push.mockReset();
  });

  it('lists the sites this person is steward of, linked to each site page', async () => {
    getSitesForStewardMock.mockResolvedValue([{ siteId: 5, namesite: 'Beaver Hills' }]);
    render(<ProfilePage personId="42" />);

    const section = await screen.findByTestId('stewarded-sites');
    expect(getSitesForStewardMock).toHaveBeenCalledWith(42);
    expect(section).toHaveTextContent('Steward of');
    expect(within(section).getByRole('link', { name: 'Beaver Hills' })).toHaveAttribute('href', '/detail/Beaver%20Hills');
  });

  it('hides the steward section when the person looks after no sites', async () => {
    render(<ProfilePage />);

    await screen.findByRole('heading', { name: 'Jamie Rivera' });
    await waitFor(() => expect(getSitesForStewardMock).toHaveBeenCalled());
    expect(screen.queryByTestId('stewarded-sites')).not.toBeInTheDocument();
  });

  // 1.0.1 AT4: a profile opened from a site page goes back to that page.
  it('goes back to the previous page', async () => {
    window.history.pushState({}, '', '/detail/Beaver%20Hills');
    render(<ProfilePage personId="42" />);

    fireEvent.click(await screen.findByRole('button', { name: '← Back' }));
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('shows profile data and derived inspection summaries', async () => {
    render(<ProfilePage />);

    expect(await screen.findByRole('heading', { name: 'Jamie Rivera' })).toBeInTheDocument();
    expect(screen.getByText('Inspection reports submitted')).toBeInTheDocument();
    expect(screen.getByText('Distinct sites inspected')).toBeInTheDocument();
    expect(screen.getByText('Beaver Hills')).toBeInTheDocument();
    expect(screen.getByText('Web inspection records only.')).toBeInTheDocument();
  });

  it('shows only the contact details the person filled in (1.0.1 AT1)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...profilePayload,
        profile: { ...profilePayload.profile, socials: { email: 'jamie@example.com', phone: null, website: null, instagram: 'https://instagram.com/jamie', facebook: null, x: null, linkedin: null } },
      }),
    });
    render(<ProfilePage />);

    const contact = await screen.findByTestId('profile-contact');
    expect(within(contact).getByRole('link', { name: 'jamie@example.com' })).toHaveAttribute('href', 'mailto:jamie@example.com');
    const instagram = within(contact).getByRole('link', { name: 'https://instagram.com/jamie' });
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(contact).queryByText(/Phone/)).not.toBeInTheDocument();
  });

  it('hides the contact section when nothing is filled in', async () => {
    render(<ProfilePage />);
    await screen.findByRole('heading', { name: 'Jamie Rivera' });
    expect(screen.queryByTestId('profile-contact')).not.toBeInTheDocument();
  });

  it('shows skills and focus areas without opening the edit form', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Focus areas')).toBeInTheDocument();
    expect(screen.getByText('Bird ID')).toBeInTheDocument();
    expect(screen.getByText('Wetlands')).toBeInTheDocument();
  });

  it('does not show a date one day early in Alberta', async () => {
    const previousZone = process.env.TZ;
    process.env.TZ = 'America/Edmonton';
    try {
      render(<ProfilePage />);

      expect(await screen.findByText('Sep 12, 2026')).toBeInTheDocument();
      expect(screen.queryByText('Sep 11, 2026')).not.toBeInTheDocument();
    } finally {
      process.env.TZ = previousZone;
    }
  });

  it.each(['', '   '])('blocks saving when the name is %j', async (name) => {
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    const input = screen.getByLabelText('Display name');
    fireEvent.change(input, { target: { value: name } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(input).toBeInvalid();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lets an owner update only profile fields', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => profilePayload })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ profile: { ...profilePayload.profile, displayName: 'Jamie R.' } }) });
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Jamie R.' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jamie@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/profile', expect.objectContaining({ method: 'PATCH' })));
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({
      displayName: 'Jamie R.',
      skills: ['Bird ID'],
      focusAreas: ['Wetlands'],
      socials: { email: 'jamie@example.com', phone: '', website: '', instagram: '', facebook: '', x: '', linkedin: '' },
    });
    expect(body).not.toHaveProperty('role');
  });
});
