'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Fragment, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Check, Search, X } from 'lucide-react';
import { ApiError } from '@/lib/api/v1/client';
import PhotoHero from '../sites/PhotoHero';
import { HEADING } from '../sites/ui';
import { naturalColor } from '../site/Naturalness';

/* ---------- tokens as classes (the site page's language) ---------- */

/** `.press` (forest.css) gives every button the same squeeze and colour transitions, so no transition-* here. */
export const btn = {
  primary:
    'press inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-m)] bg-[var(--accent)] px-5 text-[16px] font-bold text-[var(--on-accent)] disabled:cursor-not-allowed disabled:opacity-45',
  secondary:
    'press inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] px-5 text-[16px] font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45',
  /** Honey on canopy: the deck's call to action on dark surfaces. */
  onDark:
    'press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--honey)] px-5 text-[16px] font-bold text-[var(--canopy)]',
  onDarkQuiet:
    'press inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--sage)]/50 px-5 text-[16px] font-semibold text-[var(--birch)]',
  /** Round icon or label button on the photo hero (Back, Settings, Edit). */
  onPhoto:
    'press inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-[rgba(18,42,28,0.55)] text-[15px] font-semibold text-[var(--birch)] hover:bg-[var(--forest)]',
};

/** The card every list and group sits in, as on the site page. */
export const card = 'rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)]';
/** The raised card that overlaps a hero (QuickActions). */
export const raised = 'shadow-[0_1px_2px_rgba(18,42,28,0.08),0_12px_32px_rgba(18,42,28,0.14)]';
/** Hero title type: the site page's h1. */
export const heroTitle =
  'mt-2 text-[32px] leading-[1.05] font-bold tracking-[-0.01em] text-[var(--birch)] [font-stretch:87.5%] md:text-5xl';

/** Pill toggle, the same one the Sites query bar uses. */
export const chip = (on: boolean) =>
  `press flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${
    on
      ? 'border-transparent bg-[var(--accent)] text-[var(--on-accent)]'
      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--bg-sunken)]'
  }`;

/** 16px text so iOS does not zoom on focus. Colours are explicit: the legacy !important rules otherwise inherit birch on dark headers. */
export const inputCls =
  'block w-full rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[16px] leading-normal text-[var(--ink)] outline-none transition-colors focus:border-[var(--forest)] aria-[invalid=true]:border-[var(--clay-ink)]';

/** Space under scrolling content so the tab bar (or md+ pill) never covers it, and the last .reveal finishes (needs 120px). */
export const tabBarPadding = { paddingBottom: 'calc(var(--nav-clear) + 64px)' };

/* ---------- small hooks ---------- */

/** A clock for "saved 4 s ago" labels. Pass null to stop ticking. */
export function useNow(intervalMs: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!intervalMs) return;
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** One search param as state, so filters survive Back and can be shared as links. */
export function useUrlParam(key: string, fallback = ''): [string, (v: string) => void] {
  const params = useSearchParams();
  const pathname = usePathname();
  const set = (v: string) => {
    const p = new URLSearchParams(window.location.search);
    if (v && v !== fallback) p.set(key, v);
    else p.delete(key);
    const s = p.toString();
    window.history.replaceState(null, '', s ? `${pathname}?${s}` : pathname);
  };
  return [params.get(key) ?? fallback, set];
}

/* ---------- type ---------- */

/** Honey eyebrow. On light paper honey fails contrast, so it darkens to the honey ink. */
export function Eyebrow({ children, light = false, className = '' }: { children: ReactNode; light?: boolean; className?: string }) {
  return (
    <p className={`eyebrow ${className}`} style={light ? { color: 'var(--st-due-ink)' } : undefined}>
      {children}
    </p>
  );
}

export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} style={HEADING} className="text-lg font-bold">
      {children}
    </h2>
  );
}

/* ---------- page chrome ---------- */

/**
 * The site page's photo hero for a top-level page: a top row (back on the left, actions on the right),
 * then eyebrow, title and sub-line at the bottom. `children` is a sticky toolbar on paper below the hero.
 */
