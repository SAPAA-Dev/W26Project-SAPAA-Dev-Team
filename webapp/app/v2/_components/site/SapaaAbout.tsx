'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Bird, BookOpen, Footprints, History, Leaf, Ruler, type LucideIcon } from 'lucide-react';
import { getSapaaInfo, SAPAA_GENERAL, SAPAA_LIST_URL, type HighlightKind } from '@/lib/sapaa/siteInfo';
import { fmtDate, HEADING } from '../sites/ui';

const ICON: Record<HighlightKind, LucideIcon> = {
  area: Ruler,
  habitat: Leaf,
  wildlife: Bird,
  access: Footprints,
  history: History,
};

const CARD = 'reveal mt-4 rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--surface)]';
// .eyebrow is honey, too light for small text on a light card; the due ink is the honey that passes 4.5:1.
const EYEBROW = { color: 'var(--st-due-ink)' };
const LINK =
  'press inline-flex min-h-11 items-center gap-1 text-[15px] font-bold text-[var(--ink)] underline-offset-4 hover:underline';

/** The bundled copy uses typewriter apostrophes; the page sets curly ones. */
const curly = (s: string) => s.replace(/'/g, '’');

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
      {children}
      <ArrowUpRight size={16} aria-hidden className="text-[var(--ink-2)]" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Four lines on a phone, with a toggle only when the text really runs longer. */
function Summary({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const ro = new ResizeObserver(() => setLong(el.scrollHeight > el.clientHeight + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);
  return (
    <>
      <p ref={ref} id={id} className={`mt-2 text-[15px] leading-relaxed ${open ? '' : 'line-clamp-4'}`}>
        {text}
      </p>
      {(long || open) && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="press -mt-1 min-h-11 text-[15px] font-semibold text-[var(--ink-2)] underline underline-offset-4 hover:text-[var(--ink)]"
        >
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  );
}

/**
 * "About this area": a paraphrase of the site's page on sapaastewards.com, bundled as static data.
 * `hasArea`: the site record has its own hectares (shown in the hero), so the bundled area line is dropped
 * rather than show a second, different number.
 */
export default function SapaaAbout({ siteName, hasArea = false }: { siteName: string; hasArea?: boolean }) {
  const info = getSapaaInfo(siteName);

  if (!info)
    return (
      <section aria-labelledby="sapaa-about" className={`${CARD} flex gap-3 px-4 py-4`}>
        <BookOpen size={20} aria-hidden className="mt-0.5 shrink-0 text-[var(--moss)]" />
        <div className="min-w-0">
          <p id="sapaa-about" className="eyebrow" style={EYEBROW}>
            From SAPAA Stewards
          </p>
          <p className="mt-1.5 text-[14px] leading-snug text-[var(--ink-2)]">
            SAPAA’s website has no page for this site yet. {curly(SAPAA_GENERAL.summary.split('. ')[0])}.
          </p>
          <OutLink href={SAPAA_LIST_URL}>Browse SAPAA’s protected areas</OutLink>
        </div>
      </section>
    );

  const parks = info.source === 'albertaparks';
  const highlights = info.highlights.filter((h) => !(hasArea && h.kind === 'area'));
  return (
    <section aria-labelledby="sapaa-about" className={`${CARD} px-5 pt-5 pb-4`}>
      <p className="eyebrow" style={EYEBROW}>
        {parks ? 'From Alberta Parks' : 'From SAPAA Stewards'}
      </p>
      <h2 id="sapaa-about" style={HEADING} className="mt-1.5 text-lg leading-tight font-bold">
        About this area
      </h2>
      <Summary text={curly(info.summary)} />

      {highlights.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {highlights.map((h) => {
            const Icon = ICON[h.kind];
            return (
              <li key={h.text} className="flex gap-2.5 text-[14px] leading-snug text-[var(--ink-2)]">
                <Icon size={16} aria-hidden className="mt-px shrink-0 text-[var(--moss)]" />
                {curly(h.text)}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3">
        <OutLink href={info.sourceUrl}>Read more on {parks ? 'albertaparks.ca' : 'sapaastewards.com'}</OutLink>
      </div>
      <p className="mt-2 border-t border-[var(--line)] pt-3 text-[12px] text-[var(--ink-2)]">
        Information from {parks ? 'Alberta Parks’' : 'SAPAA’s'} website, checked {fmtDate(info.lastChecked)}.
        {parks && ' SAPAA has no page for this park yet.'}
      </p>
    </section>
  );
}
