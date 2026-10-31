import { render, screen } from '@testing-library/react';
import InspectionPage from '@/app/v2/sites/[slug]/inspect/page';
import { useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({ useParams: jest.fn() }));
jest.mock('react', () => ({ ...jest.requireActual('react'), useEffect: jest.fn() }));

it.each([
  ['Riverlot%2056%20(NA)', 'Riverlot%2056%20(NA)'],
  ['Riverlot 56 (NA)', 'Riverlot%2056%20(NA)'],
  ['Park%20%26%20Lake', 'Park%20%26%20Lake'],
  ['100% Park', '100%25%20Park'],
])('opens the main form for %s without changing the site name', (slug, segment) => {
  (useParams as jest.Mock).mockReturnValue({ slug });
  render(<InspectionPage />);
  expect(screen.getByRole('link', { name: 'Open inspection form' })).toHaveAttribute('href', `/detail/${segment}/new-report`);
});
