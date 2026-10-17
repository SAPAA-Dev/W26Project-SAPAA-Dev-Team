import { route, wantsInactive } from '@/lib/api/v1/server/auth';
import { listReports } from '@/lib/api/v1/server/reports';
import { findSite } from '@/lib/api/v1/server/sites';

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route<Ctx>(
  async (caller, req, { params }) => {
    const includeInactive = wantsInactive(caller, req);
    const slug = (await params).slug;
    // findSite only decides the 404; the reports filter on the same slug, so both reads run at once.
    const [, reports] = await Promise.all([
      findSite(slug, includeInactive),
      listReports(caller, { siteSlug: slug, withAnswers: true, includeInactive }),
    ]);
    return reports;
  },
  { cache: true }
);
