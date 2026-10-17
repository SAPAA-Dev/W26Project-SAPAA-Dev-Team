import { route, wantsInactive } from '@/lib/api/v1/server/auth';
import { listPhotos } from '@/lib/api/v1/server/photos';
import { findSite } from '@/lib/api/v1/server/sites';

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route<Ctx>(async (caller, req, { params }) => {
  const includeInactive = wantsInactive(caller, req);
  return listPhotos((await findSite((await params).slug, includeInactive)).id, includeInactive);
}, { cache: true });
