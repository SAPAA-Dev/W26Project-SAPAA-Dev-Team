'use client';
/* eslint-disable @next/next/no-img-element -- local blob: previews */

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Check, ImagePlus, Info, X } from 'lucide-react';
import { Field, Sheet, btn, fieldAria, inputCls } from '@/app/v2/_components/flows/ui';
import { nonSpaceLength, todayLocal } from '@/app/v2/_components/flows/format';

const PHOTOGRAPHER_MAX = 25;
const IDENTIFIER_MAX = 20;
const FORM_ID = 'add-photos-form';

/** The homepage upload, as a sheet: same fields and limits. Nothing is sent from the prototype. */
export function AddPhotosSheet({
  open,
  onClose,
  siteNames,
  photographer,
}: {
  open: boolean;
  onClose: () => void;
  siteNames: string[];
  photographer: string;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add photos"
      description="Photos from a site visit, outside an inspection report."
      footer={
        <div className="flex flex-col gap-2">
          <p className="flex items-start gap-2 text-sm text-[var(--ink-2)]">
            <Info size={16} aria-hidden className="mt-0.5 shrink-0" />
            Uploads land in the full build. For now this checks your details and sends nothing.
          </p>
          <button type="submit" form={FORM_ID} className={btn.primary}>
            Upload photos
          </button>
        </div>
      }
    >
      <AddPhotosForm siteNames={siteNames} photographer={photographer} />
    </Sheet>
  );
}

type Errors = Partial<Record<'files' | 'site' | 'date' | 'who' | 'ident' | 'caption', string>>;

