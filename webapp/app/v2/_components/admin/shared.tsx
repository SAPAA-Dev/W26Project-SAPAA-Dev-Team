'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronRight, Loader2, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import { invalidate, useApi } from '@/app/v2/_lib/useApi';
import { btn, Sheet, ToastPill } from '@/app/v2/_components/flows/ui';

/* Admin controls live inside the steward screens. The server actions check the role again,
   so this gate only decides what is drawn. */
export function useIsAdmin(): boolean {
  return useApi('me', api.me).data?.role === 'admin';
}

export const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-CA')} ${n === 1 ? one : many}`;

/* ---------- toast: the flows ToastPill, callable from any handler, in the top layer so it shows above open sheets ---------- */

type ToastItem = { id: number; message: string; tone: 'ok' | 'error' };
let toastHost: HTMLElement | null = null;
let showToast: ((t: ToastItem) => void) | null = null;

export function toast(message: string, tone: ToastItem['tone'] = 'ok') {
  if (typeof document === 'undefined') return;
  const item = { id: Date.now(), message, tone };
  if (toastHost?.isConnected && showToast) return showToast(item);
  // First toast (or the page shell was replaced): one small React root of its own, inside .v2 for the tokens.
  showToast = null;
  toastHost = document.createElement('div');
  (document.querySelector('.v2') ?? document.body).append(toastHost);
  createRoot(toastHost).render(<AdminToast first={item} />);
}

function AdminToast({ first }: { first: ToastItem }) {
  const [item, setItem] = useState<ToastItem | null>(first);
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => {
    showToast = setItem;
  }, []);
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    try {
      // Re-show so the region sits above any dialog opened since (top layer order).
      if (el.matches(':popover-open')) el.hidePopover();
      if (item) el.showPopover();
    } catch {
      // No popover support: the region still shows as a fixed element.
    }
    if (!item) return;
    const t = setTimeout(() => setItem(null), 4000);
    return () => clearTimeout(t);
  }, [item]);
  return (
    <div
      ref={region}
      popover="manual"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-auto bottom-[calc(var(--nav-clear,72px)+12px)] m-0 flex w-full justify-center overflow-visible border-0 bg-transparent px-4 py-0"
    >
      {item && <ToastPill key={item.id} message={item.message} tone={item.tone} />}
    </div>
  );
}

/* ---------- menu rows inside an admin sheet ---------- */

export function MenuRow({
  icon: Icon,
  label,
  hint,
  onClick,
  href,
  danger,
  busy,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  busy?: boolean;
  disabled?: boolean;
}) {
  const cls = `press flex min-h-14 w-full [--press-scale:.99] items-center gap-3 rounded-[var(--radius-m)] px-3 py-2.5 text-left hover:bg-[var(--bg-sunken)] active:bg-[var(--bg-sunken)] disabled:cursor-not-allowed disabled:opacity-45 ${
    danger ? 'text-[var(--clay-ink)]' : 'text-[var(--ink)]'
  }`;
  const inner = (
    <>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-[var(--radius-s)] ${
          danger ? 'bg-[color-mix(in_srgb,var(--clay)_16%,transparent)]' : 'bg-[var(--bg-sunken)] text-[var(--forest)]'
        }`}
      >
        {busy ? <Loader2 size={19} aria-hidden className="animate-spin" /> : <Icon size={19} aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-snug font-semibold">{label}</span>
        {hint && <span className="block text-sm leading-snug text-[var(--ink-2)]">{hint}</span>}
      </span>
      {(href || !danger) && <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />}
    </>
  );
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} className={cls}>
      {inner}
    </button>
  );
}

/** A thin rule between groups in a sheet menu. */
export const MenuRule = () => <hr className="my-2 border-[var(--line)]" />;

/* ---------- destructive confirm with impact counts ---------- */

export function Confirm({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  busy,
  error,
  ready = true,
  onConfirm,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  busy: boolean;
  error?: string | null;
  /** False while the impact counts load: the action waits until the admin can see what it touches. */
  ready?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  // Destructive dialogs start on Cancel. The sheet's own effect (a child) has opened the dialog by now.
  useEffect(() => {
    if (open) cancel.current?.focus();
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={() => !busy && onClose()}
      title={title}
      description={description}
      footer={
        <div className="flex gap-3">
          <button ref={cancel} type="button" onClick={onClose} disabled={busy} className={`${btn.secondary} flex-1`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !ready}
            className={`${btn.primary} flex-1 bg-[var(--clay-ink)]! text-[var(--birch)]!`}
          >
            {busy && <Loader2 size={18} aria-hidden className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      }
    >
      {children}
      {error && (
        <p role="alert" className="mt-3 text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
    </Sheet>
  );
}

/** "12 reports, 340 answers": the records an action touches, as a quiet ledger. */
export function ImpactList({ rows, loading }: { rows: [string, number][] | null; loading: boolean }) {
  if (loading || !rows)
    return (
      <div aria-busy="true" className="flex flex-col gap-2 rounded-[var(--radius-m)] bg-[var(--bg-sunken)] p-4">
        <span className="sr-only" role="status">
          Counting connected records
        </span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-4 w-1/2 animate-pulse rounded bg-[var(--line)]" />
        ))}
      </div>
    );
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-[var(--radius-m)] bg-[var(--bg-sunken)] p-4 text-[15px]">
      {rows.map(([label, n]) => (
        <div key={label} className="contents">
          <dt className="text-[var(--ink-2)]">{label}</dt>
          <dd className="num text-right font-bold">{n.toLocaleString('en-CA')}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- small helpers ---------- */

export function downloadFile(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A switch with its label beside it: role="switch" so it reads as on/off. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="press flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-m)] px-1 py-2 text-left [--press-scale:.99] disabled:opacity-45"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold">{label}</span>
        {hint && <span className="block text-sm text-[var(--ink-2)]">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-[var(--dur-2)] ease-[var(--ease-out)] ${checked ? 'bg-[var(--forest)]' : 'bg-[var(--lichen)]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-[var(--surface)] shadow-[0_1px_3px_rgba(18,42,28,0.3)] transition-transform duration-[var(--dur-2)] ease-[var(--ease-out)] ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Refetch what a change on one site touches, on screen and in cache. `site` adds the lists and the map,
 * for changes to the site itself rather than to one of its reports.
 */
export function refreshSite(slug: string | null, { site = false } = {}) {
  const keys = ['reports', 'report:', 'photos', 'admin:archived'];
  if (slug) keys.push(`site:${slug}`, `site-reports:${slug}`, `site-photos:${slug}`, `site-answers:${slug}`, `admin:responses:${slug}`);
  if (site) keys.push('sites', 'admin:', 'boundaries', 'me');
  keys.forEach(invalidate);
}
