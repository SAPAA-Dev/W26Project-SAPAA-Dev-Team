import { route } from '@/lib/api/v1/server/auth';
import { getForm } from '@/lib/api/v1/server/form';

export const GET = route(() => getForm(), { cache: true });
