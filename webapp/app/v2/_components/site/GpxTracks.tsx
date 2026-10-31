'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, Route, Trash2, Upload } from 'lucide-react';
import { api, ApiError } from '@/lib/api/v1/client';
import { invalidate, useApi } from '../../_lib/useApi';
import { btn, ErrorState, Sheet } from '../flows/ui';
import { formatDate } from '../flows/format';

interface FileStatus {
  name: string;
  state: 'saving' | 'saved' | 'refused';
  message?: string;
}

/**
 * GPX tracks of a visit on the site page (US 2.0.9), for stewards and admins. The server decides who may:
 * a refused list read (403) hides the whole row. The server also checks type, size and content; the
 * extension test here only saves a wasted upload.
 */
export default function GpxTracks({ slug }: { slug: string }) {
  const tracks = useApi(`site-tracks:${slug}`, () => api.siteTracks(slug));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  if (tracks.error instanceof ApiError && tracks.error.status === 403) return null;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStatuses([]);
    setConfirming(null);
    setDeleteError(null);
    requestAnimationFrame(() => trigger.current?.focus());
  };

  const refresh = () => {
    invalidate(`site-tracks:${slug}`);
    invalidate('tracks'); // the map's lines
  };

  const upload = async (files: File[]) => {
    if (!files.length || busy) return;
    setBusy(true);
    setStatuses(files.map((f) => ({ name: f.name, state: 'saving' })));
    const set = (i: number, patch: Partial<FileStatus>) =>
      setStatuses((cur) => cur.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    for (const [i, file] of files.entries()) {
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        set(i, { state: 'refused', message: 'Only .gpx files are accepted.' });
        continue;
      }
      try {
        await api.uploadTrack(slug, file);
        set(i, { state: 'saved' });
      } catch (e) {
        set(i, { state: 'refused', message: e instanceof Error ? e.message : 'The upload failed.' });
      }
    }
    setBusy(false);
    refresh();
  };

  const remove = async (id: number) => {
    setDeleteError(null);
    try {
      await api.deleteTrack(slug, id);
      setConfirming(null);
      refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'The track was not deleted.');
    }
  };

  const count = tracks.data?.length;

  return (
    <li>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="press flex min-h-14 w-full items-center gap-3 px-4 text-left text-[15px] [--press-scale:0.99] hover:bg-[var(--bg)]"
      >
        <Route size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
        <span className="flex-1">
          GPX tracks
          {count !== undefined && (
            <span className="text-[var(--ink-2)]">
              {' '}
              · {count ? `${count} saved` : 'none yet'}
            </span>
          )}
        </span>
        <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
      </button>

      <Sheet open={open} onClose={close} title="GPX tracks" description="Save the track of a visit. It shows on the map.">
        <input
          ref={picker}
          type="file"
          accept=".gpx"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose GPX files"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            void upload(files);
          }}
        />
        <button type="button" onClick={() => picker.current?.click()} disabled={busy} className={`${btn.primary} w-full`}>
          {busy ? <Loader2 size={18} aria-hidden className="animate-spin" /> : <Upload size={18} aria-hidden />}
          {busy ? 'Saving the tracks' : 'Choose .gpx files'}
        </button>
        <p className="mt-2 text-sm text-[var(--ink-2)]">Up to 50 MB per file.</p>

        {statuses.length > 0 && (
          <ul aria-live="polite" className="mt-4 space-y-2">
            {statuses.map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                className={`flex items-start gap-2 rounded-[var(--radius-m)] px-3 py-2.5 text-sm ${
                  s.state === 'refused' ? 'bg-[color-mix(in_srgb,var(--clay)_16%,transparent)]' : 'bg-[var(--bg-sunken)]'
                }`}
              >
                {s.state === 'refused' ? (
                  <AlertCircle size={18} aria-hidden className="mt-0.5 shrink-0 text-[var(--clay-ink)]" />
                ) : s.state === 'saved' ? (
                  <CheckCircle2 size={18} aria-hidden className="mt-0.5 shrink-0 text-[var(--st-recent-ink)]" />
                ) : (
                  <Loader2 size={18} aria-hidden className="mt-0.5 shrink-0 animate-spin" />
                )}
                <span className="min-w-0 break-words">
                  <span className="font-semibold">{s.name}</span>
                  {s.state === 'saving' && ' is being saved'}
                  {s.state === 'saved' && ' was saved'}
                  {s.state === 'refused' && ` was refused: ${s.message}`}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mt-6 text-[15px] font-bold">Saved on this site</h3>
        {tracks.error ? (
          <div className="mt-2">
            <ErrorState title="The tracks didn’t load" error={tracks.error} onRetry={tracks.refetch} />
          </div>
        ) : !tracks.data ? (
          <p className="mt-2 text-sm text-[var(--ink-2)]">Loading</p>
        ) : tracks.data.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-2)]">No tracks yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-[var(--line)]">
            {tracks.data.map((t) => (
              <li key={t.id} className="flex min-h-14 items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.fileName}</span>
                  <span className="block text-sm text-[var(--ink-2)]">
                    {t.pointCount.toLocaleString('en-CA')} points · {formatDate(t.createdAt)}
                  </span>
                </span>
                {t.canDelete &&
                  (confirming === t.id ? (
                    <span className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => void remove(t.id)} className={`${btn.primary} min-h-11 px-4 text-sm`}>
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className={`${btn.secondary} min-h-11 px-4 text-sm`}>
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Delete ${t.fileName}`}
                      onClick={() => {
                        setDeleteError(null);
                        setConfirming(t.id);
                      }}
                      className="press grid size-11 shrink-0 place-items-center rounded-full text-[var(--clay-ink)] hover:bg-[var(--bg-sunken)]"
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        )}
        {deleteError && (
          <p role="alert" className="mt-2 text-sm text-[var(--clay-ink)]">
            {deleteError}
          </p>
        )}
      </Sheet>
    </li>
  );
}
