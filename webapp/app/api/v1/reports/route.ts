import { HttpError, route } from '@/lib/api/v1/server/auth';
import { createReport, listReports } from '@/lib/api/v1/server/reports';

export const GET = route((caller) => listReports(caller), { cache: true });

export const POST = route(async (_caller, request) => {
  const body = await request.json().catch(() => {
    throw new HttpError(400, 'The body must be JSON.');
  });
  return createReport(body);
});
