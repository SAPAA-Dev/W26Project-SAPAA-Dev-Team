'use client';

import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { importProtectedAreasFromStorage, ImportKmlResult } from '@/utils/kml-import-actions';

interface KmlImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Runs after a successful import, so the page can reload the protected areas. */
  onImported?: () => void;
}

// Matches the bucket that 20261006000000_create_kml_imports_bucket.sql creates.
// The name is repeated here because a 'use server' module cannot export a value.
const BUCKET = 'kml-imports';
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.kml', '.kmz'];

const KMZ_CONTENT_TYPE = 'application/vnd.google-earth.kmz';
const KML_CONTENT_TYPE = 'application/vnd.google-earth.kml+xml';

type Stage = 'idle' | 'uploading' | 'importing' | 'done' | 'error';

const STAGE_LABELS: Record<Exclude<Stage, 'idle' | 'done' | 'error'>, string> = {
  uploading: 'Uploading the file to the staging bucket...',
  importing: 'Reading the file and writing the protected areas. A full data set takes about a minute.',
};

function hasAcceptedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
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

export default function KmlImportModal({ open, onClose, onImported }: KmlImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportKmlResult | null>(null);
  const [dragging, setDragging] = useState(false);

  const busy = stage === 'uploading' || stage === 'importing';

  if (!open) return null;

  const close = () => {
    if (busy) return;
    setStage('idle');
    setError(null);
    setResult(null);
    onClose();
  };

  const runImport = async (file: File) => {
    setError(null);
    setResult(null);

    if (!hasAcceptedExtension(file.name)) {
      setStage('error');
      setError('Choose a .kml or .kmz file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStage('error');
      setError('The file is larger than 50 MB.');
      return;
    }

    const path = `${BUCKET}/${uploadFolder()}/${safeFileName(file.name)}`;
    const contentType = file.name.toLowerCase().endsWith('.kmz') ? KMZ_CONTENT_TYPE : KML_CONTENT_TYPE;

    try {
      setStage('uploading');
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType });

      if (uploadError) {
        setStage('error');
        setError(`The upload failed: ${uploadError.message}`);
        return;
      }

      setStage('importing');
      const importResult = await importProtectedAreasFromStorage(path);
      setResult(importResult);

      if (!importResult.success) {
        setStage('error');
        setError(importResult.error ?? 'The import failed.');
        return;
      }

      setStage('done');
      onImported?.();
    } catch (caught) {
      setStage('error');
      setError(caught instanceof Error ? caught.message : 'The import failed.');
    }
  };

  const onFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void runImport(file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (busy) return;

    const file = event.dataTransfer.files?.[0];
    if (file) void runImport(file);
  };

  const warnings = result?.warnings ?? [];

  return (
    <div
      className="fixed inset-0 bg-[#254431]/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(event) => event.target === event.currentTarget && close()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upload Site Data</h2>
              <p className="text-sm text-[#86A98A]">Import protected area boundaries from a KML or KMZ file</p>
            </div>
          </div>
          <button
            onClick={close}
            disabled={busy}
            className="text-white/60 hover:text-white transition-colors p-1 disabled:opacity-40"
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
            onClick={() => !busy && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-6 py-10 text-center transition-all ${
              dragging ? 'border-[#356B43] bg-[#F7F2EA]' : 'border-[#E4EBE4]'
            } ${busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F7F2EA] hover:border-[#86A98A]'}`}
          >
            <Upload className="w-10 h-10 text-[#7A8075] mx-auto mb-3" />
            <p className="text-[#254431] font-medium">Drop a KML or KMZ file here, or click to choose one</p>
            <p className="text-sm text-[#7A8075] mt-1">Maximum size 50 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".kml,.kmz"
              className="hidden"
              onChange={onFileChosen}
            />
          </div>

          {busy && (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-[#254431] font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                {STAGE_LABELS[stage as 'uploading' | 'importing']}
              </div>
              <div className="mt-3 h-2 bg-[#E4EBE4] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#356B43] rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {error !== null && (
            <div className="mt-5 flex items-start gap-2 bg-[#FEE2E2] text-[#7F1D1D] rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {stage === 'done' && result !== null && (
            <div className="mt-5 bg-[#D1FAE5] text-[#065F46] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Imported {result.upserted} protected areas.
              </div>
              {(result.skipped ?? 0) > 0 && (
                <p className="text-sm mt-1">
                  {result.skipped} {result.skipped === 1 ? 'placemark was' : 'placemarks were'} skipped.
                </p>
              )}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-[#254431]">
                {warnings.length} {warnings.length === 1 ? 'note' : 'notes'}
              </p>
              <ul className="mt-2 max-h-40 overflow-y-auto text-sm text-[#7A8075] space-y-1 list-disc pl-5">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
