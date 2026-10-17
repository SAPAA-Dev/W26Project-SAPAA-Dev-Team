'use client';
/* eslint-disable @next/next/no-img-element -- signed storage URLs, not routed through next/image */

import { useDeferredValue, useMemo, useState } from 'react';
import { ImageOff, ImagePlus, Images } from 'lucide-react';
import type { Photo } from '@/lib/api/v1/types';
import { api } from '@/lib/api/v1/client';
import { useApi } from '@/app/v2/_lib/useApi';
import { monthLabel } from '@/app/v2/_components/flows/format';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SearchField,
  btn,
  chip,
  tabBarPadding,
  useEdgeFade,
  useUrlParam,
} from '@/app/v2/_components/flows/ui';
import { Lightbox } from './Lightbox';
import { AddPhotosSheet } from './AddPhotosSheet';

const GRID = 'grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:gap-3 lg:grid-cols-5';
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-CA')} ${n === 1 ? one : many}`;

export default function PhotosPage() {
  const photos = useApi('photos', api.photos);
  const sites = useApi('sites', api.sites);
  const me = useApi('me', api.me);
  const [q, setQ] = useUrlParam('q');
  const [site, setSite] = useUrlParam('site');
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const rail = useEdgeFade<HTMLDivElement>();

  const all = photos.data;
  /** Sites that have photos, with counts, A to Z: the filter chips. */
  const photoSites = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of all ?? []) if (p.siteName) counts.set(p.siteName, (counts.get(p.siteName) ?? 0) + 1);
    return [...counts].sort(([a], [b]) => a.localeCompare(b));
  }, [all]);

  // The search box shows each keystroke at once; filtering and redrawing the grid follow at lower priority.
  const shownQ = useDeferredValue(q);
  const list = useMemo(() => {
    const term = shownQ.trim().toLowerCase();
    return (all ?? [])
      .filter((p) => !site || p.siteName === site)
      .filter(
        (p) =>
          !term || [p.siteName, p.caption, p.identifier, p.photographer].some((s) => s?.toLowerCase().includes(term)),
      )
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  }, [all, shownQ, site]);

  /** Newest month first. `start` is each group's offset in `list`, which the lightbox pages through. */
  const months = useMemo(() => {
    const out: { key: string; start: number; items: Photo[] }[] = [];
    list.forEach((p, i) => {
      const key = p.date?.slice(0, 7) ?? 'none';
      if (out.at(-1)?.key !== key) out.push({ key, start: i, items: [] });
      out.at(-1)!.items.push(p);
    });
    return out;
  }, [list]);

  const clear = () => {
    setQ('');
    setSite('');
  };

  return (
    <>
      <PageHeader
        wide
        eyebrow={
          all
            ? `${plural(all.length, 'photo')} from ${plural(photoSites.length, 'site')}`
            : photos.error
              ? null
              : undefined
        }
        title="Photos"
        action={
          <button type="button" onClick={() => setAdding(true)} className={`${btn.onDark} min-h-11 px-4 text-[15px]`}>
            <ImagePlus size={18} aria-hidden />
            Add photos
          </button>
        }
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="md:w-96 md:shrink-0">
            <SearchField
              label="Search photos"
              placeholder="Caption, identifier or photographer"
              value={q}
              onChange={setQ}
            />
          </div>
          {photoSites.length > 1 && (
            <div
              role="group"
              aria-label="Site"
              {...rail}
              className="edge-fade -mx-4 min-w-0 overflow-x-auto overscroll-x-contain md:mx-0"
            >
              <div className="flex w-max gap-2 px-4 md:px-0">
                <button type="button" aria-pressed={!site} onClick={() => setSite('')} className={chip(!site)}>
                  All sites
                  <span className="num opacity-75">{all?.length}</span>
                </button>
                {photoSites.map(([name, n]) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={site === name}
                    onClick={() => setSite(site === name ? '' : name)}
                    className={chip(site === name)}
                  >
                    {name}
                    <span className="num opacity-75">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageHeader>

      <main className="mx-auto max-w-6xl px-4 pt-2 md:px-8" style={tabBarPadding}>
        {photos.error ? (
          <ErrorState title="Photos did not load" error={photos.error} onRetry={photos.refetch} />
        ) : !all ? (
          <div aria-busy="true" className="pt-9">
            <span className="sr-only" role="status">
              Loading photos
            </span>
            <div className={GRID}>
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-[var(--radius-s)] bg-[var(--bg-sunken)]" />
              ))}
            </div>
          </div>
        ) : list.length === 0 ? (
          q || site ? (
            <EmptyState
              icon={<Images size={22} />}
              title="No photos match"
              body="Try another word, or show every site."
            >
              <button type="button" onClick={clear} className={btn.secondary}>
                Clear filters
              </button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={<Images size={22} />}
              title="No photos yet"
              body="Photos from inspection reports and site visits appear here."
            >
              <button type="button" onClick={() => setAdding(true)} className={btn.primary}>
                <ImagePlus size={20} aria-hidden />
                Add photos
              </button>
            </EmptyState>
          )
        ) : (
          <>
            <p className="sr-only" role="status">
              {plural(list.length, 'photo')}
            </p>
            {months.map(({ key, start, items }) => (
              // Off-screen months skip layout and paint until scrolled near.
              <section
                key={key}
                aria-labelledby={`m-${key}`}
                className="mt-5 [contain-intrinsic-size:auto_480px] [content-visibility:auto] first-of-type:mt-1"
              >
                <div className="flex items-baseline justify-between py-2">
                  <h2 id={`m-${key}`} className="text-[15px] font-bold">
                    {key === 'none' ? 'No date' : monthLabel(key)}
                  </h2>
                  <span className="num text-[13px] text-[var(--ink-2)]">{plural(items.length, 'photo')}</span>
                </div>
                <ul className={GRID}>
                  {items.map((p, i) => (
                    <li key={`${p.kind}-${p.id}`}>
                      <Tile photo={p} onOpen={() => setOpen(start + i)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </main>

      <Lightbox photos={list} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      <AddPhotosSheet
        open={adding}
        onClose={() => setAdding(false)}
        siteNames={(sites.data ?? []).map((s) => s.name)}
        photographer={me.data?.person?.name ?? ''}
      />
    </>
  );
}

/** Fixed square box, so nothing shifts while images stream in. A link that 404s shows a quiet placeholder. */
function Tile({ photo: p, onOpen }: { photo: Photo; onOpen: () => void }) {
  const [broken, setBroken] = useState(false);
  const label = [p.identifier || p.caption || 'Photo', p.siteName].filter(Boolean).join(', ');
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`Open photo: ${label}`}
      // No overflow-hidden here: it would clip the .lift hover shadow. The image carries the rounding.
      className="lift block aspect-square w-full rounded-[var(--radius-s)] bg-[var(--bg-sunken)]"
    >
      {broken ? (
        <span className="grid size-full place-items-center text-[var(--ink-2)]">
          <ImageOff size={22} aria-hidden />
        </span>
      ) : (
        <img
          src={p.url}
          alt=""
          width={320}
          height={320}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="size-full rounded-[inherit] object-cover"
        />
      )}
    </button>
  );
}
