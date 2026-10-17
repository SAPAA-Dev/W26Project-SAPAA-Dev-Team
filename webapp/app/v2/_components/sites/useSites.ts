'use client';

import { api } from '@/lib/api/v1/client';
import { prefetch, useApi } from '../../_lib/useApi';

/** All sites plus the signed-in user. A failed /me is not fatal: the list still works without "Yours". */
export function useSites() {
  const sites = useApi('sites', api.sites);
  const me = useApi('me', api.me);
  return { sites: sites.data, me: me.data ?? null, meSettled: !me.loading, error: sites.error };
}

/**
 * Start a site page's reads (same keys as the page), so it opens with its data instead of skeletons.
 * Idle guesses skip the photo list (it only feeds a tab count); a hover or touch takes all three.
 */
export function prefetchSite(slug: string, { photos = true } = {}) {
  prefetch(`site:${slug}`, () => api.site(slug));
  prefetch(`site-reports:${slug}`, () => api.siteReports(slug));
  if (photos) prefetch(`site-photos:${slug}`, () => api.sitePhotos(slug));
}

/** Handlers for a link to a site page: hover, keyboard focus or a touch starts its reads before the tap lands. */
export function siteIntent(slug: string) {
  const go = () => prefetchSite(slug);
  return { onPointerEnter: go, onPointerDown: go, onFocus: go };
}

/** Run once the main thread is idle (setTimeout where requestIdleCallback is missing, e.g. Safari). */
export function whenIdle(fn: () => void, timeout = 2000) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 600);
  return () => window.clearTimeout(id);
}

/** Phones asking to save data (or with very little memory) skip speculative downloads. */
export function canSpeculate() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return !nav.connection?.saveData && (nav.deviceMemory ?? 4) > 2;
}
