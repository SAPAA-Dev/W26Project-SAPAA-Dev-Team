'use client';

import { useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Photo } from '@/lib/api/v1/types';
import { Confirm, errMsg, toast, useIsAdmin } from './shared';
import { Sheet, btn } from '../flows/ui';
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
  const [editing, setEditing] = useState(false);
  if (!isAdmin && !photo.canEdit) return null;

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
      <div {...KEEP_INSIDE} className="contents">
        <button type="button" className={`${btn.onPhoto} mt-3 px-4`} onClick={() => setEditing(true)}><Pencil size={15} aria-hidden />Edit photo details</button>
        {editing && <PhotoMetadata key={`${photo.kind}-${photo.id}`} photo={photo} onClose={() => setEditing(false)} onSaved={onDeleted} />}
      </div>
      {isAdmin && <button
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
      </button>}
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


function PhotoMetadata({ photo, onClose, onSaved }: { photo: Photo; onClose: () => void; onSaved: () => void }) {
  const [fields, setFields] = useState({ caption: photo.caption ?? '', identifier: photo.identifier ?? '', photographer: photo.photographer ?? '', date: photo.date ?? '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/site-images?id=${photo.id}&kind=${photo.kind}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Photo details were not saved.');
      invalidate('photos'); invalidate('site-photos');
      toast('Photo details saved.'); onClose(); onSaved();
    } catch (reason) { setError(errMsg(reason, 'Photo details were not saved.')); }
    finally { setBusy(false); }
  };
  return <Sheet open title="Edit photo details" onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={save} className="space-y-4">
      {(['caption', 'identifier', 'photographer', 'date'] as const).map((field) => <label key={field} className="block text-sm font-semibold capitalize">{field}
        <input type={field === 'date' ? 'date' : 'text'} value={fields[field]} maxLength={field === 'caption' ? 10000 : 200} onChange={(event) => setFields((previous) => ({ ...previous, [field]: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-base text-[var(--ink)]" />
      </label>)}
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy} className={btn.primary}>{busy ? 'Saving' : 'Save photo details'}</button>
    </form>
  </Sheet>;
}
