'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import {
  ArrowLeft,
  ArrowUpRight,
  Binoculars,
  ChevronRight,
  ClipboardPen,
  Globe,
  Images,
  MapPinned,
  Navigation,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api/v1/client';
import type { SiteSummary } from '@/lib/api/v1/types';
import { useApi } from '../../_lib/useApi';
import MotionProvider from '../../_lib/MotionProvider';
import { STATUS_COLOR, STATUS_LABEL } from '../../_lib/siteQuery';
import PhotoHero from '../../_components/sites/PhotoHero';
import QuickActions from '../../_components/sites/QuickActions';
import { HEADING, sinceVisit, siteHref, TNUM } from '../../_components/sites/ui';
import { MetaLine } from '../../_components/sites/SiteRow';
import { NaturalBar, naturalLabel } from '../../_components/site/Naturalness';
import { ByQuestion, ReportTimeline, Retry, SkeletonCards } from '../../_components/site/Reports';
import PhotoGrid from '../../_components/site/PhotoGrid';
import SapaaAbout from '../../_components/site/SapaaAbout';
import { AdminSiteTools } from '../../_components/admin/lazy';

type Tab = 'reports' | 'questions' | 'photos';
const TABS: { key: Tab; label: string }[] = [
  { key: 'reports', label: 'Reports' },
  { key: 'questions', label: 'By question' },
  { key: 'photos', label: 'Photos' },
];

/** Leading icon per site link; anything new gets the globe. */
const LINK_ICON: Record<string, LucideIcon> = { inaturalist: Binoculars };
const ROW = 'press flex min-h-14 items-center gap-3 px-4 text-[15px] [--press-scale:0.99] hover:bg-[var(--bg)]';

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export default function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decode(use(params).slug);
  return (
    <MotionProvider>
      <SiteView key={slug} slug={slug} />
    </MotionProvider>
  );
}

