'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, ClipboardList, Leaf, Loader2, MapPin, Pencil, Save, UserRound } from 'lucide-react';

type ProfileData = {
  profile: {
    id: number;
    displayName: string;
    skills: string[];
    focusAreas: string[];
    role: string;
  };
  isOwner: boolean;
  stats: { inspectionCount: number; distinctSiteCount: number };
  history: Array<{ id: number; siteId: number | null; siteName: string; inspectionDate: string | null }>;
  pagination: { page: number; pageSize: number; total: number };
};

function tagText(tags: string[]) {
  return tags.join(', ');
}

function splitTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function formatDate(value: string | null) {
  if (!value) return 'Date not recorded';
  // inspection_date is a date column, so PostgREST sends "2026-09-12". Without timeZone: 'UTC'
  // the browser reads that as midnight UTC and prints the day before in Alberta.
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
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

export default function ProfilePage({ personId }: { personId?: string }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ displayName: '', skills: '', focusAreas: '' });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = personId ? `?personId=${encodeURIComponent(personId)}` : '';
    try {
      const response = await fetch(`/api/profile${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load profile.');
      setData(payload);
      setForm({
        displayName: payload.profile.displayName,
        skills: tagText(payload.profile.skills),
        focusAreas: tagText(payload.profile.focusAreas),
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

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          skills: splitTags(form.skills),
          focusAreas: splitTags(form.focusAreas),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save profile.');
      setData((current) => current ? { ...current, profile: { ...current.profile, ...payload.profile } } : current);
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-[#F7F2EA]"><Loader2 className="h-10 w-10 animate-spin text-[#356B43]" aria-label="Loading profile" /></div>;
  }

  if (error || !data) {
    return <main className="min-h-screen grid place-items-center bg-[#F7F2EA] p-6"><div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold text-[#254431]">Profile unavailable</h1><p className="mt-3 text-[#5B655D]">{error ?? 'Unable to load profile.'}</p><button onClick={() => void loadProfile()} className="mt-6 rounded-xl bg-[#356B43] px-5 py-3 font-semibold text-white">Try again</button></div></main>;
  }

  const { profile, stats, history, pagination } = data;
  return (
    <main className="min-h-screen bg-[#F7F2EA] text-[#1E2520]">
      <header className="bg-gradient-to-r from-[#254431] to-[#356B43] px-6 py-5 text-white"><div className="mx-auto flex max-w-5xl items-center justify-between"><Link href="/sites" className="text-sm font-semibold hover:underline">← Sites</Link><Link href="/profile" className="text-sm font-semibold hover:underline">My profile</Link></div></header>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5"><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#E4EBE4] text-[#356B43]"><UserRound className="h-9 w-9" /></div><div><p className="text-sm font-semibold uppercase tracking-wide text-[#5B655D]">{profile.role}</p><h1 className="text-3xl font-bold text-[#254431]">{profile.displayName}</h1><p className="mt-1 text-sm text-[#5B655D]">SAPAA steward profile</p></div></div>
            {data.isOwner && !editing && <button onClick={() => { setEditing(true); setSaved(false); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#356B43] px-4 py-2.5 font-semibold text-[#254431]"><Pencil className="h-4 w-4" />Edit profile</button>}
          </div>
          {(profile.skills.length > 0 || profile.focusAreas.length > 0) && <div className="mt-6 grid gap-5 border-t border-[#E4EBE4] pt-5 sm:grid-cols-2">
            {profile.skills.length > 0 && <TagList label="Skills" tags={profile.skills} />}
            {profile.focusAreas.length > 0 && <TagList label="Focus areas" tags={profile.focusAreas} />}
          </div>}
          {saved && <p role="status" className="mt-5 flex items-center gap-2 text-sm font-medium text-[#17633B]"><Check className="h-4 w-4" />Profile saved.</p>}
        </section>

        {editing && data.isOwner && <form onSubmit={saveProfile} className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-[#254431]">Edit profile</h2><p className="mt-1 text-sm text-[#5B655D]">Your role and account credentials are managed separately.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#254431]">Display name<input value={form.displayName} maxLength={29} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="mt-1 block w-full rounded-lg border border-[#B9C8BC] px-3 py-2" required /></label><label className="text-sm font-semibold text-[#254431]">Skills <span className="font-normal">(comma-separated)</span><input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} className="mt-1 block w-full rounded-lg border border-[#B9C8BC] px-3 py-2" /></label><label className="text-sm font-semibold text-[#254431]">Focus areas <span className="font-normal">(comma-separated)</span><input value={form.focusAreas} onChange={(event) => setForm({ ...form, focusAreas: event.target.value })} className="mt-1 block w-full rounded-lg border border-[#B9C8BC] px-3 py-2" /></label></div><div className="mt-6 flex gap-3"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#356B43] px-4 py-2.5 font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save changes'}</button><button type="button" onClick={() => setEditing(false)} className="rounded-xl px-4 py-2.5 font-semibold text-[#254431]">Cancel</button></div></form>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-white p-5 shadow-sm"><ClipboardList className="h-5 w-5 text-[#356B43]" /><p className="mt-3 text-sm font-medium text-[#5B655D]">Inspection reports submitted</p><p className="text-3xl font-bold text-[#254431]">{stats.inspectionCount}</p></div><div className="rounded-2xl bg-white p-5 shadow-sm"><MapPin className="h-5 w-5 text-[#356B43]" /><p className="mt-3 text-sm font-medium text-[#5B655D]">Distinct sites inspected</p><p className="text-3xl font-bold text-[#254431]">{stats.distinctSiteCount}</p></div></section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Leaf className="h-5 w-5 text-[#356B43]" /><h2 className="text-xl font-bold text-[#254431]">Inspection history</h2></div><p className="mt-1 text-sm text-[#5B655D]">Web inspection records only.</p>{history.length === 0 ? <p className="py-8 text-sm text-[#5B655D]">No inspection reports recorded yet.</p> : <ul className="mt-5 divide-y divide-[#E4EBE4]">{history.map((inspection) => <li key={inspection.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold text-[#254431]">{inspection.siteId ? <Link href={`/detail/${encodeURIComponent(inspection.siteName)}`} className="hover:underline">{inspection.siteName}</Link> : inspection.siteName}</p><p className="mt-1 text-sm text-[#5B655D]">{formatDate(inspection.inspectionDate)}</p></div></li>)}</ul>}{pagination.total > pagination.pageSize && <p className="mt-4 text-sm text-[#5B655D]">Showing the most recent {history.length} of {pagination.total} reports.</p>}</section>
      </div>
    </main>
  );
}
