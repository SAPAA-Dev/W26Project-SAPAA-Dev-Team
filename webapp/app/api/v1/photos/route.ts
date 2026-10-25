import { route } from '@/lib/api/v1/server/auth';
import { listPhotos } from '@/lib/api/v1/server/photos';

export const GET = route((caller) => listPhotos(caller), { cache: true });
