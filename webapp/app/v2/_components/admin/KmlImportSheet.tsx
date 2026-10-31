'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { importProtectedAreasFromStorage, type ImportKmlResult } from '@/utils/kml-import-actions';
import { invalidate } from '@/app/v2/_lib/useApi';
import { btn, Sheet } from '@/app/v2/_components/flows/ui';
import { errMsg, plural, toast } from './shared';


const BUCKET = 'kml-imports'; // 20261006000000_create_kml_imports_bucket.sql
const MAX_BYTES = 50 * 1024 * 1024;
type Stage = 'idle' | 'uploading' | 'importing' | 'done' | 'error';

export default function KmlImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportKmlResult | null>(null);
  const [over, setOver] = useState(false);
  const busy = stage === 'uploading' || stage === 'importing';

  const reset = () => {
    if (busy) return;
    setStage('idle');
    setError(null);
    setResult(null);
    onClose();
  };
  const fail = (message: string) => {
    setStage('error');
    setError(message);
  };

  const run = async (file: File) => {
    setError(null);
    setResult(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.kml') && !lower.endsWith('.kmz')) return fail('Choose a .kml or .kmz file.');
    if (file.size > MAX_BYTES) return fail('The file is larger than 50 MB.');
    const path = `${BUCKET}/${crypto.randomUUID()}/${file.name.replace(/[^A-Za-z0-9._-]/g, '_')}`;
    try {
      setStage('uploading');
      const { error: up } = await createClient()
        .storage.from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: lower.endsWith('.kmz') ? 'application/vnd.google-earth.kmz' : 'application/vnd.google-earth.kml+xml',
        });
      if (up) return fail(`The upload failed: ${up.message}`);
      setStage('importing');
      const r = await importProtectedAreasFromStorage(path);
      setResult(r);
      if (!r.success) return fail(r.error ?? 'The import failed.');
      setStage('done');
      toast(`Imported ${plural(r.upserted ?? 0, 'protected area')}.`);
      invalidate('boundaries');
      invalidate('admin:');
      invalidate('site:');
      invalidate('sites'); // the import re-links sites to their boundaries (centre, area type)
    } catch (e) {
      fail(errMsg(e, 'The import failed.'));
    }
  };

  const warnings = result?.warnings ?? [];
  const unlinked = result?.unlinkedSites ?? [];
  return (
    <Sheet
      open={open}
      onClose={reset}
      title="Upload site data"
      description="Protected area boundaries from a KML or KMZ file, up to 50 MB. Matching areas are updated."
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) void run(f);
        }}
        className={`rounded-[var(--radius-m)] border-2 border-dashed px-5 py-7 text-center transition-colors duration-[var(--dur-1)] ${over ? 'border-[var(--forest)] bg-[var(--bg-sunken)]' : 'border-[var(--line)]'}`}
      >
        <FileUp size={28} aria-hidden className="mx-auto text-[var(--ink-2)]" />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={`${btn.primary} mt-3`}>
          Choose a file
        </button>
        <p className="mt-2 hidden text-sm text-[var(--ink-2)] md:block">or drop it here</p>
        <input
          ref={input}
          type="file"
          accept=".kml,.kmz"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void run(f);
          }}
        />
      </div>

      <div aria-live="polite">
        {busy && (
          <p className="mt-4 flex items-start gap-2 text-[15px] font-semibold">
            <Loader2 size={18} aria-hidden className="mt-0.5 shrink-0 animate-spin" />
            {stage === 'uploading' ? 'Uploading the file.' : 'Reading the file and saving the areas. A full data set takes about a minute.'}
          </p>
        )}
        {stage === 'done' && result && (
          <p className="mt-4 text-[15px] font-semibold text-[var(--st-recent-ink)]">
            Imported {plural(result.upserted ?? 0, 'protected area')}.
            {(result.skipped ?? 0) > 0 && ` ${plural(result.skipped ?? 0, 'placemark was', 'placemarks were')} skipped.`}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
      {stage === 'done' && unlinked.length > 0 && (
        <details open className="mt-4">
          <summary className="min-h-11 cursor-pointer text-[15px] font-semibold">
            {plural(unlinked.length, 'site has', 'sites have')} no boundary
          </summary>
          <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5 text-sm text-[var(--ink-2)]">
            {unlinked.map((name, i) => (
              <li key={`${name}-${i}`}>{name}</li>
            ))}
          </ul>
        </details>
      )}
      {warnings.length > 0 && (
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer text-[15px] font-semibold">{plural(warnings.length, 'note')}</summary>
          <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5 text-sm text-[var(--ink-2)]">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </Sheet>
  );
}
