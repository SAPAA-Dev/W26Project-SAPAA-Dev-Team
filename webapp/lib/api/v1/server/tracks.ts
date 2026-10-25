import { randomUUID } from 'node:crypto';
import { gpxTracksToLineFeatureCollection } from '@/lib/map/gpxTrack';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { getGpxTracksForMap } from '@/utils/supabase/queries';
import { saveGpxTrack } from '@/utils/gpx-track-actions';
import type { SiteTrack, TrackCollection, TrackUpload } from '../types';
import { HttpError, type Caller } from './auth';
import { findSite } from './sites';

// The bucket 20261020000000_create_gpx_tracks.sql creates (named again in queries.ts and gpx-track-actions.ts).
const BUCKET = 'gpx-tracks';
const DENIED = 'Only approved stewards and admins can use GPX tracks.';

/**
 * The gpx_tracks policies and the classic actions allow role steward or admin (and an approved account,
 * which requireCaller already checked). requireCaller does not read the role, so every track route asks here.
 * The shared actions below check again; this only turns a refusal into a 403.
 */
async function requireTrackRole(): Promise<void> {
  const { data, error } = await (await createClient()).auth.getUser();
  const role = data.user?.app_metadata?.role;
  if (error || (role !== 'steward' && role !== 'admin')) throw new HttpError(403, DENIED);
}

/** Every uploaded track as a line, read by getGpxTracksForMap (it skips a file it cannot read). */
export async function getTrackLines(): Promise<TrackCollection> {
  await requireTrackRole();
  return gpxTracksToLineFeatureCollection(await getGpxTracksForMap());
}

/**
 * The saved tracks of one site, read under the caller's own session so the table's row-level security is
 * the gate (it also needs the uploader, which getGpxTracksBySite does not return).
 */
export async function listSiteTracks(caller: Caller, slug: string): Promise<SiteTrack[]> {
  await requireTrackRole();
  const site = await findSite(slug, caller.isAdmin);
  const { data, error } = await (await createClient())
    .from('gpx_tracks')
    .select('id, original_file_name, track_point_count, created_at, user_id')
    .eq('site_id', site.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    fileName: row.original_file_name,
    pointCount: row.track_point_count,
    createdAt: row.created_at,
    // The delete policy: the uploader, or an admin.
    canDelete: caller.isAdmin || row.user_id === caller.userId,
  }));
}

/**
 * Step 1 of an upload. The file can be up to 50 MB, more than a serverless request body allows, so it goes
 * from the browser straight to the bucket through a one-use signed URL. The server picks the key, in the
 * caller's own folder, which is what saveGpxTrack checks again in step 2.
 */
export async function createTrackUpload(caller: Caller, slug: string): Promise<TrackUpload> {
  await requireTrackRole();
  await findSite(slug, caller.isAdmin);
  // The display name travels in step 2; the key only has to match the shape saveGpxTrack accepts.
  const path = `${caller.userId}/${randomUUID()}/track.gpx`;
  const { data, error } = await createServerSupabase().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('[api/v1] signed upload URL error', error);
    throw new Error('Could not prepare the upload.');
  }
  return { path: data.path, signedUrl: data.signedUrl };
}

/** Step 2: saveGpxTrack downloads the staged file, checks type, size and content, saves the row, and removes a refused file. */
export async function saveTrack(caller: Caller, slug: string, body: unknown): Promise<{ id: number; pointCount: number }> {
  await requireTrackRole();
  const input = body as { path?: unknown; fileName?: unknown } | null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Invalid track.');
  if (typeof input.path !== 'string' || !input.path) throw new HttpError(400, 'path is required.');
  if (typeof input.fileName !== 'string' || !input.fileName) throw new HttpError(400, 'fileName is required.');

  const site = await findSite(slug, caller.isAdmin);
  const result = await saveGpxTrack(site.id, input.path, input.fileName);
  if (!result.success) throw new HttpError(400, result.error ?? 'The track could not be saved.');
  return { id: result.trackId!, pointCount: result.trackPointCount! };
}

/**
 * Deletes one track and its file. Runs under the caller's session, so the table's and the bucket's delete
 * policies (the uploader, or an admin) decide. The classic UI has no delete; the policies are the rule.
 */
export async function deleteTrack(caller: Caller, slug: string, trackId: string): Promise<{ ok: true }> {
  await requireTrackRole();
  if (!/^\d{1,15}$/.test(trackId)) throw new HttpError(400, 'Invalid track id.');
  const site = await findSite(slug, caller.isAdmin);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('gpx_tracks')
    .delete()
    .eq('id', Number(trackId))
    .eq('site_id', site.id)
    .select('storage_path');
  if (error) throw new Error(error.message);
  // A row the policy hides looks the same as a row that does not exist.
  if (!data?.length) throw new HttpError(404, 'Track not found, or you cannot delete it.');

  const { error: removeError } = await supabase.storage.from(BUCKET).remove([data[0].storage_path]);
  if (removeError) console.error('[api/v1] could not remove a deleted track file', removeError);
  return { ok: true };
}
