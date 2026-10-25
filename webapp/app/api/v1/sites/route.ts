import { route, wantsInactive } from '@/lib/api/v1/server/auth';
import { listSites } from '@/lib/api/v1/server/sites';

export const GET = route((caller, request) => listSites(wantsInactive(caller, request), caller), { cache: true });
