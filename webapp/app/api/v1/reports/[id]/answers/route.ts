import { route } from '@/lib/api/v1/server/auth';
import { getReportAnswers } from '@/lib/api/v1/server/reports';

type Ctx = { params: Promise<{ id: string }> };

// Never cached: it is read just before an edit, and only the owner or an admin may read it.
export const GET = route<Ctx>(async (_caller, _req, { params }) => getReportAnswers((await params).id));