function SiteView({ slug }: { slug: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const site = useApi(`site:${slug}`, () => api.site(slug));
  // The list already has the summary: the header renders instantly while the detail loads.
  const summary = useApi('sites', api.sites).data?.find((s) => s.slug === slug);
  const reports = useApi(`site-reports:${slug}`, () => api.siteReports(slug));
  const photos = useApi(`site-photos:${slug}`, () => api.sitePhotos(slug));
  const [tab, setTab] = useState<Tab>('reports');

  const s: SiteSummary | undefined = site.data ?? summary;
  const notFound = site.error instanceof ApiError && site.error.status === 404;
  const inspectHref = `${siteHref(slug)}/inspect`;
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  // Back keeps the list's search and filters (they live in its URL); a cold deep link falls back to /v2/sites.
  const back = (e: React.MouseEvent) => {
    if (window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  if (notFound)
    return (
      <main className="mx-auto max-w-md px-5 pt-24 pb-32 text-center">
        <h1 style={HEADING} className="text-2xl font-bold">
          We couldn’t find that site.
        </h1>
        <p className="mt-2 text-[var(--ink-2)]">It may have been renamed or removed.</p>
        <Link
          href="/v2/sites"
          className="press mt-6 inline-flex h-12 items-center rounded-full bg-[var(--forest)] px-6 font-bold text-[var(--birch)]"
        >
          Back to all sites
        </Link>
      </main>
    );

  const center = s?.center;
  const [since, sinceLabel] = sinceVisit(s?.daysSince ?? null);

  return (
    <main className="pb-[calc(var(--nav-clear)+96px)] md:pb-[calc(var(--nav-clear)+40px)]">
      <PhotoHero className="pb-16">
        <div className="hero-drift mx-auto max-w-3xl px-5 pt-[max(12px,env(safe-area-inset-top))] md:px-8">
          <Link
            href="/v2/sites"
            onClick={back}
            aria-label="Back to sites"
            className="press -ml-1 grid size-11 place-items-center rounded-full bg-[rgba(18,42,28,0.55)] text-[var(--birch)] hover:bg-[var(--forest)]"
          >
            <ArrowLeft size={22} aria-hidden />
          </Link>
          <AdminSiteTools slug={slug} site={s} />

          {s ? (
            <div className="mt-14 md:mt-20">
              <p className="eyebrow">{s.areaType ?? 'Protected area'}</p>
              <h1
                style={HEADING}
                className="mt-2 text-[32px] leading-[1.05] font-bold tracking-[-0.01em] text-[var(--birch)] [font-stretch:87.5%] md:text-5xl"
              >
                {s.name}
              </h1>
              <MetaLine
                parts={[s.county ?? 'County unknown', s.hectares ? `${s.hectares.toLocaleString('en-CA')} ha` : null]}
                className={`mt-1.5 text-[15px] text-[var(--sage)] ${TNUM}`}
              />
            </div>
          ) : (
            <div aria-hidden className="mt-14 flex flex-col gap-3 md:mt-20">
              <span className="h-3 w-24 animate-pulse rounded bg-white/20" />
              <span className="h-9 w-3/4 animate-pulse rounded-lg bg-white/20" />
              <span className="h-4 w-1/3 animate-pulse rounded bg-white/15" />
            </div>
          )}

          {site.error && !s ? (
            <div role="alert" className="mt-6 text-[var(--birch)]">
              <p className="font-bold">This site didn’t load.</p>
              <button
                type="button"
                onClick={site.refetch}
                className="press mt-3 h-11 rounded-full bg-[var(--honey)] px-5 font-bold text-[var(--canopy)]"
              >
                Try again
              </button>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-[1.25fr_1fr_0.75fr] gap-3 border-t border-[rgba(169,191,163,0.25)] pt-4 text-[var(--birch)]">
              <li>
                <p
                  className={`text-[34px] leading-none font-bold tracking-[-0.02em] [font-stretch:87.5%] ${TNUM}`}
                  style={{ color: s ? STATUS_COLOR[s.status] : undefined }}
                >
                  {s ? since : ' '}
                </p>
                <p className="mt-1.5 text-[13px] text-[var(--sage)]">{s ? sinceLabel : ' '}</p>
                {s && (
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: STATUS_COLOR[s.status] }}>
                    <span aria-hidden className="size-2 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                    {STATUS_LABEL[s.status]}
                  </p>
                )}
              </li>
              <li>
                <p className="flex h-[34px] items-center">
                  <NaturalBar score={s?.avgNaturalness ?? null} tone="dark" />
                </p>
                <p className="mt-1.5 text-[13px] text-[var(--sage)]">{s ? 'naturalness' : ' '}</p>
                <p className="mt-1 text-[13px] font-semibold">{s ? naturalLabel(s.avgNaturalness) : ' '}</p>
              </li>
              <li>
                <p className={`text-[34px] leading-none font-bold tracking-[-0.02em] [font-stretch:87.5%] ${TNUM}`}>
                  {s ? s.reportCount : ' '}
                </p>
                <p className="mt-1.5 text-[13px] text-[var(--sage)]">{!s ? ' ' : s.reportCount === 1 ? 'report' : 'reports'}</p>
              </li>
            </ul>
          )}

          <Link
            href={inspectHref}
            className="press mt-6 hidden h-12 items-center gap-2 rounded-full bg-[var(--honey)] px-6 text-base font-bold text-[var(--canopy)] md:inline-flex"
          >
            <ClipboardPen size={20} aria-hidden />
            Start inspection
          </Link>
        </div>
      </PhotoHero>

      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <div className="relative z-10 -mt-12">
          <QuickActions
            label="Site actions"
            // Start inspection already has its own button on every breakpoint, so no tile repeats it.
            items={[
              {
                label: 'Photos',
                icon: Images,
                onClick: () => {
                  setTab('photos');
                  scrollTo('site-history');
                },
              },
              {
                label: 'Map',
                icon: MapPinned,
                href: `/v2/sites?${new URLSearchParams({ mode: 'map', sel: slug })}`,
              },
              {
                label: 'Directions',
                icon: Navigation,
                href: center ? `https://www.google.com/maps/dir/?api=1&destination=${center[1]},${center[0]}` : undefined,
                external: true,
                disabled: !center,
              },
            ]}
          />
        </div>

        <ul className="mt-4 divide-y divide-[var(--line)] rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)]">
          <li>
            {s?.steward ? (
              <Link href={`/v2/me?person=${s.steward.id}`} className={`${ROW} rounded-t-[inherit]`}>
                <UserRound size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                <span className="flex-1">
                  Steward: <span className="font-bold">{s.steward.name}</span>
                </span>
                <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
              </Link>
            ) : (
              <p className="flex min-h-14 items-center gap-3 px-4 text-[15px]">
                <UserRound size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                {s ? (
                  <span className="text-[var(--ink-2)]">No steward yet</span>
                ) : (
                  <span aria-hidden className="h-4 w-40 animate-pulse rounded bg-[var(--bg-sunken)]" />
                )}
              </p>
            )}
          </li>
          {site.data?.links.map((l) => {
            const Icon = LINK_ICON[l.key] ?? Globe;
            return (
              <li key={l.key}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className={`${ROW} font-semibold`}>
                  <Icon size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                  <span className="flex-1">{l.label}</span>
                  <ArrowUpRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            );
          })}
        </ul>
        <SapaaAbout siteName={slug} hasArea={!!s?.hectares} />

        <section id="site-history" aria-label="Site history" className="reveal mt-8 scroll-mt-4">
          <Segmented tab={tab} onTab={setTab} />
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="mt-4 rounded-[var(--radius-m)]">
            {tab === 'photos' ? (
              photos.error ? (
                <Retry what="Photos" onRetry={photos.refetch} />
              ) : !photos.data ? (
                <div aria-hidden className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} className="aspect-square animate-pulse rounded-[var(--radius-s)] bg-[var(--bg-sunken)]" />
                  ))}
                </div>
              ) : (
                <PhotoGrid photos={photos.data} siteName={s?.name ?? 'this site'} />
              )
            ) : reports.error ? (
              <Retry what="Reports" onRetry={reports.refetch} />
            ) : !reports.data ? (
              <SkeletonCards />
            ) : tab === 'reports' ? (
              <ReportTimeline reports={reports.data} />
            ) : (
              <ByQuestion slug={slug} reports={reports.data} />
            )}
          </div>
        </section>
      </div>

      {/* Thumb-zone CTA above the tab bar on phones; the hero carries it on md+. */}
      <div
        className="fixed inset-x-0 z-30 border-t border-[var(--line)] bg-[var(--bg)] px-4 py-3 md:hidden"
        style={{ bottom: 'calc(var(--nav-h) + var(--safe-b))' }}
      >
        <Link
          href={inspectHref}
          className="press flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-m)] bg-[var(--forest)] text-base font-bold text-[var(--birch)] [--press-scale:0.985] active:bg-[var(--forest-2)]"
        >
          <ClipboardPen size={20} aria-hidden />
          Start inspection
        </Link>
      </div>
    </main>
  );
}

/** No counts on the tabs: the hero already counts reports, and a photo count would pop in after the tabs paint. */
function Segmented({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const reduce = useReducedMotion();
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = TABS[(i + step + TABS.length) % TABS.length].key;
    onTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div role="tablist" aria-label="Site history" className="grid grid-cols-3 rounded-full bg-[var(--bg-sunken)] p-1">
      {TABS.map((t, i) => {
        const on = t.key === tab;
        return (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`panel-${t.key}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onTab(t.key)}
            onKeyDown={(e) => onKey(e, i)}
            className={`press relative h-11 rounded-full text-sm font-semibold ${
              on ? 'text-[var(--ink)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            {on && (
              <m.span
                layoutId="site-history-tab"
                aria-hidden
                className="absolute inset-0 rounded-full bg-[var(--surface)] shadow-[0_1px_3px_rgba(18,42,28,0.16)]"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