export function PageHeader({
  eyebrow,
  title,
  sub,
  back,
  action,
  wide = false,
  children,
}: {
  /** A plain string. Undefined while it loads (a shimmer bar holds its place); null for none. */
  eyebrow?: string | null;
  title: ReactNode;
  sub?: ReactNode;
  back?: ReactNode;
  action?: ReactNode;
  wide?: boolean;
  children?: ReactNode;
}) {
  const width = wide ? 'max-w-6xl' : 'max-w-3xl';
  return (
    <>
      <PhotoHero className="pb-8 md:pb-10">
        <div className={`mx-auto ${width} px-5 pt-[max(12px,env(safe-area-inset-top))] md:px-8`}>
          <div className="flex min-h-11 items-center justify-between gap-2">
            {back ?? <span />}
            {action && <div className="flex items-center gap-2">{action}</div>}
          </div>
          <div className="mt-10 md:mt-16">
            {eyebrow ? (
              <p className="eyebrow">{eyebrow}</p>
            ) : eyebrow === undefined ? (
              <span aria-hidden className="block h-[15px] w-32 animate-pulse rounded bg-white/20" />
            ) : null}
            <h1 style={HEADING} className={heroTitle}>
              {title}
            </h1>
            {sub && <p className="mt-1.5 text-[15px] text-[var(--sage)]">{sub}</p>}
          </div>
        </div>
      </PhotoHero>
      {children && (
        <div className="sticky top-0 z-20 bg-[var(--bg)]">
          <div className={`mx-auto ${width} flex flex-col gap-2 px-4 py-3 md:px-8`}>{children}</div>
        </div>
      )}
    </>
  );
}

/** Pill search, the same shape as the Sites query bar. */
export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="flex h-12 min-w-0 grow items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] pr-1 pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--honey)]">
      <Search size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ outline: 'none' }}
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[var(--ink)] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            ref.current?.focus();
          }}
          aria-label="Clear search"
          className="grid size-11 shrink-0 place-items-center rounded-full text-[var(--ink-2)] hover:text-[var(--ink)]"
        >
          <X size={18} aria-hidden />
        </button>
      )}
    </label>
  );
}

/** Two or three mutually exclusive views: the Sites List|Map toggle. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex h-12 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] p-[3px]">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`min-w-16 rounded-full px-4 text-sm font-semibold transition-colors duration-[var(--dur-1)] ${
            value === v ? 'bg-[var(--accent)] text-[var(--on-accent)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/* ---------- sheet (native <dialog>: focus trap, Escape and inert page for free) ---------- */

/**
 * Enter slides up over --dur-3; exit runs over --dur-3-out (about 65%), because the closed state carries the
 * shorter duration. Content stays mounted while it slides out and remounts fresh on every open.
 */
export const SHEET_MOTION =
  'transition-discrete [transition-property:translate,opacity,display,overlay] duration-[var(--dur-3-out)] ease-[var(--ease-out)] open:duration-[var(--dur-3)] ' +
  'translate-y-full open:translate-y-0 starting:open:translate-y-full ' +
  'md:translate-y-3 md:opacity-0 md:open:translate-y-0 md:open:opacity-100 md:starting:open:translate-y-3 md:starting:open:opacity-0 ' +
  'backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0 backdrop:transition-discrete backdrop:[transition-property:opacity,display,overlay] backdrop:duration-[210ms]';

/** Remount key that changes each time `open` turns true, so forms start fresh. */
export function useOpenKey(open: boolean) {
  const [prev, setPrev] = useState(open);
  const [key, setKey] = useState(0);
  if (open !== prev) {
    setPrev(open);
    if (open) setKey((k) => k + 1);
  }
  return key;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const key = useOpenKey(open);
  useDialog(ref, open);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-[var(--radius-l)] bg-[var(--surface)] p-0 text-[var(--ink)] shadow-[0_-12px_48px_rgba(10,24,16,0.28)] backdrop:bg-[rgba(10,24,16,0.55)] flex-col open:flex md:m-auto md:max-h-[86dvh] md:max-w-lg md:rounded-[var(--radius-l)] ${SHEET_MOTION}`}
    >
      <Fragment key={key}>
        <div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--lichen)] md:hidden" />
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-3 pb-3 md:pt-5">
          <div className="min-w-0">
            <h2 id={titleId} style={HEADING} className="text-[22px] leading-tight font-bold">
              {title}
            </h2>
            {description && <p className="mt-1 text-[15px] text-[var(--ink-2)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press -mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--bg-sunken)]"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-[var(--line)] px-5 pt-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </Fragment>
    </dialog>
  );
}


/** Opens a <dialog> as a modal and locks page scroll while it is open. */
export function useDialog(ref: React.RefObject<HTMLDialogElement | null>, open: boolean) {
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = '';
    };
  }, [ref, open]);
}

/* ---------- toast ---------- */

/** A message that clears itself after 4 s. */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);
  return [message, setMessage] as const;
}

/** The one toast look: a canopy pill that rises in. Admin tools reuse it (admin/shared.tsx toast()). */
export function ToastPill({ message, tone = 'ok' }: { message: string; tone?: 'ok' | 'error' }) {
  return (
    <p className="inline-flex max-w-[min(92vw,440px)] items-center gap-2.5 rounded-[var(--radius-l)] bg-[var(--canopy)] py-2.5 pr-5 pl-2.5 text-[15px] font-semibold text-[var(--birch)] shadow-[0_8px_28px_rgba(10,24,16,0.3)] transition-[translate,opacity] duration-[var(--dur-3)] ease-[var(--ease-out)] starting:translate-y-2 starting:opacity-0">
      <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full text-[var(--canopy)] ${tone === 'error' ? 'bg-[var(--clay)]' : 'bg-[var(--moss)]'}`}>
        {tone === 'error' ? <AlertCircle size={16} strokeWidth={3} /> : <Check size={16} strokeWidth={3} />}
      </span>
      {message}
    </p>
  );
}

