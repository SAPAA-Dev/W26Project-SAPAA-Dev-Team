'use client';

import { Suspense, useEffect } from 'react';
import { prefetch } from '../_lib/useApi';
import { api } from '@/lib/api/v1/client';
import { preloadMap } from '../_components/map/preload';
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
  useEffect(() => {
    if (query.mode !== 'map') return;
    preloadMap();
    prefetch('sites:map', () => api.sites({ includeInactive: true }));
    prefetch('me', api.me);
    prefetch('boundaries', api.boundaries);
    prefetch('tracks', api.tracks);
  }, [query.mode]);
  return query.mode === 'map' ? <SitesMap /> : <SitesList />;
}
