'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { animate, useDragControls, useMotionValue, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import type { PanInfo } from 'motion/react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export type Detent = 'peek' | 'half' | 'full';

const PEEK = 163; // grabber + "N sites" header + the first full row, and a sliver of the next to say "more"
const HALF = 0.55; // share of the sheet visible at half
const GRAB = 22; // grabber strip height
const SPRING = { type: 'spring', stiffness: 420, damping: 42, mass: 0.9 } as const;
const ORDER: Detent[] = ['peek', 'half', 'full'];

/** Element height, kept current with a ResizeObserver (transforms don't count). */
export function useHeight(ref: RefObject<HTMLElement | null>) {
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return h;
}

interface Props {
  /** 'card' sizes the sheet to its content and drags down to dismiss. */
  mode: 'list' | 'card';
  /** List header (count, sort). Lives in the drag strip, so it stays visible at peek. */
  header?: ReactNode;
  preview?: ReactNode;
  children: ReactNode;
  /** Top edge at the full detent, in px from the top of the map: just under the floating chrome. */
  top: number;
  /** Height of the map the sheet covers at rest, for camera padding. */
  onCover: (px: number) => void;
  onDismissCard: (viaKeyboard: boolean) => void;
}

/**
 * Trailhead bottom sheet: non-modal, three detents for the list, one fitted detent for a site card.
 * The sheet is always full height and slides on y, so the list can scroll without layout work.
 */
export default function MapSheet({ mode, header, preview, children, top, onCover, onDismissCard }: Props) {
  const sheet = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const H = useHeight(sheet);
  const contentH = useHeight(content);
  const [detent, setDetent] = useState<Detent>('peek');
  const y = useMotionValue(800); // starts below the fold: the first measure springs it up
  const controls = useDragControls();
  const reduce = useReducedMotion();

  const yFor = (d: Detent | 'card') =>
    d === 'full'
      ? 0
      : d === 'half'
        ? Math.round(H * (1 - HALF))
        : d === 'card'
          ? Math.max(0, H - Math.min(H, Math.max(112, GRAB + 44 + contentH)))
          : Math.max(0, H - PEEK);
  const cardExpanded = detent === 'full';
  const resting = mode === 'card' ? cardExpanded ? 'half' : 'card' : detent;
  const target = H ? yFor(resting) : 800;

  const settle = (to: number) => animate(y, to, reduce ? { duration: 0 } : SPRING);

  useEffect(() => {
    if (!H) return;
    // A card that just replaced the list is measured here, after it rendered: contentH (from the observer)
    // still holds the list's height for a frame, which would fling the sheet to full and back.
    const to = target;
    settle(to);
    const bottomGap = Math.max(0, (sheet.current?.parentElement?.clientHeight ?? 0) - (sheet.current?.offsetTop ?? 0) - H);
    onCover(H - to + bottomGap);
    // settle/onCover are stable in effect; the target is what moves the sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, H, mode]);

  const go = (d: Detent) => {
    setDetent(d);
    settle(yFor(mode === 'card' ? d === 'full' ? 'half' : 'card' : d)); // also snaps back when the detent did not change
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (mode === 'card') {
      if (info.offset.y > 90 || info.velocity.y > 600) onDismissCard(false);
      else settle(target);
      return;
    }
    const projected = y.get() + info.velocity.y * 0.18;
    const nearest = ORDER.reduce((a, b) => (Math.abs(yFor(b) - projected) < Math.abs(yFor(a) - projected) ? b : a));
    go(nearest);
  };

  const step = (dir: 1 | -1) => {
    const i = ORDER.indexOf(detent) + dir;
    if (i >= 0 && i < ORDER.length) go(ORDER[i]);
  };

  return (
    <m.section
      ref={sheet}
      aria-label={mode === 'card' ? 'Selected site' : 'Sites'}
      onKeyDown={(event) => {
        if (mode === 'card' && event.key === 'Escape') { event.stopPropagation(); onDismissCard(true); }
      }}
      className="absolute inset-x-0 z-30 flex flex-col rounded-t-[var(--radius-l)] bg-[var(--surface)] shadow-[0_-10px_30px_rgba(18,42,28,0.16)]"
      style={{ top, bottom: 'calc(var(--nav-h) + var(--safe-b))', y }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: mode === 'card' ? target : 0, bottom: Math.max(0, H - 56) }}
      dragElastic={{ top: 0.06, bottom: 0.3 }}
      dragMomentum={false}
      onDragEnd={onDragEnd}
    >
      <div
        className="shrink-0 touch-none select-none"
        onPointerDown={(event) => controls.start(event)}
      >
        <div className="flex justify-center" style={{ height: GRAB }} aria-hidden>
          <span className="mt-2 h-[5px] w-10 rounded-full bg-[var(--lichen)]" />
        </div>
        {mode === 'card' && (
          <div className="flex items-center justify-end gap-2 px-3">
            <button type="button" className="press flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold" aria-expanded={cardExpanded} onClick={() => go(cardExpanded ? 'peek' : 'full')}>
              {cardExpanded ? 'Back to map' : 'Details'}
              {cardExpanded ? <ChevronDown size={18} aria-hidden /> : <ChevronUp size={18} aria-hidden />}
            </button>
            <button type="button" className="press grid size-11 place-items-center rounded-full" aria-label="Close details" onClick={(event) => onDismissCard(event.detail === 0)}><X size={20} aria-hidden /></button>
          </div>
        )}
        {mode === 'list' && (
          <div className="flex items-center gap-2 pr-2 pl-5">
            <div className="min-w-0 flex-1">{header}</div>
            <button
              type="button"
              className="press grid size-11 shrink-0 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--bg-sunken)]"
              aria-label={detent === 'full' ? 'Collapse the list' : 'Expand the list'}
              aria-expanded={detent !== 'peek'}
              onClick={() => go(detent === 'peek' ? 'half' : detent === 'half' ? 'full' : 'peek')}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                e.preventDefault();
                step(e.key === 'ArrowUp' ? 1 : -1);
              }}
            >
              {detent === 'full' ? <ChevronDown size={22} aria-hidden /> : <ChevronUp size={22} aria-hidden />}
            </button>
          </div>
        )}
      </div>

      <div
        className={`min-h-0 flex-1 overscroll-contain ${mode === 'list' || cardExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
        // The part below the screen edge at this detent; padding lets the last rows scroll into view.
        style={{ paddingBottom: mode === 'list' || cardExpanded ? target : 0 }}
        // Tabbing into a peeking list opens it, so focus never lands off screen.
        onFocus={() => mode === 'list' && detent === 'peek' && go('half')}
      >
        <div ref={content}>{mode === 'card' && !cardExpanded ? preview : children}</div>
      </div>
    </m.section>
  );
}
