'use client';

import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Photo } from '@/lib/api/v1/types';
import { Confirm, errMsg, toast, useIsAdmin } from './shared';
import { invalidate } from '@/app/v2/_lib/useApi';

/**
 * Delete a photo from the lightbox (admins only): the classic DeleteImageButton and DELETE /api/site-images,
 * behind a confirm. `onDeleted` closes the viewer; the photo lists refetch.
 */
const stop = (e: React.SyntheticEvent) => e.stopPropagation();
/** React's types leave onCancel off a div, but React still dispatches it there while it bubbles. */
const KEEP_INSIDE = { onCancel: stop, onKeyDown: stop } as React.HTMLAttributes<HTMLDivElement>;

export default function AdminPhotoActions({ photo, onDeleted }: { photo: Photo; onDeleted: () => void }) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isAdmin) return null;

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/site-images?id=${photo.id}&kind=${photo.kind}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'The photo was not deleted. Try again.');
      setOpen(false);
      toast('Photo deleted.');
      invalidate('photos');
      invalidate('site-photos');
      onDeleted();
    } catch (e) {
      setError(errMsg(e, 'The photo was not deleted. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="press mt-3 inline-flex h-11 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--clay)_50%,transparent)] bg-[rgba(18,42,28,0.85)] px-4 text-[14px] font-semibold text-[var(--clay)] hover:bg-[var(--forest)]"
      >
        <Trash2 size={15} aria-hidden />
        Delete photo
      </button>
      {open && (
        // React bubbles Escape (cancel) and arrow keys to the lightbox dialog around us; keep them here.
        <div className="contents" {...KEEP_INSIDE}>
          <Confirm
            open
            onClose={() => {
              setOpen(false);
              requestAnimationFrame(() => trigger.current?.focus());
            }}
            title="Delete this photo?"
            description={`${photo.kind === 'attachments' ? 'It comes off its report' : 'It comes off the site page'}${photo.siteName ? ` at ${photo.siteName}` : ''}, and the file leaves storage for good. This cannot be undone.`}
            confirmLabel={busy ? 'Deleting' : 'Delete photo'}
            busy={busy}
            error={error}
            onConfirm={remove}
          />
        </div>
      )}
    </>
  );
}
