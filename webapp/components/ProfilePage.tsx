'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { Archive, Check, ClipboardList, Leaf, Loader2, MapPin, Pencil, Save, UserCheck, UserRound } from 'lucide-react';
import { getSitesForSteward, StewardedSite } from '@/utils/steward-actions';
import { SOCIAL_FIELDS, SocialKey, Socials, socialHref } from '@/lib/socials';
import UserNavBar from '@/components/HeaderDropdown';
import TagPicker from '@/components/TagPicker';
import { TagOptions } from '@/lib/profileTags';

type HistoryItem = {
  id: number;
  siteId: number | null;
  siteName: string;
  siteArchived: boolean;
  siteInactive: boolean;
  inspectionDate: string | null;
};

type Pagination = { page: number; pageSize: number; total: number };

type ProfileData = {
  profile: {
    id: number;
    displayName: string;
    skills: string[];
    focusAreas: string[];
    role: string;
    socials?: Socials;
  };
  isOwner: boolean;
  stats: { inspectionCount: number; distinctSiteCount: number };
  history: HistoryItem[];
  pagination: Pagination;
  options?: TagOptions;
};

type ProfileForm = { displayName: string; skills: string[]; focusAreas: string[]; socials: Record<SocialKey, string> };

function formatDate(value: string | null) {
  if (!value) return 'Date not recorded';
  // inspection_date is a date column, so PostgREST sends "2026-09-12". new Date() reads that as
  // midnight UTC, so format it in UTC to keep the same day. The created_at fallback is a full
  // timestamp, so format it in local time: in UTC an evening report in Alberta shows the next day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
  }
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(value));
}

function socialsForm(socials: Socials | undefined) {
  return Object.fromEntries(SOCIAL_FIELDS.map(({ key }) => [key, socials?.[key] ?? ''])) as Record<SocialKey, string>;
}

function profileQuery(personId: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (personId) params.set('personId', personId);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function TagList({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-[#5B655D]">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag} className="rounded-lg bg-[#E4EBE4] px-2.5 py-1 text-sm text-[#254431]">{tag}</li>
        ))}
      </ul>
    </div>
  );
}

