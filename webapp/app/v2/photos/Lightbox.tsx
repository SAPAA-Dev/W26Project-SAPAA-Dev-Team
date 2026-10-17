'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import * as m from 'motion/react-m';
import MotionProvider from '@/app/v2/_lib/MotionProvider';
import { CalendarDays, Camera, ChevronLeft, ChevronRight, MapPin, Tag, X } from 'lucide-react';
import type { Photo } from '@/lib/api/v1/types';
import { formatDate, siteHref } from '@/app/v2/_components/flows/format';
import { btn, useDialog } from '@/app/v2/_components/flows/ui';
import { AdminPhotoActions } from '@/app/v2/_components/admin/lazy';

const PILL =
  'inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[rgba(169,191,163,0.25)] bg-[rgba(18,42,28,0.85)] px-3 text-[13px] font-semibold text-[var(--birch)]';

/**
 * Full-screen viewer on a native modal <dialog>: arrows, swipe, Escape, and focus returns to the tile.
 * Details float as small pills over a soft scrim at the foot of the photo.
 */
export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: Photo[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index !== null && index < photos.length;
  useDialog(ref, open);
  // Keep the last photo on screen while the dialog fades out.
  const [shown, setShown] = useState(index ?? 0);
  if (open && index !== shown) setShown(index);
  const i = Math.min(shown, photos.length - 1);
  const p = photos[i];
  const go = (d: number) => {
    const to = i + d;
    if (open && to >= 0 && to < photos.length) onIndex(to);
  };
  const nav = `${btn.onPhoto} absolute top-1/2 -translate-y-1/2 disabled:pointer-events-none disabled:opacity-0`;

  return (
    <MotionProvider>
      <dialog
        ref={ref}
        aria-label={p ? `Photo ${i + 1} of ${photos.length}` : 'Photo'}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-[var(--canopy)] p-0 text-[var(--birch)] opacity-0 transition-discrete [transition-property:opacity,display,overlay] duration-[var(--dur-2-out)] ease-[var(--ease-out)] backdrop:bg-black open:opacity-100 open:duration-[var(--dur-3)] starting:open:opacity-0"
      >
        {p && (
          <div className="relative size-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <m.img
                key={`${p.kind}-${p.id}`}
                src={p.url}
                alt={p.caption || p.identifier || `Photo from ${p.siteName ?? 'an unknown site'}`}
                draggable={false}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
                className="max-h-full max-w-full touch-pan-y object-contain select-none"
              />
            </div>

            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
              <button type="button" onClick={onClose} aria-label="Close photo" className={btn.onPhoto}>
                <X size={22} aria-hidden />
              </button>
              <p aria-live="polite" className={`${PILL} num`}>
                {i + 1} of {photos.length}
              </p>
            </div>

            <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous photo" className={`${nav} left-3`}>
              <ChevronLeft size={24} aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} disabled={i === photos.length - 1} aria-label="Next photo" className={`${nav} right-3`}>
              <ChevronRight size={24} aria-hidden />
            </button>

            {/* The photo scrim, as on the hero: the only gradient in Boreal. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 pt-24"
              style={{
                background: 'linear-gradient(0deg, rgba(18,42,28,0.94) 0%, rgba(18,42,28,0.7) 50%, rgba(18,42,28,0) 100%)',
                paddingBottom: 'calc(20px + var(--safe-b))',
              }}
            >
              <div className="pointer-events-auto mx-auto max-w-3xl px-5">
                {p.caption && <p className="max-w-[60ch] text-[16px] leading-relaxed">{p.caption}</p>}
                <ul aria-label="Photo details" className={`flex flex-wrap gap-2 ${p.caption ? 'mt-3' : ''}`}>
                  {p.siteName && (
                    <li className="max-w-full">
                      <Link
                        href={siteHref(p.siteName)}
                        onClick={onClose}
                        className={`${PILL} press relative border-[rgba(233,180,76,0.5)] text-[var(--honey)] after:absolute after:-inset-1.5 after:content-[''] hover:bg-[var(--forest)]`}
                      >
                        <MapPin size={14} aria-hidden className="shrink-0" />
                        <span className="sr-only">Site: </span>
                        <span className="truncate">{p.siteName}</span>
                      </Link>
                    </li>
                  )}
                  {p.identifier && (
                    <Detail icon={<Tag size={14} aria-hidden />} label="Identifier">
                      {p.identifier}
                    </Detail>
                  )}
                  <Detail icon={<CalendarDays size={14} aria-hidden />} label="Taken">
                    {formatDate(p.date)}
                  </Detail>
                  {p.photographer && (
                    <Detail icon={<Camera size={14} aria-hidden />} label="Photographer">
                      {p.photographer}
                    </Detail>
                  )}
                </ul>
                <AdminPhotoActions photo={p} onDeleted={onClose} />
              </div>
            </div>
          </div>
        )}
      </dialog>
    </MotionProvider>
  );
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className={PILL}>
      <span className="shrink-0 text-[var(--sage)]">{icon}</span>
      <span className="sr-only">{label}: </span>
      <span className="truncate">{children}</span>
    </li>
  );
}
