'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSiteQuery } from '../_lib/siteQuery';
import SitesList, { SitesSkeleton } from '../_components/sites/SitesList';

// MapLibre touches window; load the map only when the user switches to it.
const SitesMap = dynamic(() => import('../_components/map/SitesMap'), { ssr: false });

/**
 * List or map comes from the URL, which a static build can't read on the server: that HTML paints the list's
 * skeleton (and, outside this boundary, the tab bar) instead of a blank screen until the page hydrates.
 */
export default function SitesPage() {
  return (
    <Suspense fallback={<SitesSkeleton />}>
      <Sites />
    </Suspense>
  );
}

function Sites() {
  const { query } = useSiteQuery();
  return query.mode === 'map' ? <SitesMap /> : <SitesList />;
}
