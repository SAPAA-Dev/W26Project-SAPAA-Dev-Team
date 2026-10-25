import { route } from '@/lib/api/v1/server/auth';
import { createTrackUpload } from '@/lib/api/v1/server/tracks';

type Ctx = { params: Promise<{ slug: string }> };

/** Step 1 of an upload: a one-use signed URL for the caller's own folder in the track bucket. */
export const POST = route<Ctx>(async (caller, _req, { params }) => createTrackUpload(caller, (await params).slug));
