'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, Facebook, Globe, Instagram, Link2, Linkedin, Loader2, Mail, Phone, Plus, X, type LucideIcon } from 'lucide-react';
import TagPicker from '@/components/TagPicker';
import { SOCIAL_FIELDS, type SocialKey, type Socials } from '@/lib/socials';
import PhotoHero from '@/app/v2/_components/sites/PhotoHero';
import { HEADING } from '@/app/v2/_components/sites/ui';
import { initials } from '@/app/v2/_components/flows/format';
import { SHEET_MOTION, btn, card, useDialog } from '@/app/v2/_components/flows/ui';

export interface Profile {
  id: number;
  displayName: string;
  skills: string[];
  focusAreas: string[];
  role: string;
  socials?: Socials;
}

// Same limits as app/api/profile/route.ts and lib/socials.ts, so the steward hears about a problem before the round trip.
const NAME_MAX = 29;
const MAX_TAGS = 12;
const TAG_MAX = 40;
const LINK = /^https:\/\/\S+$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const LENGTH = { email: 254, phone: 30, link: 300 } as const;

const ICON: Record<SocialKey, LucideIcon> = {
  email: Mail,
  phone: Phone,
  website: Globe,
  instagram: Instagram,
  facebook: Facebook,
  x: Link2,
  linkedin: Linkedin,
};
const PLACEHOLDER: Record<SocialKey, string> = {
  email: 'name@example.com',
  phone: '780 555 0123',
  website: 'https://',
  instagram: 'https://instagram.com/…',
  facebook: 'https://facebook.com/…',
  x: 'https://x.com/…',
  linkedin: 'https://linkedin.com/in/…',
};

type TagKey = 'skills' | 'focusAreas';
type FieldKey = 'displayName' | TagKey | SocialKey;
type Errors = Partial<Record<FieldKey, string>>;

interface Draft {
  displayName: string;
  skills: string[];
  focusAreas: string[];
  /** Text still in a tag's add field. Saved too, so nothing typed is lost. */
  pending: Record<TagKey, string>;
  socials: Record<SocialKey, string>;
}

/** Email is required, so an empty one starts as the sign-in email: the first save then passes. */
const fromProfile = (p: Profile, accountEmail?: string | null): Draft => ({
  displayName: p.displayName,
  skills: p.skills,
  focusAreas: p.focusAreas,
  pending: { skills: '', focusAreas: '' },
  socials: Object.fromEntries(
    SOCIAL_FIELDS.map(({ key }) => [key, p.socials?.[key] || (key === 'email' ? accountEmail : '') || '']),
  ) as Record<SocialKey, string>,
});

/** Email and the links already filled in; the rest wait behind "Add a link". */
const filledKeys = (d: Draft) => SOCIAL_FIELDS.filter(({ key, kind }) => kind === 'email' || d.socials[key]).map(({ key }) => key);

/** Tags plus whatever is still typed in the add field, trimmed and de-duplicated. */
const withPending = (tags: string[], text: string) => [...new Set([...tags, ...text.split(',').map((t) => t.trim()).filter(Boolean)])];
const payload = (d: Draft) => ({
  displayName: d.displayName.trim(),
  skills: withPending(d.skills, d.pending.skills),
  focusAreas: withPending(d.focusAreas, d.pending.focusAreas),
  socials: Object.fromEntries(SOCIAL_FIELDS.map(({ key }) => [key, d.socials[key].trim()])),
});

function validate(d: Draft): Errors {
  const e: Errors = {};
  if (!d.displayName.trim()) e.displayName = 'Enter the name other stewards will see.';
  const p = payload(d);
  for (const [key, label] of [
    ['skills', 'skills'],
    ['focusAreas', 'focus areas'],
  ] as const) {
    if (p[key].length > MAX_TAGS) e[key] = `Add up to ${MAX_TAGS} ${label}.`;
    else if (p[key].some((t) => t.length > TAG_MAX)) e[key] = `Keep each of your ${label} to ${TAG_MAX} characters or fewer.`;
  }
  for (const { key, label, kind } of SOCIAL_FIELDS) {
    const v = d.socials[key].trim();
    if (kind === 'email' && !v) e[key] = 'Email is required.';
    else if (v.length > LENGTH[kind]) e[key] = `${label} must be ${LENGTH[kind]} characters or fewer.`;
    else if (v && kind === 'email' && !EMAIL.test(v)) e[key] = 'Enter a valid email address, like name@example.com.';
    else if (v && kind === 'link' && !LINK.test(v)) e[key] = `${label} must be a link that starts with https://`;
  }
  return e;
}

/**
 * Full-height sheet on phones, centred panel on desktop. Grouped cards like the site page, a sticky
 * Save bar in the thumb zone, and a guard so unsaved edits are never dropped by a stray tap or Escape.
 */
