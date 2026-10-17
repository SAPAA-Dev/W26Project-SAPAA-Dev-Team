import { route } from '@/lib/api/v1/server/auth';
import { getBoundaries } from '@/lib/api/v1/server/boundaries';

export const GET = route((caller) => getBoundaries(caller), { cache: true });
