import { route } from '@/lib/api/v1/server/auth';
import { getTrackLines } from '@/lib/api/v1/server/tracks';

export const GET = route(() => getTrackLines(), { cache: true });