/** Canopy pill above the tab bar. The live region is always mounted so screen readers hear the change. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(var(--nav-clear) + 12px)' }}
    >
      {message && <ToastPill message={message} />}
    </div>
  );
}

/**
 * Edge fade for a horizontal chip rail (forest.css .edge-fade), as on the Sites query bar: spread the result on
 * the scrolling element (with the edge-fade class). The edge with more chips fades out.
 */
export function useEdgeFade<T extends HTMLElement>() {
  const [more, setMore] = useState({ start: false, end: false });
  const measure = useCallback((el: HTMLElement) => {
    const start = el.scrollLeft > 2;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
  }, []);
  // The rail resizes with the window; its children resize as counts load or change.
  const ref = useCallback(
    (el: T | null) => {
      if (!el) return;
      const ro = new ResizeObserver(() => measure(el));
      ro.observe(el);
      for (const c of el.children) ro.observe(c);
      return () => ro.disconnect();
    },
    [measure],
  );
  return {
    ref,
    onScroll: (e: React.UIEvent<T>) => measure(e.currentTarget),
    'data-more-start': more.start || undefined,
    'data-more-end': more.end || undefined,
  };
}

/* ---------- form field ---------- */

/** Label above, then the control, then a hint or the error (the control points at it with aria-describedby). */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  counter?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-semibold">
          {label}
          {required && <span className="font-normal text-[var(--ink-2)]"> (required)</span>}
        </label>
        {counter && (
          <span aria-hidden className="num shrink-0 text-xs text-[var(--ink-2)]">
            {counter}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-[var(--clay-ink)]">
          <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-1.5 text-sm text-[var(--ink-2)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props that tie a control to its Field message. */
export const fieldAria = (id: string, error?: string | null, hint?: unknown) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error || hint ? `${id}-msg` : undefined,
});

/* ---------- states ---------- */

export function ErrorState({ title, error, onRetry }: { title: string; error: Error; onRetry?: () => void }) {
  const signedOut = error instanceof ApiError && error.status === 401;
  return (
    <div role="alert" className={`${card} p-5`}>
      <p className="flex items-center gap-2 text-[17px] font-bold">
        <AlertCircle size={20} aria-hidden className="shrink-0 text-[var(--clay-ink)]" />
        {title}
      </p>
      <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">{error.message}</p>
      {signedOut ? (
        <Link href="/login" className={`${btn.primary} mt-4`}>
          Sign in
        </Link>
      ) : (
        onRetry && (
          <button type="button" onClick={onRetry} className={`${btn.secondary} mt-4`}>
            Try again
          </button>
        )
      )}
    </div>
  );
}

export function ListSkeleton({ label, rows = 6 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" className={`${card} overflow-hidden`}>
      <span className="sr-only" role="status">
        {label}
      </span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 border-b border-[var(--line)] px-4 py-4 last:border-0">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-[var(--bg-sunken)]" />
            <div className="h-3 w-3/4 rounded bg-[var(--bg-sunken)]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-[var(--bg-sunken)]" />
        </div>
      ))}
    </div>
  );
}

/** Same card as the site page's empty lists: a direction, not a mood. */
export function EmptyState({ title, body, icon, children }: { title: string; body?: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className={`${card} px-6 py-10 text-center`}>
      {icon && (
        <span aria-hidden className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[var(--bg-sunken)] text-[var(--forest)]">
          {icon}
        </span>
      )}
      <p className="text-base font-bold">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-[40ch] text-sm text-[var(--ink-2)]">{body}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/* ---------- data bits ---------- */

/** Naturalness 1 (poor) to 4 (excellent): a dot on the one naturalness scale, the label so colour is never alone. */
export function NaturalnessPill({ value }: { value: { score: number; label: string } | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--bg-sunken)] px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap">
      <span aria-hidden className="size-2 rounded-full" style={{ background: naturalColor(value.score) ?? undefined }} />
      {value.label}
    </span>
  );
}
