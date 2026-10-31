import { HttpError, route } from '@/lib/api/v1/server/auth';
import { listSiteTracks, saveTrack } from '@/lib/api/v1/server/tracks';

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route<Ctx>(async (caller, _req, { params }) => listSiteTracks(caller, (await params).slug));

/** Step 2 of an upload: { path, fileName } of the file the browser put in the bucket. */
export const POST = route<Ctx>(async (caller, request, { params }) => {
  const body = await request.json().catch(() => {
    throw new HttpError(400, 'The body must be JSON.');
  });
  return saveTrack(caller, (await params).slug, body);
});
