import { route } from '@/lib/api/v1/server/auth';
import { getMe } from '@/lib/api/v1/server/me';

export const GET = route((caller) => getMe(caller), { cache: true });
