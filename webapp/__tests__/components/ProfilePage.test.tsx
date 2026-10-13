import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProfilePage from '@/components/ProfilePage';
import { getSitesForSteward } from '@/utils/steward-actions';

jest.mock('@/utils/steward-actions', () => ({ getSitesForSteward: jest.fn() }));
const getSitesForStewardMock = getSitesForSteward as jest.Mock;

const routerMock = { back: jest.fn(), push: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => routerMock, usePathname: () => '/profile' }));
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }),
}));

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
  history: [{ id: 7, siteId: 5, siteName: 'Beaver Hills', siteArchived: false, siteInactive: false, inspectionDate: '2026-09-12' }],
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

  it('lists the sites this person is steward of, linked to each site page (3.0.2 AT3)', async () => {
    getSitesForStewardMock.mockResolvedValue([{ siteId: 5, namesite: 'Beaver Hills', isActive: true }]);
    render(<ProfilePage personId="42" />);

    const section = await screen.findByTestId('stewarded-sites');
    expect(getSitesForStewardMock).toHaveBeenCalledWith(42);
    expect(section).toHaveTextContent('Steward of');
    expect(within(section).getByRole('link', { name: 'Beaver Hills' })).toHaveAttribute('href', '/detail/Beaver%20Hills');
  });

  it('US 2.0.3: shows a deactivated stewarded site as plain text with an Inactive badge (M25)', async () => {
    getSitesForStewardMock.mockResolvedValue([{ siteId: 6, namesite: 'Elk Island', isActive: false }]);
    render(<ProfilePage personId="42" />);

    const section = await screen.findByTestId('stewarded-sites');
    expect(within(section).queryByRole('link')).not.toBeInTheDocument();
    expect(within(section).getByTestId('stewarded-site-inactive-6')).toHaveTextContent('Elk IslandInactive');
  });

  it('hides the steward section when the person looks after no sites (3.0.2 AT3)', async () => {
    render(<ProfilePage />);

    await screen.findByRole('heading', { name: 'Jamie Rivera' });
    await waitFor(() => expect(getSitesForStewardMock).toHaveBeenCalled());
    expect(screen.queryByTestId('stewarded-sites')).not.toBeInTheDocument();
  });

  // 1.0.1 AT4: a profile opened from a site page goes back to that page.
  it('goes back to the previous page (1.0.1 AT4)', async () => {
    window.history.pushState({}, '', '/detail/Beaver%20Hills');
    render(<ProfilePage personId="42" />);

    fireEvent.click(await screen.findByRole('button', { name: '← Back' }));
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('lists reports of archived sites as plain text with an Archived badge, not links', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...profilePayload,
        history: [
          { id: 7, siteId: 5, siteName: 'Beaver Hills', siteArchived: false, siteInactive: false, inspectionDate: '2026-09-12' },
          { id: 8, siteId: 6, siteName: 'Duck Lake', siteArchived: true, siteInactive: false, inspectionDate: '2026-09-01' },
          { id: 10, siteId: 7, siteName: 'Elk Island', siteArchived: false, siteInactive: true, inspectionDate: '2026-08-15' },
          { id: 9, siteId: null, siteName: 'Unknown site', siteArchived: false, siteInactive: false, inspectionDate: '2026-08-01' },
        ],
      }),
    });
    render(<ProfilePage />);

    // An active site stays a link to the site page.
    expect(await screen.findByRole('link', { name: 'Beaver Hills' })).toHaveAttribute('href', '/detail/Beaver%20Hills');
    // An archived site is plain text with a badge.
    expect(screen.queryByRole('link', { name: 'Duck Lake' })).not.toBeInTheDocument();
    expect(screen.getByText('Duck Lake')).toBeInTheDocument();
    expect(screen.getByTestId('archived-site-badge-8')).toHaveTextContent('Archived');
    // US 2.0.3 (M25): a deactivated site's page shows an error, so it is plain text with a badge.
    expect(screen.queryByRole('link', { name: /Elk Island/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('inactive-site-badge-10')).toHaveTextContent('Inactive');
    // A permanently deleted site stays plain text.
    expect(screen.queryByRole('link', { name: 'Unknown site' })).not.toBeInTheDocument();
    expect(screen.getByText('Unknown site')).toBeInTheDocument();
  });

  it('shows profile data and derived inspection summaries (1.0.1 AT1)', async () => {
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

  it('hides the contact section when nothing is filled in (1.0.1 AT1)', async () => {
    render(<ProfilePage />);
    await screen.findByRole('heading', { name: 'Jamie Rivera' });
    expect(screen.queryByTestId('profile-contact')).not.toBeInTheDocument();
  });

  it('shows skills and focus areas without opening the edit form (1.0.1 AT1)', async () => {
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

  it('shows the local day for a report that only has a created_at timestamp', async () => {
    const previousZone = process.env.TZ;
    process.env.TZ = 'America/Edmonton';
    fetchMock.mockResolvedValue({
      ok: true,
      // 03:30 UTC on Sep 12 is 21:30 on Sep 11 in Alberta.
      json: async () => ({ ...profilePayload, history: [{ ...profilePayload.history[0], inspectionDate: '2026-09-12T03:30:00+00:00' }] }),
    });
    try {
      render(<ProfilePage />);

      expect(await screen.findByText('Sep 11, 2026')).toBeInTheDocument();
      expect(screen.queryByText('Sep 12, 2026')).not.toBeInTheDocument();
    } finally {
      process.env.TZ = previousZone;
    }
  });

  describe('inspection history paging', () => {
    const historyPage = (page: number, ids: number[]) => ({
      ...profilePayload,
      history: ids.map((id) => ({ ...profilePayload.history[0], id, siteName: `Site ${id}` })),
      pagination: { page, pageSize: 10, total: 12 },
    });

    it('hides the paging controls when every report fits on one page', async () => {
      render(<ProfilePage />);
      await screen.findByRole('heading', { name: 'Jamie Rivera' });
      expect(screen.queryByRole('navigation', { name: 'Inspection history pages' })).not.toBeInTheDocument();
    });

    it('loads the next page from the API and disables the button at each end', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => historyPage(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) })
        .mockResolvedValueOnce({ ok: true, json: async () => historyPage(2, [11, 12]) });
      render(<ProfilePage personId="42" />);

      const previous = await screen.findByRole('button', { name: 'Previous page of inspection history' });
      expect(previous).toBeDisabled();
      expect(screen.getByText('Showing 1–10 of 12 reports.')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Next page of inspection history' }));

      expect(await screen.findByText('Site 11')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenLastCalledWith('/api/profile?personId=42&page=2');
      expect(screen.queryByText('Site 1')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 11–12 of 12 reports.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page of inspection history' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Previous page of inspection history' })).toBeEnabled();
    });

    it('keeps the current page and shows an error when the next page fails', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => historyPage(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) })
        .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Unable to load inspection history.' }) });
      render(<ProfilePage />);

      fireEvent.click(await screen.findByRole('button', { name: 'Next page of inspection history' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load inspection history.');
      expect(screen.getByText('Site 1')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Jamie Rivera' })).toBeInTheDocument();
    });
  });

  it.each(['', '   '])('blocks saving when the name is %j (1.0.2 AT3)', async (name) => {
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    const input = screen.getByLabelText('Display name');
    fireEvent.change(input, { target: { value: name } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(input).toBeInvalid();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('blocks saving when the email is blank and marks the field (1.0.2 AT3)', async () => {
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    const email = screen.getByLabelText('Email');
    fireEvent.change(email, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(email).toBeRequired();
    expect(email).toBeInvalid();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lets an owner update only profile fields (1.0.2 AT1)', async () => {
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
  it('keeps the form and the typed edits when the server refuses a save (1.0.2 AT4)', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => profilePayload })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Skills entries must be between 1 and 40 characters.' }) });
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Jamie R.' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jamie@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Skills entries must be between 1 and 40 characters.');
    expect(screen.queryByText('Profile unavailable')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toHaveValue('Jamie R.');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('shows the stored name when only the contact details fail to save (1.0.2 AT4)', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => profilePayload })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Your contact details were not saved.', profile: { ...profilePayload.profile, displayName: 'Jamie R.' } }),
      });
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Jamie R.' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jamie@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your contact details were not saved.');
    expect(screen.getByRole('heading', { name: 'Jamie R.' })).toBeInTheDocument();
  });

  it('shows the saved values again after a reload (1.0.1 AT5, 1.0.2 AT4, 1.0.2 AT6)', async () => {
    const stored = {
      ...profilePayload.profile,
      displayName: 'Jamie R.',
      skills: ['Bird ID', 'Mosses'],
      focusAreas: ['Wetlands', 'Grasslands'],
    };
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => profilePayload })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ profile: stored }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...profilePayload, profile: stored }) });
    const { unmount } = render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Jamie R.' } });
    fireEvent.change(screen.getByLabelText(/^Skills/), { target: { value: 'Bird ID, Mosses' } });
    fireEvent.change(screen.getByLabelText(/^Focus areas/), { target: { value: 'Wetlands, Grasslands' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jamie@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.skills).toEqual(['Bird ID', 'Mosses']);
    expect(body.focusAreas).toEqual(['Wetlands', 'Grasslands']);

    // A reload mounts the page again, and it reads the profile from the server.
    unmount();
    render(<ProfilePage />);

    expect(await screen.findByRole('heading', { name: 'Jamie R.' })).toBeInTheDocument();
    expect(screen.getByText('Mosses')).toBeInTheDocument();
    expect(screen.getByText('Grasslands')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/profile');
  });

  it('has the user menu with sign-out in the header (5.0.4 AT3)', async () => {
    render(<ProfilePage />);
    fireEvent.click(await screen.findByTitle('Open menu'));
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
