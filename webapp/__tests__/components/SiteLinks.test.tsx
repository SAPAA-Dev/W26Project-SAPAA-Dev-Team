import React from 'react';
import { render, screen } from '@testing-library/react';
import SiteLinks, { shortenUrl } from '../../components/SiteLinks';

describe('shortenUrl (US 2.0.10)', () => {
  it('removes the scheme and www (2.0.10 AT1)', () => {
    expect(shortenUrl('https://www.inaturalist.org/')).toBe('inaturalist.org');
  });

  it('shows an ellipsis when the URL has a path (2.0.10 AT1)', () => {
    expect(shortenUrl('https://sapaastewards.com/natural-areas/bilby')).toBe('sapaastewards.com/…');
  });

  it('returns the text unchanged when it is not a valid URL', () => {
    expect(shortenUrl('not a url')).toBe('not a url');
  });
});

describe('SiteLinks (US 2.0.10)', () => {
  const sapaaUrl = 'https://sapaastewards.com/natural-areas/bilby';
  const iNaturalistUrl = 'https://www.inaturalist.org/places/bilby';

  it('shows both links with short text (2.0.10 AT1, 2.0.10 AT2)', () => {
    render(<SiteLinks sapaaWebsiteUrl={sapaaUrl} iNaturalistUrl={iNaturalistUrl} />);

    expect(screen.getByRole('link', { name: 'sapaastewards.com/…' })).toHaveAttribute('href', sapaaUrl);
    expect(screen.getByRole('link', { name: 'inaturalist.org/…' })).toHaveAttribute('href', iNaturalistUrl);
  });

  it('opens each link in a new tab (2.0.10 AT3)', () => {
    render(<SiteLinks sapaaWebsiteUrl={sapaaUrl} iNaturalistUrl={iNaturalistUrl} />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('leaves out a link that is missing or hidden (2.0.5 AT4)', () => {
    render(<SiteLinks sapaaWebsiteUrl={null} iNaturalistUrl={iNaturalistUrl} />);

    expect(screen.queryByText(/SAPAA website/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders nothing when no link is shown', () => {
    const { container } = render(<SiteLinks sapaaWebsiteUrl={null} iNaturalistUrl={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
