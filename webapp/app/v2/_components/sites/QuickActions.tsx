import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}

/** The TD-style action row: labelled icon tiles in equal columns on a raised card; `primary` marks the lead one. */
export default function QuickActions({ items, label }: { items: QuickAction[]; label: string }) {
  return (
    <ul
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col rounded-[var(--radius-l)] bg-[var(--surface)] p-2 shadow-[0_1px_2px_rgba(18,42,28,0.08),0_12px_32px_rgba(18,42,28,0.14)]"
    >
      {items.map(({ label: text, icon: Icon, href, external, onClick, primary, disabled }) => {
        const cls =
          'press flex min-h-[84px] w-full flex-col items-center justify-center gap-1.5 rounded-[var(--radius-m)] px-1 text-center text-[var(--ink)] hover:bg-[var(--bg)] active:bg-[var(--bg-sunken)] disabled:cursor-not-allowed disabled:opacity-40';
        const inner = (
          <>
            <span
              className={`grid size-12 place-items-center rounded-[var(--radius-m)] ${
                primary ? 'bg-[var(--forest)] text-[var(--birch)]' : 'bg-[var(--bg-sunken)] text-[var(--forest)]'
              }`}
            >
              <Icon size={22} aria-hidden />
            </span>
            <span className="text-[13px] font-semibold leading-4">{text}</span>
          </>
        );
        return (
          <li key={text}>
            {href && !disabled ? (
              external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <Link href={href} className={cls}>
                  {inner}
                </Link>
              )
            ) : (
              <button type="button" onClick={onClick} disabled={disabled} className={cls}>
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