function ContactList({ socials }: { socials?: Socials }) {
  if (!SOCIAL_FIELDS.some(({ key }) => socials?.[key])) return null;
  return (
    <div className="mt-6 border-t border-[#E4EBE4] pt-5" data-testid="profile-contact">
      <p className="text-sm font-medium text-[#5B655D]">Contact</p>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {SOCIAL_FIELDS.map(({ key, label, kind }) => {
          const value = socials?.[key];
          if (!value) return null;
          return (
            <li key={key} className="text-sm">
              <span className="font-semibold text-[#254431]">{label}: </span>
              <a
                href={socialHref(kind, value)}
                {...(kind === 'link' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-[#356B43] underline break-all"
              >
                {value}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProfileEditForm({
  form,
  options,
  onChange,
  onSubmit,
  onCancel,
  saving,
  saveError,
}: {
  form: ProfileForm;
  options: TagOptions;
  onChange: (form: ProfileForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  const inputClass = 'mt-1 block w-full rounded-lg border border-[#B9C8BC] px-3 py-2';
  const checkedInputClass = `${inputClass} user-invalid:border-red-600 user-invalid:bg-red-50`;
  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#254431]">Edit profile</h2>
      <p className="mt-1 text-sm text-[#5B655D]">Your role and account credentials are managed separately.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#254431]">
          Display name
          <input
            value={form.displayName}
            maxLength={29}
            onChange={(event) => onChange({ ...form, displayName: event.target.value })}
            className={checkedInputClass}
            required
            pattern=".*\S.*"
            title="Enter your name."
          />
        </label>
        <TagPicker label="Skills" values={form.skills} options={options.skills} onChange={(skills) => onChange({ ...form, skills })} />
        <TagPicker label="Focus areas" values={form.focusAreas} options={options.focusAreas} onChange={(focusAreas) => onChange({ ...form, focusAreas })} />
      </div>
      <h3 className="mt-6 text-base font-bold text-[#254431]">
        Contact <span className="text-sm font-normal text-[#5B655D]">(email required, the rest optional, visible to signed-in members)</span>
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {SOCIAL_FIELDS.map(({ key, label, kind }) => (
          <label key={key} className="text-sm font-semibold text-[#254431]">
            {label}
            <input
              type={kind === 'email' ? 'email' : kind === 'phone' ? 'tel' : 'url'}
              value={form.socials[key]}
              placeholder={kind === 'link' ? 'https://' : undefined}
              required={kind === 'email'}
              pattern={kind === 'link' ? 'https://.*' : undefined}
              title={kind === 'link' ? 'Enter a link that starts with https://' : undefined}
              onChange={(event) => onChange({ ...form, socials: { ...form.socials, [key]: event.target.value } })}
              className={checkedInputClass}
            />
          </label>
        ))}
      </div>
      {saveError && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{saveError}</p>}
      <div className="mt-6 flex gap-3">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#356B43] px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 font-semibold text-[#254431]">Cancel</button>
      </div>
    </form>
  );
}

function StewardedSites({ sites }: { sites: StewardedSite[] }) {
  if (sites.length === 0) return null;
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm" data-testid="stewarded-sites">
      <div className="flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-[#356B43]" />
        <h2 className="text-xl font-bold text-[#254431]">Steward of</h2>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {sites.map((site) => (
          <li key={site.siteId}>
            {site.isActive ? (
              <Link
                href={`/detail/${encodeURIComponent(site.namesite)}`}
                className="inline-block rounded-lg bg-[#E4EBE4] px-3 py-1.5 text-sm font-semibold text-[#254431] hover:underline"
              >
                {site.namesite}
              </Link>
            ) : (
              <span
                data-testid={`stewarded-site-inactive-${site.siteId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#E4EBE4] px-3 py-1.5 text-sm font-semibold text-[#5B655D]"
              >
                {site.namesite}
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Inactive</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      {icon}
      <p className="mt-3 text-sm font-medium text-[#5B655D]">{label}</p>
      <p className="text-3xl font-bold text-[#254431]">{value}</p>
    </div>
  );
}

function HistorySiteName({ inspection }: { inspection: HistoryItem }) {
  return (
    <span>
      {inspection.siteName}
      {inspection.siteArchived && (
        <span
          data-testid={`archived-site-badge-${inspection.id}`}
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 align-middle"
        >
          <Archive className="h-3 w-3" />
          Archived by Admin
        </span>
      )}
      {!inspection.siteArchived && inspection.siteInactive && (
        <span
          data-testid={`inactive-site-badge-${inspection.id}`}
          className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 align-middle"
        >
          Deactivated by Admin
        </span>
      )}
    </span>
  );
}

function InspectionHistory({
  history,
  pagination,
  onPageChange,
  pageLoading,
  pageError,
}: {
  history: HistoryItem[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  pageLoading: boolean;
  pageError: string | null;
}) {
  const { page, pageSize, total } = pagination;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = first + history.length - 1;
  const navButtonClass = 'rounded-lg border border-[#B9C8BC] px-3 py-1.5 text-sm font-semibold text-[#254431] disabled:opacity-50';
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-[#356B43]" />
        <h2 className="text-xl font-bold text-[#254431]">Inspection history</h2>
      </div>
      <p className="mt-1 text-sm text-[#5B655D]">Web inspection records only.</p>
      {history.length === 0 ? (
        <p className="py-8 text-sm text-[#5B655D]">No inspection reports recorded yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-[#E4EBE4]">
          {history.map((inspection) => {
            const content = (
              <>
                <p className="font-semibold text-[#254431]"><HistorySiteName inspection={inspection} /></p>
                <p className="mt-1 text-sm text-[#5B655D]">{formatDate(inspection.inspectionDate)}</p>
              </>
            );
            const canOpenReport = inspection.siteId !== null
              && !inspection.siteArchived
              && !inspection.siteInactive;

            return (
              <li key={inspection.id}>
                {canOpenReport ? (
                  <Link
                    href={`/detail/${encodeURIComponent(inspection.siteName)}?report=${inspection.id}`}
                    className="block w-full rounded-lg py-4 hover:bg-[#F7F2EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#356B43]"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    data-testid={`unavailable-history-row-${inspection.id}`}
                    className="py-4 opacity-60"
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {total > pageSize && (
        <nav aria-label="Inspection history pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#5B655D]" aria-live="polite">
            Showing {first}–{last} of {total} reports.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={pageLoading || page <= 1}
              aria-label="Previous page of inspection history"
              className={navButtonClass}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={pageLoading || page >= lastPage}
              aria-label="Next page of inspection history"
              className={navButtonClass}
            >
              Next
            </button>
          </div>
        </nav>
      )}
      {pageError && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{pageError}</p>}
    </section>
  );
}

export default function ProfilePage({ personId }: { personId?: string }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // A failed save keeps the form and the typed edits. `error` is only for a failed load.
  const [saveError, setSaveError] = useState<string | null>(null);
  // A failed page change keeps the current page of history. It does not replace the profile.
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({ displayName: '', skills: [], focusAreas: [], socials: socialsForm(undefined) });
  const [stewardedSites, setStewardedSites] = useState<StewardedSite[]>([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/profile${profileQuery(personId, 1)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load profile.');
      setData(payload);
      setForm({
        displayName: payload.profile.displayName,
        skills: payload.profile.skills,
        focusAreas: payload.profile.focusAreas,
        socials: socialsForm(payload.profile.socials),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    queueMicrotask(() => { void loadProfile(); });
  }, [loadProfile]);

  // 3.0.2 AT3: the sites this person looks after. A failure here only hides the list.
  const profileId = data?.profile.id;
  useEffect(() => {
    if (!profileId) return;
    getSitesForSteward(profileId).then(setStewardedSites).catch(() => setStewardedSites([]));
  }, [profileId]);

  async function changeHistoryPage(page: number) {
    setPageLoading(true);
    setPageError(null);
    try {
      const response = await fetch(`/api/profile${profileQuery(personId, page)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load inspection history.');
      setData((current) => current ? { ...current, history: payload.history, pagination: payload.pagination } : current);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Unable to load inspection history.');
    } finally {
      setPageLoading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          skills: form.skills,
          focusAreas: form.focusAreas,
          socials: form.socials,
        }),
      });
      const payload = await response.json();
      // A partial save still sends back the stored profile, so the page shows it.
      if (payload.profile) setData((current) => current ? { ...current, profile: { ...current.profile, ...payload.profile } } : current);
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save profile.');
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F7F2EA]">
        <Loader2 className="h-10 w-10 animate-spin text-[#356B43]" aria-label="Loading profile" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#F7F2EA] p-6">
        <div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#254431]">Profile unavailable</h1>
          <p className="mt-3 text-[#5B655D]">{error ?? 'Unable to load profile.'}</p>
          <button onClick={() => void loadProfile()} className="mt-6 rounded-xl bg-[#356B43] px-5 py-3 font-semibold text-white">Try again</button>
        </div>
      </main>
    );
  }

  const { profile, stats, history, pagination } = data;
  return (
    <main className="min-h-screen bg-[#F7F2EA] text-[#1E2520]">
      <header className="bg-gradient-to-r from-[#254431] to-[#356B43] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/sites'))}
            className="text-sm font-semibold hover:underline"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm font-semibold hover:underline">My profile</Link>
            <div className="-mt-4"><UserNavBar /></div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#E4EBE4] text-[#356B43]">
                <UserRound className="h-9 w-9" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#5B655D]">{profile.role}</p>
                <h1 className="text-3xl font-bold text-[#254431]">{profile.displayName}</h1>
                <p className="mt-1 text-sm text-[#5B655D]">SAPAA steward profile</p>
              </div>
            </div>
            {data.isOwner && !editing && (
              <button
                onClick={() => { setEditing(true); setSaved(false); }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#356B43] px-4 py-2.5 font-semibold text-[#254431]"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </button>
            )}
          </div>
          {(profile.skills.length > 0 || profile.focusAreas.length > 0) && (
            <div className="mt-6 grid gap-5 border-t border-[#E4EBE4] pt-5 sm:grid-cols-2">
              {profile.skills.length > 0 && <TagList label="Skills" tags={profile.skills} />}
              {profile.focusAreas.length > 0 && <TagList label="Focus areas" tags={profile.focusAreas} />}
            </div>
          )}
          <ContactList socials={profile.socials} />
          {saved && (
            <p role="status" className="mt-5 flex items-center gap-2 text-sm font-medium text-[#17633B]">
              <Check className="h-4 w-4" />
              Profile saved.
            </p>
          )}
        </section>

        {editing && data.isOwner && (
          <ProfileEditForm
            form={form}
            options={data.options ?? { skills: [], focusAreas: [] }}
            onChange={setForm}
            onSubmit={saveProfile}
            onCancel={() => { setEditing(false); setSaveError(null); }}
            saving={saving}
            saveError={saveError}
          />
        )}

        <StewardedSites sites={stewardedSites} />

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatCard icon={<ClipboardList className="h-5 w-5 text-[#356B43]" />} label="Inspection reports submitted" value={stats.inspectionCount} />
          <StatCard icon={<MapPin className="h-5 w-5 text-[#356B43]" />} label="Distinct sites inspected" value={stats.distinctSiteCount} />
        </section>

        <InspectionHistory
          history={history}
          pagination={pagination}
          onPageChange={(page) => void changeHistoryPage(page)}
          pageLoading={pageLoading}
          pageError={pageError}
        />
      </div>
    </main>
  );
}
