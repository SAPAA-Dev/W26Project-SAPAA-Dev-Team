'use client';
/* eslint-disable @next/next/no-img-element -- local blob: previews cannot go through next/image */

import { useId } from 'react';
import * as m from 'motion/react-m';
import { AlertCircle, Camera, Check, EyeOff, Info, Lock, Trash2, X } from 'lucide-react';
import MarkdownText from '@/components/MarkdownText';
import type { FormQuestion } from '@/lib/api/v1/types';
import type { DraftAnswer } from '@/app/v2/_components/flows/drafts';
import { questionNumber, nonSpaceLength } from '@/app/v2/_components/flows/format';
import { Field, fieldAria, inputCls } from '@/app/v2/_components/flows/ui';

export interface LocalPhoto {
  id: string;
  file: File;
  url: string;
  caption: string;
  photographer: string;
  identifier: string;
  date: string;
}

export const PHOTOGRAPHER_MAX = 25;
export const IDENTIFIER_MAX = 20;

export const isAnswered = (v: DraftAnswer | undefined) =>
  typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : v === true;

export const isOtherOption = (text: string) => /^other\b/i.test(text.trim());

/**
 * What a question fills itself with. Older form rows carry no autofill, so the date of visit (Q21) and the
 * steward's name (Q13) are recognised by type, key and title.
 */