export function EditProfileSheet({
  open,
  onClose,
  profile,
  accountEmail,
  options,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  /** The sign-in email, the default for the required contact email. */
  accountEmail?: string | null;
  options: { skills: string[]; focusAreas: string[] };
  /** Called with whatever the server stored, including after a partial save. */
  onSaved: (saved: Partial<Profile>, done: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const id = (k: FieldKey) => `${uid}-${k}`;
  useDialog(ref, open);

  const [draft, setDraft] = useState(() => fromProfile(profile, accountEmail));
  const [shown, setShown] = useState<SocialKey[]>(() => filledKeys(draft));
  const [added, setAdded] = useState<SocialKey | null>(null);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [serverError, setServerError] = useState<{ field: FieldKey | null; message: string } | null>(null);

  // Every open starts from the stored profile.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const fresh = fromProfile(profile, accountEmail);
      setDraft(fresh);
      setShown(filledKeys(fresh));
      setAdded(null);
      setTouched({});
      setChecked(false);
      setConfirming(false);
      setServerError(null);
    }
  }

  const dirty = JSON.stringify(payload(draft)) !== JSON.stringify(payload(fromProfile(profile, accountEmail)));
  const all = validate(draft);
  // Inline validation: a field shows its error once you leave it, or after a save attempt.
  const errors: Errors = Object.fromEntries(Object.entries(all).filter(([k]) => checked || touched[k as FieldKey]));
  if (serverError?.field && !errors[serverError.field]) errors[serverError.field] = serverError.message;

  // Closing the tab or reloading with unsaved edits asks first.
  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [open, dirty]);

  // A link row added from "Add a link" takes focus.
  useEffect(() => {
    if (added) document.getElementById(`${uid}-${added}`)?.focus();
  }, [added, uid]);

  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirming(true);
    else onClose();
  };
  const touch = (k: FieldKey) => () => setTouched((t) => ({ ...t, [k]: true }));
  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setConfirming(false);
  };

  const submit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setChecked(true);
    setServerError(null);
    const first = (Object.keys(all) as FieldKey[])[0];
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(draft)),
      });
      const body = await res.json().catch(() => ({}));
      // A partial save still sends back what is stored, so the page shows it.
      if (body.profile) onSaved(body.profile, res.ok);
      if (!res.ok) {
        const message: string = body.error ?? `Your profile was not saved (${res.status}).`;
        const field =
          (['displayName', 'skills', 'focusAreas'] as const).find((k) =>
            message.startsWith({ displayName: 'Display name', skills: 'Skills', focusAreas: 'Focus areas' }[k]),
          ) ??
          SOCIAL_FIELDS.find(({ label }) => message.startsWith(label))?.key ??
          (/email/i.test(message) ? 'email' : null);
        setServerError({ field, message });
        if (field) document.getElementById(id(field))?.focus();
      }
    } catch {
      setServerError({ field: null, message: 'Your profile was not saved. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const name = draft.displayName.trim();

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-title`}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => e.target === ref.current && requestClose()}
      className={`m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-[var(--bg)] p-0 text-[var(--ink)] backdrop:bg-[rgba(10,24,16,0.55)] open:flex open:flex-col md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-xl md:rounded-[var(--radius-l)] md:shadow-[0_24px_64px_rgba(10,24,16,0.35)] ${SHEET_MOTION}`}
    >
      <form noValidate onSubmit={submit} aria-busy={saving} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <PhotoHero className="h-28 shrink-0 md:h-32">
            <div className="flex items-center justify-between px-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
              <button type="button" onClick={requestClose} aria-label="Close" className={btn.onPhoto}>
                <X size={22} aria-hidden />
              </button>
              <h2 id={`${uid}-title`} style={HEADING} className="text-[17px] font-bold text-[var(--birch)]">
                Edit profile
              </h2>
              <span aria-hidden className="size-11" />
            </div>
          </PhotoHero>

          <div className="relative z-10 -mt-9 flex items-start gap-3 px-5">
            <span
              aria-hidden
              className="grid size-[72px] shrink-0 place-items-center rounded-full bg-[var(--honey)] text-[26px] font-bold text-[var(--canopy)] ring-4 ring-[var(--bg)]"
            >
              {name ? initials(name) : ''}
            </span>
            {/* Only the avatar overlaps the photo; the text starts below its edge. */}
            <div className="min-w-0 pt-11">
              <p className="truncate text-lg leading-tight font-bold">{name || 'Your name'}</p>
              <p className="text-[13px] text-[var(--ink-2)]">Your role and sign-in details are managed by an admin.</p>
            </div>
          </div>

          <div className="space-y-6 px-4 pt-6 pb-8 md:px-5">
            <Group title="About">
              <Row id={id('displayName')} label="Display name" required error={errors.displayName} counter={`${draft.displayName.length}/${NAME_MAX}`}>
                <input
                  {...rowInput(id('displayName'), errors.displayName)}
                  autoComplete="name"
                  maxLength={NAME_MAX}
                  value={draft.displayName}
                  onChange={(e) => set({ displayName: e.target.value })}
                  onBlur={touch('displayName')}
                />
              </Row>
            </Group>

            <Group title="Skills and focus areas" note="What you know and what you look for, so other stewards know who to ask.">
              <TagPicker label="Skills" values={draft.skills} options={options.skills} onChange={(skills) => set({ skills })} />
              <TagPicker label="Focus areas" values={draft.focusAreas} options={options.focusAreas} onChange={(focusAreas) => set({ focusAreas })} />
            </Group>

            <Group title="Contact" note="Signed-in members can see these. Email is required, the rest are optional.">
              {SOCIAL_FIELDS.filter(({ key }) => shown.includes(key)).map(({ key, label, kind }) => {
                const Icon = ICON[key];
                return (
                  <Row key={key} id={id(key)} label={label} required={kind === 'email'} error={errors[key]} icon={<Icon size={18} />}>
                    <input
                      {...rowInput(id(key), errors[key])}
                      type={kind === 'email' ? 'email' : kind === 'phone' ? 'tel' : 'url'}
                      inputMode={kind === 'email' ? 'email' : kind === 'phone' ? 'tel' : 'url'}
                      autoComplete={kind === 'email' ? 'email' : kind === 'phone' ? 'tel' : key === 'website' ? 'url' : 'off'}
                      placeholder={PLACEHOLDER[key]}
                      value={draft.socials[key]}
                      onChange={(e) => set({ socials: { ...draft.socials, [key]: e.target.value } })}
                      onBlur={touch(key)}
                    />
                  </Row>
                );
              })}
              {shown.length < SOCIAL_FIELDS.length && (
                <div className="px-4 pt-2.5 pb-3">
                  <p className="text-[13px] font-semibold text-[var(--ink-2)]">Add a link</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SOCIAL_FIELDS.filter(({ key }) => !shown.includes(key)).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setShown((s) => [...s, key]);
                          setAdded(key);
                        }}
                        className={`${btn.secondary} min-h-10 rounded-full px-3 text-[15px]`}
                      >
                        <Plus size={16} aria-hidden />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Group>

            {serverError && !serverError.field && (
              <p role="alert" className="flex items-start gap-2 text-[15px] font-semibold text-[var(--clay-ink)]">
                <AlertCircle size={18} aria-hidden className="mt-0.5 shrink-0" />
                {serverError.message}
              </p>
            )}
            {serverError?.field && (
              <p role="alert" className="sr-only">
                {serverError.message}
              </p>
            )}
          </div>
        </div>

        {/* Thumb zone: the actions never scroll away. */}
        <div className="shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-3" style={{ paddingBottom: 'calc(12px + var(--safe-b))' }}>
          {confirming ? (
            <div role="alert" className="flex flex-col gap-3">
              <p className="text-[15px] font-semibold">Discard your changes?</p>
              <div className="flex gap-3">
                <button ref={keepRef} type="button" onClick={() => setConfirming(false)} className={`${btn.secondary} flex-1`}>
                  Keep editing
                </button>
                <button type="button" onClick={onClose} className={`${btn.secondary} flex-1 border-[var(--clay-ink)] text-[var(--clay-ink)]`}>
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" onClick={requestClose} className={`${btn.secondary} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !dirty} className={`${btn.primary} flex-[2]`}>
                {saving ? (
                  <>
                    <Loader2 size={20} aria-hidden className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          )}
        </div>
      </form>
    </dialog>
  );
}

