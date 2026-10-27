'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Loader2, Route, Upload, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { saveGpxTrack } from '@/utils/gpx-track-actions';
import { getGpxTracksBySite, type GpxTrackSummary } from '@/utils/supabase/queries';

// Matches the bucket that 20261020000000_create_gpx_tracks.sql creates.
// The name is repeated here because a 'use server' module cannot export a value.
const BUCKET = 'gpx-tracks';
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const GPX_CONTENT_TYPE = 'application/gpx+xml';

interface FileStatus {
  fileName: string;
  state: 'saving' | 'saved' | 'refused';
  message?: string;
}

export function canUploadGpxTracks(
  user: { role: string; approved: boolean } | null
): boolean {
  if (user === null) return false;
  if (user.approved !== true) return false;
  return user.role === 'steward' || user.role === 'admin';
}

function hasGpxExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith('.gpx');
}

function uploadFolder(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeFileName(filename: string): string {
  return filename.replace(/[^A-Za-z0-9._-]/g, '_');
}

export default function GpxTrackUpload({ siteId }: { siteId: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [tracks, setTracks] = useState<GpxTrackSummary[]>([]);
  const [tracksVersion, setTracksVersion] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getGpxTracksBySite(siteId)
      .then((list) => {
        if (!cancelled) setTracks(list);
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, siteId, tracksVersion]);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStatuses([]);
  };

  // Escape closes the dialog, unless an upload is running.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || busy) return;
      setOpen(false);
      setStatuses([]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy]);

  const runUploads = async (files: File[]) => {
    if (files.length === 0 || busy) return;

    setBusy(true);
    setStatuses(files.map((file) => ({ fileName: file.name, state: 'saving' as const })));

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError !== null || user === null) {
      setStatuses((previous) => previous.map((status) => ({
        ...status,
        state: 'refused' as const,
        message: 'Sign in again to upload a GPX track.',
      })));
      setBusy(false);
      return;
    }

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      const fail = (message: string) => {
        setStatuses((previous) => previous.map((status, statusIndex) =>
          statusIndex === index ? { ...status, state: 'refused', message } : status
        ));
      };
      const succeed = () => {
        setStatuses((previous) => previous.map((status, statusIndex) =>
          statusIndex === index ? { ...status, state: 'saved' } : status
        ));
      };

      if (!hasGpxExtension(file.name)) {
        fail('Only .gpx files are accepted.');
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        fail('The file is larger than 50 MB.');
        continue;
      }

      // .from(BUCKET) already scopes the key, and the first folder must be the
      // uploader's user id for the storage policies.
      const path = `${user.id}/${uploadFolder()}/${safeFileName(file.name)}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: '3600', upsert: false, contentType: GPX_CONTENT_TYPE });

        if (uploadError) {
          console.error('The GPX bucket upload failed', uploadError);
          fail('The upload failed. Try again.');
          continue;
        }

        const result = await saveGpxTrack(siteId, path, file.name);
        if (!result.success) {
          fail(result.error ?? 'The track could not be saved.');
          continue;
        }

        succeed();
      } catch (caught) {
        fail(caught instanceof Error ? caught.message : 'The upload failed.');
      }
    }

    setBusy(false);
    setTracksVersion((version) => version + 1);
  };

  const onFilesChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = '';
    void runUploads(chosen);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    void runUploads(dropped);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-white text-[#254431] font-bold py-3 px-6 rounded-2xl border-2 border-[#E4EBE4] shadow-sm hover:border-[#86A98A] hover:bg-[#F7F2EA] transition-all"
        data-testid="gpx-upload-button"
      >
        <Route className="w-5 h-5" />
        Upload a GPX Track
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-[#254431]/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={(event) => event.target === event.currentTarget && close()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#254431] to-[#356B43] px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 id={titleId} className="text-xl font-bold text-white">Upload GPX Tracks</h2>
                  <p className="text-sm text-[#E4EBE4]">Save the track of a site visit on this site</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                aria-label="Close upload dialog"
                className="flex h-11 w-11 items-center justify-center text-white/60 hover:text-white transition-colors disabled:opacity-40"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div
                onDrop={onDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                className={`border-2 border-dashed rounded-xl px-6 py-10 text-center transition-all ${
                  dragging ? 'border-[#356B43] bg-[#F7F2EA]' : 'border-[#E4EBE4]'
                } ${busy ? 'opacity-60' : ''}`}
              >
                <Upload className="w-10 h-10 text-[#5B655D] mx-auto mb-3" />
                <p className="text-[#254431] font-medium">Drop .gpx files here</p>
                <p className="text-sm text-[#5B655D] mt-1">Maximum size 50 MB per file. Only GPX files are accepted.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#356B43] px-5 py-3 font-semibold text-white disabled:opacity-60"
                  data-testid="gpx-choose-files"
                >
                  <Upload className="w-4 h-4" />
                  Choose GPX files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx"
                  multiple
                  className="hidden"
                  onChange={onFilesChosen}
                />
              </div>

              {busy && (
                <div className="mt-5 flex items-center gap-2 text-[#254431] font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving the tracks...
                </div>
              )}

              {statuses.length > 0 && (
                <div className="mt-5 space-y-2" role="status">
                  {statuses.map((status, index) => (
                    <div
                      key={`${status.fileName}-${index}`}
                      className={`flex items-start gap-2 rounded-xl px-4 py-3 ${
                        status.state === 'refused' ? 'bg-[#FEE2E2] text-[#7F1D1D]' : 'bg-[#D1FAE5] text-[#065F46]'
                      }`}
                      data-testid={`gpx-file-status-${index}`}
                    >
                      {status.state === 'refused' ? (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm break-all">
                        <span className="font-medium">{status.fileName}</span>
                        {status.state === 'saving' && ' is being saved...'}
                        {status.state === 'saved' && ' was saved.'}
                        {status.state === 'refused' && ` was refused: ${status.message}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {tracks.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-[#254431]">
                    {tracks.length} saved {tracks.length === 1 ? 'track' : 'tracks'} on this site
                  </p>
                  <ul className="mt-2 max-h-40 overflow-y-auto text-sm text-[#5B655D] space-y-1 list-disc pl-5">
                    {tracks.map((track) => (
                      <li key={track.id}>
                        {track.originalFileName} ({track.trackPointCount} track{' '}
                        {track.trackPointCount === 1 ? 'point' : 'points'})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
