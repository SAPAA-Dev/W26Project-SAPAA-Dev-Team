import { route, wantsInactive } from '@/lib/api/v1/server/auth';
import { getSiteDetail } from '@/lib/api/v1/server/sites';

type Ctx = { params: Promise<{ slug: string }> };

// Next decodes dynamic segments, so slug is already the namesite.
export const GET = route<Ctx>(
  async (caller, req, { params }) => getSiteDetail((await params).slug, wantsInactive(caller, req), caller),
  { cache: true }
);
