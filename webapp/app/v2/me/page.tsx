'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronRight, Globe, Leaf, Link2, Mail, Pencil, Phone, Settings, ShieldCheck } from 'lucide-react';
import { ApiError, api } from '@/lib/api/v1/client';
import type { Report } from '@/lib/api/v1/types';
import { SOCIAL_FIELDS, socialHref } from '@/lib/socials';
import { useApi, invalidate } from '@/app/v2/_lib/useApi';
import { STATUS_COLOR, STATUS_INK, STATUS_LABEL, ago } from '@/app/v2/_lib/siteQuery';
import PhotoHero from '@/app/v2/_components/sites/PhotoHero';
import { HEADING } from '@/app/v2/_components/sites/ui';
import { SEASON_GOAL, formatDate, initials, seasonVisits, siteHref } from '@/app/v2/_components/flows/format';
import { ErrorState, SectionTitle, Toast, btn, card, heroTitle, raised, tabBarPadding, useToast } from '@/app/v2/_components/flows/ui';
import { EditProfileSheet, type Profile } from './EditProfileSheet';

interface ProfilePayload {
  profile: Profile;
  isOwner: boolean;
  stats: { inspectionCount: number; distinctSiteCount: number };
}

/** The existing profile route (US 1.0.1/1.0.2): supports viewing another steward with ?personId=. */
async function getProfile(personId: string | null): Promise<ProfilePayload> {
  const res = await fetch(`/api/profile${personId ? `?personId=${encodeURIComponent(personId)}` : ''}`);
  if (res.redirected || !res.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(401, 'Your session expired. Sign in again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  return body as ProfilePayload;
}

const CONTACT_ICON = { email: Mail, phone: Phone, website: Globe } as Record<string, typeof Mail>;

export default function YouPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const person = params.get('person');
  const me = useApi('me', api.me);
  const profile = useApi(`profile:${person ?? 'me'}`, () => getProfile(person));
  const sites = useApi('sites', api.sites);
  const reports = useApi('reports', api.reports);
  // Inspection history, ten a page: reports on an archived or deactivated site are listed but not opened.
  const [historyPage, setHistoryPage] = useState(1);
  const history = useApi(`profile:history:${person ?? 'me'}:${historyPage}`, () =>
    api.inspectionHistory({ person, page: historyPage }),
  );
  const [patch, setPatch] = useState<Partial<Profile>>({});
  // Settings links here with ?edit=1 to open the editor.
  const [editing, setEditing] = useState(() => params.get('edit') === '1');
  const [toast, setToast] = useToast();
  const closeEditor = () => {
    setEditing(false);
    if (params.get('edit')) window.history.replaceState(null, '', pathname);
  };

  const own = profile.data ? profile.data.isOwner : person === null;
  const p = profile.data ? { ...profile.data.profile, ...patch } : null;
  const pid = p?.id ?? (own ? me.data?.person?.id : person ? Number(person) : undefined);

  // Another steward's page needs the profile; your own page falls back to /me so you can always sign out.
  if (!own && profile.error) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-6" style={tabBarPadding}>
        <BackButton onBack={() => router.back()} />
        <div className="mt-4">
          <ErrorState title="This profile did not load" error={profile.error} onRetry={profile.refetch} />
        </div>
      </main>
    );
  }

  const name = p?.displayName ?? (own ? me.data?.person?.name ?? me.data?.email ?? '' : '');
  const role = p?.role ?? (own && me.data ? (me.data.role === 'admin' ? 'Admin' : 'Steward') : null);

  const mine = (r: Report) =>
    own ? r.isOwn : (pid !== undefined && r.submittedBy?.id === pid) || (!r.submittedBy && !!name && r.stewardName === name);
  const season = reports.data ? seasonVisits(reports.data, mine) : null;
  const filed = profile.data?.stats.inspectionCount ?? (own ? me.data?.stats.reports : undefined);
  const visited = profile.data?.stats.distinctSiteCount ?? (own ? me.data?.stats.sites : undefined);
  const stewardOf = (sites.data ?? []).filter((s) =>
    own ? (me.data?.assignedSiteIds ?? []).includes(s.id) : pid !== undefined && s.steward?.id === pid,
  );
  const contacts = SOCIAL_FIELDS.filter(({ key }) => p?.socials?.[key]);
  const firstName = name.split(' ')[0] || 'This steward';

  return (
    <>
      <PhotoHero className="pb-16">
        <div className="mx-auto max-w-3xl px-5 pt-[max(12px,env(safe-area-inset-top))] md:px-8">
          <div className="flex min-h-11 items-center justify-between gap-2">
            {own ? <span /> : <BackButton onBack={() => router.back()} />}
            {own && (
              <div className="flex items-center gap-2">
                {p && (
                  <button type="button" onClick={() => setEditing(true)} className={`${btn.onPhoto} px-4`}>
                    <Pencil size={16} aria-hidden />
                    Edit profile
                  </button>
                )}
                <Link href="/v2/me/settings" aria-label="Settings" className={btn.onPhoto}>
                  <Settings size={20} aria-hidden />
                </Link>
              </div>
            )}
          </div>
          <div className="mt-10 flex items-end gap-4 md:mt-16">
            <span
              aria-hidden
              className="grid size-20 shrink-0 place-items-center rounded-full bg-[var(--honey)] text-[28px] font-bold text-[var(--canopy)] md:size-24 md:text-[32px]"
            >
              {name ? initials(name) : ''}
            </span>
            <div className="min-w-0 pb-1">
              {role && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--honey)] px-2.5 py-0.5 text-[13px] font-bold text-[var(--honey)]">
                  {role === 'Admin' ? <ShieldCheck size={14} aria-hidden /> : <Leaf size={14} aria-hidden />}
                  {role}
                </span>
              )}
              <h1 style={HEADING} className={`${heroTitle} break-words`}>
                {name || <span className="inline-block h-8 w-48 animate-pulse rounded bg-white/20 align-middle" />}
              </h1>
            </div>
          </div>
        </div>
      </PhotoHero>

      <main className="mx-auto max-w-3xl px-4 md:px-8" style={tabBarPadding}>
        <section aria-label="Activity" className={`relative z-10 -mt-12 grid grid-cols-3 divide-x divide-[var(--line)] ${card} ${raised}`}>
          <Stat label="Reports filed" value={filed} />
          <Stat label="Sites visited" value={visited} />
          <div className="flex flex-col px-3 py-4 md:px-5">
            <p className="num leading-none">
              <span className="text-[32px] font-bold [font-stretch:87.5%] md:text-[40px]">{season ?? '–'}</span>
              <span className="text-[15px] text-[var(--ink-2)]">/{SEASON_GOAL}</span>
            </p>
            <div
              role="progressbar"
              aria-label="Visits this season"
              aria-valuemin={0}
              aria-valuemax={SEASON_GOAL}
              aria-valuenow={Math.min(season ?? 0, SEASON_GOAL)}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-sunken)]"
            >
              <div
                className="h-full origin-left rounded-full bg-[var(--honey)]"
                style={{ transform: `scaleX(${Math.min(season ?? 0, SEASON_GOAL) / SEASON_GOAL})` }}
              />
            </div>
            <p className="mt-auto pt-1.5 text-[13px] leading-tight text-[var(--ink-2)]">Season goal</p>
          </div>
        </section>

        {own && profile.error && (
          <div className="mt-5">
            <ErrorState title="Profile details did not load" error={profile.error} onRetry={profile.refetch} />
          </div>
        )}

        {p && (p.skills.length > 0 || p.focusAreas.length > 0 || own) && (
          <Block title="Skills and focus areas">
            {p.skills.length || p.focusAreas.length ? (
              <div className="space-y-3">
                <Tags label="Skills" tags={p.skills} />
                <Tags label="Focus areas" tags={p.focusAreas} />
              </div>
            ) : (
              <>
                <p className="text-[15px] text-[var(--ink-2)]">
                  Add what you know and what you look for, so other stewards know who to ask.
                </p>
                <button type="button" onClick={() => setEditing(true)} className={`${btn.secondary} mt-3 min-h-11 px-4 text-[15px]`}>
                  <Pencil size={16} aria-hidden />
                  Add skills
                </button>
              </>
            )}
          </Block>
        )}

        {contacts.length > 0 && (
          <Block title="Contact">
            <ul className={`${card} divide-y divide-[var(--line)] overflow-hidden`}>
              {contacts.map(({ key, label, kind }) => {
                const value = p!.socials![key]!;
                const Icon = CONTACT_ICON[key] ?? Link2;
                return (
                  <li key={key}>
                    <a
                      href={socialHref(kind, value)}
                      {...(kind === 'link' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="press flex min-h-14 items-center gap-3 px-4 py-2.5 [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)]"
                    >
                      <Icon size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-[var(--ink-2)]">{label}</span>
                        <span className="block truncate font-semibold">{value}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </Block>
        )}

        <Block title="Steward of">
          {sites.error ? (
            <ErrorState title="Sites did not load" error={sites.error} onRetry={sites.refetch} />
          ) : !sites.data || (own && !me.data) ? (
            <div className="h-16 animate-pulse rounded-[var(--radius-l)] bg-[var(--bg-sunken)]" />
          ) : stewardOf.length === 0 ? (
            <p className="text-[15px] text-[var(--ink-2)]">
              {own ? 'You are not assigned to a site yet. An admin can assign you from the site page.' : `${firstName} is not assigned to a site.`}
            </p>
          ) : (
            <ul className={`${card} divide-y divide-[var(--line)] overflow-hidden`}>
              {stewardOf.map((s) => (
                <li key={s.id}>
                  <Link href={siteHref(s.slug)} className="press flex min-h-16 items-center gap-3 px-4 py-3 [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)]">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{s.name}</span>
                      <span className="block text-sm text-[var(--ink-2)]">
                        <span className="font-semibold" style={{ color: STATUS_INK[s.status] }}>
                          {STATUS_LABEL[s.status]}
                        </span>
                        {s.daysSince !== null && (s.daysSince < 1 ? ', visited today' : `, last visit ${ago(s.daysSince)} ago`)}
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block
          title="Inspection history"
          action={
            (history.data?.total ?? 0) > 0 && (
              <Link
                href={own ? '/v2/reports?who=mine' : `/v2/reports?who=all&q=${encodeURIComponent(name)}`}
                className="inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold underline-offset-2 hover:underline"
              >
                See all
                <ChevronRight size={16} aria-hidden />
              </Link>
            )
          }
        >
          {history.error ? (
            <ErrorState title="History did not load" error={history.error} onRetry={history.refetch} />
          ) : !history.data ? (
            <div className="h-32 animate-pulse rounded-[var(--radius-l)] bg-[var(--bg-sunken)]" />
          ) : history.data.items.length === 0 ? (
            <p className="text-[15px] text-[var(--ink-2)]">
              {own ? 'Your submitted inspections will show here.' : `${firstName} has no inspections on file yet.`}
            </p>
          ) : (
            <>
              <ul className={`${card} divide-y divide-[var(--line)] overflow-hidden`}>
                {history.data.items.map((r) => {
                  const row = (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {r.siteName}
                        {r.siteArchived && <StatusTag>Archived by Admin</StatusTag>}
                        {!r.siteArchived && r.siteInactive && <StatusTag>Deactivated by Admin</StatusTag>}
                      </span>
                      <span className="mt-0.5 block text-sm text-[var(--ink-2)]">{formatDate(r.date)}</span>
                    </span>
                  );
                  return (
                    <li key={r.id}>
                      {r.canOpen ? (
                        <Link
                          href={`/v2/reports/${r.id}`}
                          className="press flex min-h-16 items-center gap-3 px-4 py-3 [--press-scale:0.99] hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)]"
                        >
                          {row}
                          <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
                        </Link>
                      ) : (
                        <div data-testid={`unavailable-history-row-${r.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 opacity-60">
                          {row}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {history.data.total > history.data.pageSize && (
                <nav aria-label="History pages" className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => p - 1)}
                    className={`${btn.secondary} min-h-11 px-4 text-[15px] disabled:opacity-40`}
                  >
                    Previous
                  </button>
                  <span className="num text-sm text-[var(--ink-2)]">
                    Page {history.data.page} of {Math.ceil(history.data.total / history.data.pageSize)}
                  </span>
                  <button
                    type="button"
                    disabled={historyPage * history.data.pageSize >= history.data.total}
                    onClick={() => setHistoryPage((p) => p + 1)}
                    className={`${btn.secondary} min-h-11 px-4 text-[15px] disabled:opacity-40`}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </Block>

      </main>

      {own && p && (
        <EditProfileSheet
          open={editing}
          onClose={closeEditor}
          profile={p}
          accountEmail={me.data?.email}
          onSaved={(saved, done) => {
            setPatch((cur) => ({ ...cur, ...saved }));
            invalidate('me');
            invalidate('profile');
            if (done) {
              closeEditor();
              setToast('Profile saved');
            }
          }}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

function StatusTag({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 rounded-full bg-[var(--bg-sunken)] px-2 py-0.5 align-middle text-[12px] font-bold text-[var(--ink-2)]">
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex flex-col px-3 py-4 md:px-5">
      <p className="num text-[32px] leading-none font-bold [font-stretch:87.5%] md:text-[40px]">{value ?? '–'}</p>
      <p className="mt-auto pt-1.5 text-[13px] leading-tight text-[var(--ink-2)]">{label}</p>
    </div>
  );
}

/** Below-the-fold sections rise in gently as they scroll into view (.reveal, CSS only). */
function Block({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="reveal mt-8">
      <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
        <SectionTitle>{title}</SectionTitle>
        {action}
      </div>
      {children}
    </section>
  );
}

function Tags({ label, tags }: { label: string; tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-[var(--ink-2)]">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <li key={t} className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-[15px] font-semibold ring-1 ring-[var(--line)]">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} aria-label="Back" className={`${btn.onPhoto} -ml-1`}>
      <ArrowLeft size={22} aria-hidden />
    </button>
  );
}
