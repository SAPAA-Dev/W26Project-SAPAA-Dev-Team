'use server';

import { createClient, createServerSupabase } from './supabase/server';
import { GpxTrackError, parseGpxTrackFile } from '@/lib/map/gpxTrack';

export interface SaveGpxTrackResult {
  success: boolean;
  trackId?: number;
  trackPointCount?: number;
  error?: string;
}

// Matches the bucket that 20261020000000_create_gpx_tracks.sql creates.
const BUCKET = 'gpx-tracks';
// The staged key inside the bucket is <user id>/<upload id>/<file name>.gpx.
// There is no bucket-name prefix: storage.from(BUCKET) already scopes the key,
// and the first folder must be the uploader, because the insert policy pins
// ownership with storage.foldername(name)[1]. The service role bypasses RLS,
// so the same rule is checked here against the session before any storage call.
const STORAGE_PATH_PATTERN = /^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)\.gpx$/i;
// Matches the file_size_limit of the bucket. Checked again here so the parser
// does not run on an object that the bucket limit did not catch.
const MAX_FILE_BYTES = 50 * 1024 * 1024;
// The character filter of the upload control, applied again here because a
// server action cannot trust its arguments. The cap lives here only; the
// upload control sets none.
const MAX_FILE_NAME_LENGTH = 200;

const NOT_APPROVED_ERROR = 'Sign in with an approved steward or admin account to upload a GPX track.';
const NOT_OWNED_ERROR = 'The uploaded file does not belong to your account.';
const INVALID_PATH_ERROR = 'The upload path is not valid.';
const EXTENSION_ERROR = 'Only .gpx files are accepted.';
const SIZE_ERROR = 'The file is larger than 50 MB.';
const SAVE_FAILED_ERROR = 'The track could not be saved. Try again.';
const DOWNLOAD_FAILED_ERROR = 'The uploaded file could not be read. Upload it again.';

// Every call below runs with the service role, so the caller is checked first.
// The check reads the signed-in session, never a value the caller sends.
async function getApprovedUploader(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error !== null || !user) return null;

  const role = user.app_metadata?.role;
  if (user.app_metadata?.authenticated !== true) return null;
  if (role !== 'steward' && role !== 'admin') return null;

  return { id: user.id };
}

export async function saveGpxTrack(
  siteId: number,
  storagePath: string,
  originalFileName: string
): Promise<SaveGpxTrackResult> {
  const uploader = await getApprovedUploader();
  if (uploader === null) {
    return { success: false, error: NOT_APPROVED_ERROR };
  }

  // A non-string argument throws on the string calls below, before the try
  // block that removes the staged object, so refuse it here instead.
  if (typeof originalFileName !== 'string') {
    return { success: false, error: EXTENSION_ERROR };
  }
  if (typeof storagePath !== 'string') {
    return { success: false, error: INVALID_PATH_ERROR };
  }

  if (!originalFileName.toLowerCase().endsWith('.gpx')) {
    return { success: false, error: EXTENSION_ERROR };
  }

  // The marker keeps the .gpx tail on a cut name, so a steward still sees that
  // the stored row is a GPX file.
  const TRUNCATION_MARKER = '___.gpx';
  const sanitizedFileName = originalFileName.replace(/[^A-Za-z0-9._-]/g, '_');
  const safeOriginalFileName = sanitizedFileName.length <= MAX_FILE_NAME_LENGTH
    ? sanitizedFileName
    : sanitizedFileName.slice(0, MAX_FILE_NAME_LENGTH - TRUNCATION_MARKER.length) + TRUNCATION_MARKER;

  const normalizedPath = storagePath.replace(/\\/g, '/');
  const pathMatch = STORAGE_PATH_PATTERN.exec(normalizedPath);
  // A segment of '.' or '..' can move the object path, but a file name that
  // only holds two dots, like visit..gpx, is a normal name.
  if (
    pathMatch === null
    || normalizedPath.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    return { success: false, error: INVALID_PATH_ERROR };
  }

  // A caller must not save, duplicate, or remove another user's staged object.
  if (pathMatch[1] !== uploader.id) {
    return { success: false, error: NOT_OWNED_ERROR };
  }

  const supabase = createServerSupabase();
  let saved = false;

  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(normalizedPath);
    if (error !== null || data === null) {
      return { success: false, error: DOWNLOAD_FAILED_ERROR };
    }

    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.length > MAX_FILE_BYTES) {
      return { success: false, error: SIZE_ERROR };
    }

    const points = parseGpxTrackFile(bytes);

    const { data: inserted, error: insertError } = await supabase
      .from('gpx_tracks')
      .insert({
        site_id: siteId,
        user_id: uploader.id,
        storage_path: normalizedPath,
        original_file_name: safeOriginalFileName,
        track_point_count: points.length,
      })
      .select('id')
      .single();

    if (insertError !== null || inserted === null) {
      // The database text can name tables and constraints, so it stays in the log.
      console.error('Failed to save the GPX track', insertError);
      return { success: false, error: SAVE_FAILED_ERROR };
    }

    saved = true;
    return { success: true, trackId: inserted.id, trackPointCount: points.length };
  } catch (error) {
    console.error('Failed to save the GPX track', error);
    return {
      success: false,
      error: error instanceof GpxTrackError ? error.message : SAVE_FAILED_ERROR,
    };
  } finally {
    // A refused file leaves nothing behind. A saved file stays in the bucket
    // for read-back, so it is removed only when nothing was written.
    if (!saved) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([normalizedPath]);
      if (removeError !== null) {
        console.error('Failed to remove the refused GPX file', removeError);
      }
    }
  }
}