export function autofillOf(q: FormQuestion): string | null {
  if (q.autofill) return q.autofill;
  if (q.type === 'date' && (/^Q21/i.test(q.key) || /date of (the )?visit/i.test(q.title))) return 'visit_date';
  if (q.type === 'text' && (/^Q13/i.test(q.key) || /steward('s)? name|first and last name/i.test(q.title))) return 'user_name';
  return null;
}

/** What a photo still needs before the report can go. Null when it is complete. */
export function photoProblem(p: LocalPhoto, today: string): string | null {
  const missing = [!p.caption.trim() && 'caption', !p.photographer.trim() && 'photographer', !p.date && 'date'].filter(Boolean);
  if (missing.length) return `add a ${missing.join(' and ')}`;
  if (p.date > today) return 'the date is in the future';
  return null;
}

interface Props {
  q: FormQuestion;
  value: DraftAnswer | undefined;
  other: string;
  onChange: (v: DraftAnswer) => void;
  onOther: (v: string) => void;
  photos: LocalPhoto[];
  onPhotos: (list: LocalPhoto[]) => void;
  siteName: string;
  today: string;
  photographer: string;
  autofilled: boolean;
  error: string | null;
  showErrors: boolean;
  /** Give onHidden to offer "Hide answer from other stewards" (US 1.0.3) on this card. */
  hidden?: boolean;
  onHidden?: (hidden: boolean) => void;
}

/** One question card. Choice questions are a fieldset whose legend is the question. */
export function QuestionCard(props: Props) {
  const { q, error } = props;
  const { text } = questionNumber(q.title, q.key);
  const id = `q-${q.id}`;
  const group = q.type === 'option' || q.type === 'selectall' || q.type === 'image' || q.type === 'agreement';
  const answered = q.type === 'image' ? props.photos.length > 0 : isAnswered(props.value);
  const describedBy = [q.subtext && `${id}-sub`, error && `${id}-msg`].filter(Boolean).join(' ') || undefined;
  const kind = q.type === 'option' ? 'Choose one' : q.type === 'selectall' ? 'Choose all that apply' : null;

  const head = (
    <>
      <span className="mb-1 flex items-center gap-3 text-[13px] font-semibold text-[var(--ink-2)]">
        {q.required && <span>Required</span>}
        {kind && <span className="font-normal">{kind}</span>}
        {answered && (
          <span className="ml-auto inline-flex items-center gap-1 text-[var(--st-recent-ink)]">
            <Check size={15} strokeWidth={3} aria-hidden />
            <span className="sr-only">Answered</span>
          </span>
        )}
      </span>
      <span className="block text-[17px] leading-snug font-bold text-[var(--ink)]">{text}</span>
    </>
  );
  const sub = q.subtext && (
    <div id={`${id}-sub`} className="clear-both mt-1.5 text-[15px] leading-relaxed text-[var(--ink-2)]">
      <MarkdownText content={q.subtext} />
    </div>
  );

  return (
    <section
      id={id}
      className={`scroll-mt-40 rounded-[var(--radius-l)] border bg-[var(--surface)] p-4 md:p-5 ${
        error ? 'border-[var(--clay-ink)]' : 'border-[var(--line)]'
      }`}
    >
      {group ? (
        <fieldset aria-describedby={describedBy} aria-required={q.required || undefined}>
          <legend className="float-left w-full">{head}</legend>
          {sub}
          <div className="clear-both pt-4">
            <Input {...props} id={id} describedBy={describedBy} />
          </div>
        </fieldset>
      ) : (
        <>
          <label htmlFor={`${id}-input`} className="block">
            {head}
          </label>
          {sub}
          <div className="pt-4">
            <Input {...props} id={id} describedBy={describedBy} />
          </div>
        </>
      )}
      {props.onHidden && (
        <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-semibold text-[var(--ink-2)]">
          <input
            type="checkbox"
            checked={props.hidden === true}
            onChange={(e) => props.onHidden?.(e.target.checked)}
            className="size-5 shrink-0 accent-[var(--forest)]"
          />
          <EyeOff size={16} aria-hidden className="shrink-0" />
          Hide answer from other stewards
        </label>
      )}
      {error && (
        <p id={`${id}-msg`} className="mt-3 flex items-start gap-1.5 text-sm font-semibold text-[var(--clay-ink)]">
          <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </section>
  );
}

/** Long labels stack one per row; four or fewer short ones sit two per row, so none is left alone; more wrap. */
function chipLayout(options: { text: string }[]) {
  if (options.some((o) => o.text.length > 22)) return { grid: 'grid gap-2', block: true };
  if (options.length <= 4) return { grid: 'grid grid-cols-2 gap-2', block: true };
  return { grid: 'flex flex-wrap gap-2', block: false };
}

function chipCls(on: boolean, block: boolean) {
  return `press flex min-h-12 cursor-pointer items-center gap-2 border px-4 py-2.5 text-[15px] leading-snug font-semibold select-none [--press-scale:0.98] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--honey)] ${
    block ? 'w-full rounded-[var(--radius-m)]' : 'rounded-full'
  } ${
    on
      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
      : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--ink-2)]'
  }`;
}

/** The check pops in when a chip is chosen: the one motion on this screen besides the step slide. */
function ChipCheck({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <m.span
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      className="-ml-1 inline-flex"
      aria-hidden
    >
      <Check size={17} strokeWidth={3} />
    </m.span>
  );
}

function Input({ q, id, describedBy, ...p }: Props & { id: string; describedBy?: string }) {
  const inputId = `${id}-input`;
  const str = typeof p.value === 'string' ? p.value : '';
  const aria = { 'aria-describedby': describedBy, 'aria-invalid': p.error ? true : undefined, 'aria-required': q.required || undefined };

  switch (q.type) {
    case 'option': {
      const { grid, block } = chipLayout(q.options);
      return (
        <>
          <div className={grid}>
            {q.options.map((o) => {
              const on = str === o.text;
              return (
                <label key={o.id} className={chipCls(on, block)}>
                  <input type="radio" name={id} value={o.text} checked={on} onChange={() => p.onChange(o.text)} className="sr-only" />
                  <ChipCheck on={on} />
                  {o.text}
                </label>
              );
            })}
          </div>
          {str && (
            <button
              type="button"
              onClick={() => {
                p.onChange('');
                document.querySelector<HTMLInputElement>(`#${id} input[type=radio]`)?.focus();
              }}
              className="mt-2 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              <X size={16} aria-hidden />
              Clear choice
            </button>
          )}
        </>
      );
    }

    case 'selectall': {
      const sel = Array.isArray(p.value) ? p.value : [];
      const { grid, block } = chipLayout(q.options);
      const toggle = (t: string) => p.onChange(sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]);
      return (
        <>
          <div className={grid}>
            {q.options.map((o) => {
              const on = sel.includes(o.text);
              return (
                <label key={o.id} className={chipCls(on, block)}>
                  <input type="checkbox" value={o.text} checked={on} onChange={() => toggle(o.text)} className="sr-only" />
                  <ChipCheck on={on} />
                  {o.text}
                </label>
              );
            })}
          </div>
          {sel.some(isOtherOption) && (
            <div className="mt-4">
              <label htmlFor={`${id}-other`} className="mb-1.5 block text-[15px] font-semibold">
                Describe &ldquo;Other&rdquo;
              </label>
              <textarea
                id={`${id}-other`}
                rows={3}
                value={p.other}
                onChange={(e) => p.onOther(e.target.value)}
                className={`${inputCls} min-h-24 resize-y py-3 leading-relaxed`}
              />
            </div>
          )}
        </>
      );
    }

    case 'text': {
      // Account details (email, the steward's name) are one line; everything else is a note.
      const fill = autofillOf(q);
      if (fill === 'user_email' || fill === 'user_name') {
        return (
          <>
            <input
              id={inputId}
              type={fill === 'user_email' ? 'email' : 'text'}
              autoComplete={fill === 'user_email' ? 'email' : 'name'}
              value={str}
              onChange={(e) => p.onChange(e.target.value)}
              className={`${inputCls} h-12`}
              {...aria}
            />
            {p.autofilled && <p className="mt-1.5 text-sm text-[var(--ink-2)]">Filled from your account. You can change it.</p>}
          </>
        );
      }
      return (
        <textarea
          id={inputId}
          rows={4}
          value={str}
          onChange={(e) => p.onChange(e.target.value)}
          className={`${inputCls} min-h-32 resize-y py-3 leading-relaxed`}
          {...aria}
        />
      );
    }

    case 'date':
      return (
        <>
          <input
            id={inputId}
            type="date"
            max={p.today}
            value={str}
            onChange={(e) => p.onChange(e.target.value)}
            className={`${inputCls} h-12 max-w-xs`}
            {...aria}
          />
          {autofillOf(q) === 'visit_date' && p.autofilled && (
            <p className="mt-1.5 text-sm text-[var(--ink-2)]">Set to today. Change it if you visited on another day.</p>
          )}
        </>
      );

    case 'agreement':
      return (
        <label
          className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-m)] border px-4 py-3 text-[16px] font-semibold transition-colors ${
            p.value === true ? 'border-[var(--accent)] bg-[var(--bg-sunken)]' : 'border-[var(--line)]'
          }`}
        >
          <input
            type="checkbox"
            checked={p.value === true}
            onChange={(e) => p.onChange(e.target.checked)}
            className="size-6 shrink-0 accent-[var(--forest)]"
          />
          I agree
        </label>
      );

    case 'site_select':
      return (
        <>
          <div className="relative">
            <input
              id={inputId}
              readOnly
              value={str || p.siteName}
              className={`${inputCls} h-12 border-dashed pr-11`}
              aria-describedby={`${inputId}-hint`}
            />
            <Lock size={18} aria-hidden className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[var(--ink-2)]" />
          </div>
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-[var(--ink-2)]">
            Locked to the site you are inspecting.
          </p>
        </>
      );

    case 'image':
      return <PhotoTiles {...p} q={q} qid={q.id} />;

    default:
      return <p className="text-[15px] text-[var(--ink-2)]">This question type is not supported in the prototype.</p>;
  }
}

function PhotoTiles({
  qid,
  photos,
  onPhotos,
  today,
  photographer,
  showErrors,
}: Props & { qid: number }) {
  const fileId = useId();
  const add = (files: FileList | null) => {
    const picked = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!picked.length) return;
    onPhotos([
      ...photos,
      ...picked.map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        caption: '',
        photographer,
        identifier: '',
        date: today,
      })),
    ]);
  };
  const update = (pid: string, patch: Partial<LocalPhoto>) => onPhotos(photos.map((x) => (x.id === pid ? { ...x, ...patch } : x)));
  const remove = (pid: string) => {
    const gone = photos.find((x) => x.id === pid);
    if (gone) URL.revokeObjectURL(gone.url);
    onPhotos(photos.filter((x) => x.id !== pid));
  };
  // Limits ignore spaces, like the legacy forms: extra characters are simply not taken.
  const limited = (v: string, max: number) => nonSpaceLength(v) <= max;

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-[var(--radius-m)] bg-[var(--bg-sunken)] px-3 py-2.5 text-sm text-[var(--ink-2)]">
        <Info size={16} aria-hidden className="mt-0.5 shrink-0" />
        Photo upload is wired in the full build. In this prototype, photos stay on this device as previews and are not
        sent with the report.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {photos.map((ph, i) => {
          const f = (name: string) => `${ph.id}-${name}`;
          const err = (missing: boolean, msg: string) => (showErrors && missing ? msg : null);
          const captionErr = err(!ph.caption.trim(), 'Add a caption.');
          const whoErr = err(!ph.photographer.trim(), 'Add who took the photo.');
          const dateErr = err(!ph.date, 'Add the date.') ?? (ph.date > today ? 'The date is in the future.' : null);
          return (
            <li key={ph.id} className="overflow-hidden rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg)]">
              <div className="relative aspect-[4/3] bg-[var(--bg-sunken)]">
                <img src={ph.url} alt={`Photo ${i + 1}, ${ph.file.name}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(ph.id)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-[rgba(18,42,28,0.78)] text-[var(--birch)]"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
              <div className="space-y-3 p-3">
                <Field id={f('caption')} label="Caption" required error={captionErr} hint="What it shows and why it matters.">
                  <textarea
                    {...fieldAria(f('caption'), captionErr, true)}
                    rows={2}
                    value={ph.caption}
                    onChange={(e) => update(ph.id, { caption: e.target.value })}
                    className={`${inputCls} resize-y py-2.5`}
                  />
                </Field>
                <Field
                  id={f('who')}
                  label="Photographer"
                  required
                  error={whoErr}
                  counter={`${nonSpaceLength(ph.photographer)}/${PHOTOGRAPHER_MAX}`}
                  hint={`Up to ${PHOTOGRAPHER_MAX} characters, spaces not counted.`}
                >
                  <input
                    {...fieldAria(f('who'), whoErr, true)}
                    autoComplete="name"
                    value={ph.photographer}
                    onChange={(e) => limited(e.target.value, PHOTOGRAPHER_MAX) && update(ph.id, { photographer: e.target.value })}
                    className={`${inputCls} h-12`}
                  />
                </Field>
                <Field
                  id={f('ident')}
                  label="Identifier"
                  counter={`${nonSpaceLength(ph.identifier)}/${IDENTIFIER_MAX}`}
                  hint={`A short label, up to ${IDENTIFIER_MAX} characters.`}
                >
                  <input
                    {...fieldAria(f('ident'), null, true)}
                    value={ph.identifier}
                    onChange={(e) => limited(e.target.value, IDENTIFIER_MAX) && update(ph.id, { identifier: e.target.value })}
                    className={`${inputCls} h-12`}
                  />
                </Field>
                <Field id={f('date')} label="Date taken" required error={dateErr}>
                  <input
                    {...fieldAria(f('date'), dateErr)}
                    type="date"
                    max={today}
                    value={ph.date}
                    onChange={(e) => update(ph.id, { date: e.target.value })}
                    className={`${inputCls} h-12`}
                  />
                </Field>
              </div>
            </li>
          );
        })}
        <li>
          <label
            htmlFor={fileId}
            className="flex h-full min-h-36 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[var(--radius-m)] border-2 border-dashed border-[var(--line)] px-4 py-6 text-center text-[var(--ink-2)] transition-colors hover:border-[var(--ink-2)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--honey)]"
          >
            <Camera size={28} aria-hidden className="text-[var(--ink)]" />
            <span className="text-[16px] font-bold text-[var(--ink)]">{photos.length ? 'Add more photos' : 'Add photos'}</span>
            <span className="text-sm">Take a picture or choose from your library</span>
            <input
              id={fileId}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              data-question={qid}
              onChange={(e) => {
                add(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        </li>
      </ul>
    </div>
  );
}
