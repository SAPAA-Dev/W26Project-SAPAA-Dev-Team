'use server';

import { createClient, createServerSupabase } from './supabase/server';
import { refreshProtectedAreaLinks } from './supabase/siteLinks';
import { KmlImportError, parseProtectedAreaFile } from '@/lib/map/kmlImport';

export interface ImportKmlResult {
  success: boolean;
  error?: string;
  upserted?: number;
  skipped?: number;
  warnings?: string[];
}

// Matches the bucket that 20261006000000_create_kml_imports_bucket.sql creates.
const BUCKET = 'kml-imports';
const STAGING_PREFIX = 'kml-imports/';
// The caller sends this path, and the service role bypasses RLS, so only a path
// that this app created is accepted.
const IMPORT_PATH_PATTERN = /^kml-imports\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.(kml|kmz)$/i;
// Keeps each upsert request small enough for PostgREST even when the polygons in
// a chunk are large.
const UPSERT_CHUNK_SIZE = 50;
// Matches the file_size_limit of the bucket. Checked again here so the parser does
// not run on an object that the bucket limit did not catch.
const MAX_FILE_BYTES = 50 * 1024 * 1024;

const NOT_ADMIN_ERROR = 'Only admins can import protected areas.';
const INVALID_PATH_ERROR = 'The import path is not valid.';
const LINK_WARNING =
  'The protected areas were saved, but the site links were not updated. Link the sites by hand or run the import again.';

// Every call below runs with the service role, so the caller is checked first.
// The check reads the signed-in session, never a value the caller sends.
async function isApprovedAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return data.user.app_metadata?.role === 'admin'
    && data.user.app_metadata?.authenticated === true;
}

const SWEEP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const LIST_PAGE_SIZE = 100;

async function sweepStaleUploads(
  supabase: ReturnType<typeof createServerSupabase>
): Promise<void> {
  // Keys are kml-imports/<uploadId>/<file>, so the tree is walked level by level.
  // Entries with id === null are prefix placeholders, not objects.
  const walk = async (prefix: string): Promise<string[]> => {
    const { data: entries } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: LIST_PAGE_SIZE });

    const stale: string[] = [];
    for (const entry of entries ?? []) {
      const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;

      if (entry.id === null) {
        stale.push(...(await walk(path)));
        continue;
      }
      if (entry.created_at === null) continue;

      const age = Date.now() - new Date(entry.created_at).getTime();
      if (age > SWEEP_MAX_AGE_MS) stale.push(path);
    }
    return stale;
  };

  const stale = await walk('');
  if (stale.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(stale);
  if (error !== null) {
    // A failed sweep must never fail the import; the next one retries it.
    console.error('Failed to sweep stale KML uploads', error);
  }
}

/**
 * Reads a .kml or .kmz file that an admin staged in the kml-imports bucket,
 * upserts the protected areas it holds, and removes the staged file.
 */
export async function importProtectedAreasFromStorage(storagePath: string): Promise<ImportKmlResult> {
  if (!(await isApprovedAdmin())) {
    return { success: false, error: NOT_ADMIN_ERROR };
  }

  const normalizedPath = storagePath.replace(/\\/g, '/');
  if (
    !normalizedPath.startsWith(STAGING_PREFIX) ||
    normalizedPath.includes('..') ||
    !IMPORT_PATH_PATTERN.test(normalizedPath)
  ) {
    return { success: false, error: INVALID_PATH_ERROR };
  }

  const supabase = createServerSupabase();

  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(normalizedPath);
    if (error !== null || data === null) {
      return { success: false, error: 'The uploaded file could not be read from the staging bucket.' };
    }

    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.length > MAX_FILE_BYTES) {
      return { success: false, error: 'The file is larger than 50 MB.' };
    }

    const { records, warnings, stats } = parseProtectedAreaFile(bytes);

    if (records.length === 0) {
      return {
        success: false,
        error: 'The file holds no protected areas.',
        skipped: stats.skipped,
        warnings,
      };
    }

    const updatedAt = new Date().toISOString();
    const rows = records.map((record) => ({ ...record, updated_at: updatedAt }));

    let upserted = 0;
    for (let start = 0; start < rows.length; start += UPSERT_CHUNK_SIZE) {
      const chunk = rows.slice(start, start + UPSERT_CHUNK_SIZE);
      const { error: upsertError } = await supabase
        .from('protected_areas')
        .upsert(chunk, { onConflict: 'folder,fid' });

      if (upsertError !== null) {
        // The database text can name tables and constraints, so it stays in the log.
        console.error('Failed to write protected areas', upsertError);
        return {
          success: false,
          error: `The import stopped after ${upserted} of ${rows.length} rows.`,
          upserted,
          skipped: stats.skipped,
          warnings,
        };
      }

      upserted += chunk.length;
    }

    // The boundaries now hold the imported geometry, so the matching site cards can
    // link and their centres can refresh. The import already succeeded, so a failed
    // lookup is a warning, not an error.
    const linked = await refreshProtectedAreaLinks(supabase);
    const importWarnings = linked ? warnings : [...warnings, LINK_WARNING];
    return { success: true, upserted, skipped: stats.skipped, warnings: importWarnings };
  } catch (error) {
    console.error('Failed to import the protected areas', error);
    return {
      success: false,
      error: error instanceof KmlImportError ? error.message : 'The import failed. Try again, or check the file.',
    };
  } finally {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([normalizedPath]);
    if (removeError !== null) {
      console.error('Failed to remove the staged KML file', removeError);
    }
    try {
      await sweepStaleUploads(supabase);
    } catch (sweepError) {
      console.error('The KML import sweep failed', sweepError);
    }
  }
}
