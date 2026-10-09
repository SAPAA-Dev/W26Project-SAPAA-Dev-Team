import React from 'react';
import { render, screen } from '@testing-library/react';
import SiteLinks, { shortenUrl } from '../../components/SiteLinks';

describe('shortenUrl', () => {
  it('removes the scheme and www', () => {
    expect(shortenUrl('https://www.inaturalist.org/')).toBe('inaturalist.org');
  });

  it('shows an ellipsis when the URL has a path', () => {
    expect(shortenUrl('https://sapaastewards.com/natural-areas/bilby')).toBe('sapaastewards.com/…');
  });

  it('returns the text unchanged when it is not a valid URL', () => {
    expect(shortenUrl('not a url')).toBe('not a url');
  });
});

describe('SiteLinks', () => {
  const sapaaUrl = 'https://sapaastewards.com/natural-areas/bilby';
  const iNaturalistUrl = 'https://www.inaturalist.org/places/bilby';

  it('shows both links with short text', () => {
    render(<SiteLinks sapaaWebsiteUrl={sapaaUrl} iNaturalistUrl={iNaturalistUrl} />);

    expect(screen.getByRole('link', { name: 'sapaastewards.com/…' })).toHaveAttribute('href', sapaaUrl);
    expect(screen.getByRole('link', { name: 'inaturalist.org/…' })).toHaveAttribute('href', iNaturalistUrl);
  });

  it('opens each link in a new tab', () => {
    render(<SiteLinks sapaaWebsiteUrl={sapaaUrl} iNaturalistUrl={iNaturalistUrl} />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('leaves out a link that is missing or hidden', () => {
    render(<SiteLinks sapaaWebsiteUrl={null} iNaturalistUrl={iNaturalistUrl} />);

    expect(screen.queryByText(/SAPAA website/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders nothing when no link is shown', () => {
    const { container } = render(<SiteLinks sapaaWebsiteUrl={null} iNaturalistUrl={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
