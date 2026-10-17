import { route } from '@/lib/api/v1/server/auth';
import { getReport } from '@/lib/api/v1/server/reports';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (caller, _req, { params }) => getReport(caller, (await params).id), { cache: true });