function AddPhotosForm({ siteNames, photographer }: { siteNames: string[]; photographer: string }) {
  const uid = useId();
  const f = (name: string) => `${uid}-${name}`;
  const [today] = useState(todayLocal);
  const [files, setFiles] = useState<{ id: string; file: File; url: string }[]>([]);
  const filesRef = useRef(files);
  const [site, setSite] = useState('');
  const [date, setDate] = useState(today);
  const [who, setWho] = useState(photographer);
  const [ident, setIdent] = useState('');
  const [caption, setCaption] = useState('');
  const [checked, setChecked] = useState(false);
  const [ready, setReady] = useState<string | null>(null);

  const setFileList = (next: typeof files) => {
    filesRef.current = next;
    setFiles(next);
  };
  useEffect(() => {
    const ref = filesRef;
    return () => ref.current.forEach((x) => URL.revokeObjectURL(x.url));
  }, []);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!files.length) e.files = 'Choose at least one photo.';
    const match = siteNames.find((n) => n.toLowerCase() === site.trim().toLowerCase());
    if (!site.trim()) e.site = 'Choose the site these photos are from.';
    else if (siteNames.length && !match) e.site = 'Pick a site from the list.';
    if (!date) e.date = 'Add the date of the visit.';
    else if (date > today) e.date = 'The date is in the future.';
    if (!who.trim()) e.who = 'Add who took the photos.';
    if (!ident.trim()) e.ident = 'Add a short identifier.';
    if (!caption.trim()) e.caption = 'Add a caption.';
    return e;
  };
  // After the first attempt, errors update as the steward fixes them.
  const live: Errors = checked ? validate() : {};

  const submit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const e = validate();
    setChecked(true);
    const first = (Object.keys(e) as (keyof Errors)[])[0];
    if (first) {
      setReady(null);
      document.getElementById(f(first))?.focus();
      return;
    }
    const n = files.length;
    setReady(`${n} ${n === 1 ? 'photo' : 'photos'} for ${site.trim()} ${n === 1 ? 'is' : 'are'} ready. Uploads land in the full build, so nothing was sent.`);
  };

  return (
    <form id={FORM_ID} noValidate onSubmit={submit} className="space-y-5 pt-1">
      <div>
        <p className="mb-1.5 text-[15px] font-semibold">
          Photos <span className="font-normal text-[var(--ink-2)]">(required)</span>
        </p>
        <ul className="grid grid-cols-3 gap-2">
          {files.map((x, i) => (
            <li key={x.id} className="relative aspect-square overflow-hidden rounded-[var(--radius-s)] bg-[var(--bg-sunken)]">
              <img src={x.url} alt={`Photo ${i + 1}, ${x.file.name}`} className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => {
                  URL.revokeObjectURL(x.url);
                  setFileList(files.filter((y) => y.id !== x.id));
                }}
                className="absolute top-1 right-1 grid size-11 place-items-center rounded-full bg-[rgba(18,42,28,0.78)] text-[var(--birch)]"
              >
                <X size={18} aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <label
              htmlFor={f('files')}
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-s)] border-2 border-dashed text-center text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--honey)] ${
                live.files ? 'border-[var(--clay-ink)]' : 'border-[var(--line)]'
              }`}
            >
              <ImagePlus size={24} aria-hidden />
              {files.length ? 'Add more' : 'Choose photos'}
              <input
                {...fieldAria(f('files'), live.files)}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []).filter((x) => x.type.startsWith('image/'));
                  setFileList([...files, ...picked.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))]);
                  e.target.value = '';
                }}
              />
            </label>
          </li>
        </ul>
        {live.files && (
          <p id={`${f('files')}-msg`} className="mt-1.5 text-sm font-semibold text-[var(--clay-ink)]">
            {live.files}
          </p>
        )}
        <p className="mt-1.5 text-sm text-[var(--ink-2)]">The details below apply to every photo in this batch.</p>
      </div>

      <Field id={f('site')} label="Site" required error={live.site} hint="Start typing a site name.">
        <input
          {...fieldAria(f('site'), live.site, true)}
          list={f('sites')}
          autoComplete="off"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          className={`${inputCls} h-12`}
        />
        <datalist id={f('sites')}>
          {siteNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={f('date')} label="Date of visit" required error={live.date}>
          <input {...fieldAria(f('date'), live.date)} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} h-12`} />
        </Field>
        <Field
          id={f('who')}
          label="Photographer"
          required
          error={live.who}
          counter={`${nonSpaceLength(who)}/${PHOTOGRAPHER_MAX}`}
          hint="Who owns the digital file."
        >
          <input
            {...fieldAria(f('who'), live.who, true)}
            autoComplete="name"
            value={who}
            onChange={(e) => nonSpaceLength(e.target.value) <= PHOTOGRAPHER_MAX && setWho(e.target.value)}
            className={`${inputCls} h-12`}
          />
        </Field>
      </div>

      <Field
        id={f('ident')}
        label="Identifier"
        required
        error={live.ident}
        counter={`${nonSpaceLength(ident)}/${IDENTIFIER_MAX}`}
        hint={`A short label, up to ${IDENTIFIER_MAX} characters (spaces not counted).`}
      >
        <input
          {...fieldAria(f('ident'), live.ident, true)}
          value={ident}
          onChange={(e) => nonSpaceLength(e.target.value) <= IDENTIFIER_MAX && setIdent(e.target.value)}
          className={`${inputCls} h-12`}
        />
      </Field>

      <Field id={f('caption')} label="Caption" required error={live.caption} hint="What it is and why it matters.">
        <textarea
          {...fieldAria(f('caption'), live.caption, true)}
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={`${inputCls} resize-y py-3 leading-relaxed`}
        />
      </Field>

      <div role="status">
        {ready && (
          <p className="flex items-start gap-2 rounded-[var(--radius-m)] border border-[var(--moss)] bg-[var(--bg)] p-3 text-[15px] font-semibold">
            <Check size={18} strokeWidth={3} aria-hidden className="mt-0.5 shrink-0 text-[var(--st-recent-ink)]" />
            {ready}
          </p>
        )}
      </div>
    </form>
  );
}
