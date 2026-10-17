'use client';

import { useEffect, useState } from 'react';
import { freshReads } from '@/lib/api/v1/client';

// ponytail: tiny stale-while-revalidate cache keyed by string; swap for TanStack Query if the app outgrows it.
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();
/** Mounted hooks, so invalidate() can refresh what is on screen, not only the next read. */
const live = new Set<(prefix: string) => void>();

export function useApi<T>(key: string | null, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(() => (key ? (cache.get(key) as T | undefined) : undefined));
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key) return;
    let live = true;
    const p = inflight.get(key) ?? fetcher().finally(() => inflight.delete(key));
    inflight.set(key, p);
    p.then(
      (d) => {
        cache.set(key, d);
        if (live) setData(d as T);
      },
      (e) => live && setError(e),
    );
    return () => {
      live = false;
    };
    // fetcher is recreated each render; the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  useEffect(() => {
    if (!key) return;
    const revalidate = (prefix: string) => {
      if (!key.startsWith(prefix)) return;
      setError(null);
      setAttempt((n) => n + 1); // keeps the current data on screen until the new read lands
    };
    live.add(revalidate);
    return () => {
      live.delete(revalidate);
    };
  }, [key]);

  /** Re-run the request (error retry, pull to refresh). */
  const refetch = () => {
    freshReads();
    if (key) cache.delete(key);
    setError(null);
    setAttempt((n) => n + 1);
  };

  return { data, error, loading: !data && !error, refetch };
}

/** Drop cached entries (e.g. after submitting a report) and refetch the ones on screen. */
export function invalidate(prefix: string) {
  freshReads(); // and past the browser's HTTP cache, which still holds the old answers
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
  for (const revalidate of live) revalidate(prefix);
}

/**
 * Start a read before any screen asks for it (tap intent, idle warm-up). A screen that mounts later paints
 * from the cache or joins the request in flight. Failures are left for that screen to retry and show.
 */
export function prefetch<T>(key: string, fetcher: () => Promise<T>) {
  if (cache.has(key) || inflight.has(key)) return;
  const p = fetcher().finally(() => inflight.delete(key));
  inflight.set(key, p);
  p.then((d) => cache.set(key, d), () => {});
}