/* ---------- grouped rows ---------- */

const rowInput = (id: string, error?: string) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-msg` : undefined,
  style: { outline: 'none' },
  className: 'h-10 w-full min-w-0 bg-transparent text-[16px] text-[var(--ink)]',
});

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section>
      <h3 style={HEADING} className="px-1 text-[15px] font-bold">
        {title}
      </h3>
      {note && <p className="mt-0.5 px-1 text-sm text-[var(--ink-2)]">{note}</p>}
      <div className={`${card} mt-2 divide-y divide-[var(--line)] overflow-hidden`}>{children}</div>
    </section>
  );
}

/** One labelled field in a card. Focus shows as a honey bar on the row's edge. */
function Row({
  id,
  label,
  required,
  error,
  counter,
  icon,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  counter?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 px-4 pt-2.5 pb-1.5 focus-within:shadow-[inset_3px_0_0_var(--honey)]">
      {icon && (
        <span aria-hidden className="mt-[26px] shrink-0 text-[var(--ink-2)]">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-[13px] font-semibold text-[var(--ink-2)]">
            {label}
            {required && <span className="font-normal"> (required)</span>}
          </label>
          {counter && (
            <span aria-hidden className="num text-xs text-[var(--ink-2)]">
              {counter}
            </span>
          )}
        </div>
        {children}
        {error && (
          <p id={`${id}-msg`} className="mb-1.5 flex items-start gap-1.5 text-sm font-semibold text-[var(--clay-ink)]">
            <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** Removable chips plus an add field. Enter or a comma adds; Backspace in an empty field removes the last one. */
