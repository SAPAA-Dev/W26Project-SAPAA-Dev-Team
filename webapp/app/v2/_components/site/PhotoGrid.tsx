'use client';

import { useState } from 'react';
import { ImageOff, ImagePlus } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import type { Photo } from '@/lib/api/v1/types';
import { useApi } from '../../_lib/useApi';
import { Lightbox } from '../../photos/Lightbox';
import { AddPhotosSheet } from '../../photos/AddPhotosSheet';
import { btn } from '../flows/ui';

const describe = (p: Photo, i: number, siteName: string) => p.caption ?? p.identifier ?? `Photo ${i + 1} of ${siteName}`;

/** The site's photos in the Photos tab's tile style, opening the same viewer (swipe, arrows, fade). */
export default function PhotoGrid({ photos, siteName }: { photos: Photo[]; siteName: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return <NoPhotos siteName={siteName} />;

  return (
    <>
      <ul className="grid grid-cols-3 gap-1.5">
        {photos.map((p, i) => (
          <li key={`${p.kind}-${p.id}`}>
            <Tile photo={p} label={`Open photo: ${describe(p, i, siteName)}`} onOpen={() => setOpen(i)} />
          </li>
        ))}
      </ul>
      <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}

/** Same square as the Photos tab; a link that 404s shows a quiet placeholder instead of a broken image. */
function Tile({ photo: p, label, onOpen }: { photo: Photo; label: string; onOpen: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={label}
      className="press block aspect-square w-full overflow-hidden rounded-[var(--radius-s)] bg-[var(--bg-sunken)]"
    >
      {broken ? (
        <span className="grid size-full place-items-center text-[var(--ink-2)]">
          <ImageOff size={22} aria-hidden />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URLs; next/image only serves public/
        <img src={p.url} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className="size-full object-cover" />
      )}
    </button>
  );
}

/** Empty tab: say where photos come from, and offer the upload right here. */
function NoPhotos({ siteName }: { siteName: string }) {
  const [adding, setAdding] = useState(false);
  const me = useApi('me', api.me);
  return (
    <>
      <div className="rounded-[var(--radius-m)] border border-dashed border-[var(--line)] px-5 py-8 text-center">
        <p className="text-[15px] text-[var(--ink-2)]">No photos yet. Photos from inspections and visits appear here.</p>
        <button type="button" onClick={() => setAdding(true)} className={`${btn.secondary} mt-4`}>
          <ImagePlus size={18} aria-hidden />
          Add photos
        </button>
      </div>
      {/* Outside the centred card: the dialog would inherit its text-align. */}
      <AddPhotosSheet
        open={adding}
        onClose={() => setAdding(false)}
        siteNames={[siteName]}
        photographer={me.data?.person?.name ?? ''}
      />
    </>
  );
}
