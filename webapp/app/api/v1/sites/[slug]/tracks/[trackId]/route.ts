import { route } from '@/lib/api/v1/server/auth';
import { deleteTrack } from '@/lib/api/v1/server/tracks';

type Ctx = { params: Promise<{ slug: string; trackId: string }> };

export const DELETE = route<Ctx>(async (caller, _req, { params }) => {
  const { slug, trackId } = await params;
  return deleteTrack(caller, slug, trackId);
});
