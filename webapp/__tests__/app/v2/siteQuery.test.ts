import { applySiteQuery } from '@/app/v2/_lib/siteQuery';
import { BASE_QUERY } from '@/app/v2/_components/sites/ui';
import type { SiteSummary } from '@/lib/api/v1/types';

jest.mock('next/navigation', () => ({ usePathname: jest.fn(), useSearchParams: jest.fn() }));

const site = (id: number, center: SiteSummary['center']) =>
  ({ id, slug: `s${id}`, name: `S${id}`, county: null, status: 'recent', daysSince: 1, center }) as SiteSummary;

describe('applySiteQuery boundary filter (admin sites list)', () => {
  const sites = [site(1, [-113, 53]), site(2, null)];
  const ids = (boundary?: 'with' | 'without') =>
    applySiteQuery(sites, { ...BASE_QUERY, boundary }, null).map((s) => s.id);

  it('shows every site without the filter', () => expect(ids()).toEqual([1, 2]));
  it('keeps only sites with a boundary', () => expect(ids('with')).toEqual([1]));
  it('keeps only sites without a boundary', () => expect(ids('without')).toEqual([2]));
});
