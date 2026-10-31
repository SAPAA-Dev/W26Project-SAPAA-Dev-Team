import { HttpError, route } from '@/lib/api/v1/server/auth';
import { getReport, updateReport } from '@/lib/api/v1/server/reports';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (caller, _req, { params }) => getReport(caller, (await params).id), { cache: true });

// The report's owner or an admin replaces its answers (checked in updateReport).
export const PUT = route<Ctx>(async (_caller, request, { params }) => {
  const body = await request.json().catch(() => {
    throw new HttpError(400, 'The body must be JSON.');
  });
  return updateReport((await params).id, body);
});
