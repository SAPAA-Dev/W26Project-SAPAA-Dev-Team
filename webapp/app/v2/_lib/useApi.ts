'use client';

import { useEffect, useState } from 'react';
import { freshReads } from '@/lib/api/v1/client';

const FRESH_MS = 30_000;
const cache = new Map<string, { data: unknown; savedAt: number }>();
const generations = new Map<string, number>();
const inflight = new Map<string, { promise: Promise<unknown>; generation: number }>();
const live = new Set<(prefix: string) => void>();

function read<T>(key: string, fetcher: () => Promise<T>) {
  const generation = generations.get(key) ?? 0;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.savedAt < FRESH_MS) {
    return { promise: Promise.resolve(cached.data), generation };
  }
  const existing = inflight.get(key);
  if (existing) return existing;
  const pending = { promise: fetcher() as Promise<unknown>, generation };
  pending.promise = pending.promise.then((data) => {
    if ((generations.get(key) ?? 0) === generation) cache.set(key, { data, savedAt: Date.now() });
    return data;
  }).finally(() => {
    if (inflight.get(key) === pending) inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}

export function useApi<T>(key: string | null, fetcher: () => Promise<T>) {
  const [entry, setEntry] = useState(() => ({ key, data: key ? cache.get(key)?.data as T | undefined : undefined }));
  const [failure, setFailure] = useState<{ key: string | null; error: Error | null }>({ key, error: null });
  const data = entry.key === key ? entry.data : key ? cache.get(key)?.data as T | undefined : undefined;
  const error = failure.key === key ? failure.error : null;
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key) return;
    let active = true;
    const pending = read(key, fetcher);
    const current = () => active && (generations.get(key) ?? 0) === pending.generation;
    pending.promise.then(
      (value) => {
        if (!current()) return;
        setEntry({ key, data: value as T });
        setFailure({ key, error: null });
      },
      (error) => { if (current()) setFailure({ key, error }); },
    );
    return () => { active = false; };
    // The key identifies the request; fetcher is recreated on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  useEffect(() => {
    if (!key) return;
    const revalidate = (prefix: string) => {
      if (!key.startsWith(prefix)) return;
      setFailure({ key, error: null });
      setAttempt((number) => number + 1);
    };
    live.add(revalidate);
    return () => { live.delete(revalidate); };
  }, [key]);

  return { data, error, loading: !data && !error, refetch: () => { if (key) invalidate(key); } };
}

export function invalidate(prefix: string) {
  freshReads();
  for (const key of new Set([...cache.keys(), ...inflight.keys()])) {
    if (!key.startsWith(prefix)) continue;
    generations.set(key, (generations.get(key) ?? 0) + 1);
    cache.delete(key);
    inflight.delete(key);
  }
  for (const revalidate of live) revalidate(prefix);
}

export function prefetch<T>(key: string, fetcher: () => Promise<T>) {
  void read(key, fetcher).promise.catch(() => {});
}
