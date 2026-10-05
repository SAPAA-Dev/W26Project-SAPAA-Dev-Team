import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '@/components/ProfilePage';

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
  });

  it('shows profile data and derived inspection summaries', async () => {
    render(<ProfilePage />);

    expect(await screen.findByRole('heading', { name: 'Jamie Rivera' })).toBeInTheDocument();
    expect(screen.getByText('Inspection reports submitted')).toBeInTheDocument();
    expect(screen.getByText('Distinct sites inspected')).toBeInTheDocument();
    expect(screen.getByText('Beaver Hills')).toBeInTheDocument();
    expect(screen.getByText('Web inspection records only.')).toBeInTheDocument();
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

  it('lets an owner update only profile fields', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => profilePayload })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ profile: { ...profilePayload.profile, displayName: 'Jamie R.' } }) });
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Jamie R.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/profile', expect.objectContaining({ method: 'PATCH' })));
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body).toEqual({ displayName: 'Jamie R.', skills: ['Bird ID'], focusAreas: ['Wetlands'] });
    expect(body).not.toHaveProperty('role');
  });
});
