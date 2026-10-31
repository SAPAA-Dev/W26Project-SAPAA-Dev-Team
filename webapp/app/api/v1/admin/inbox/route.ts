import { route } from '@/lib/api/v1/server/auth';
import { getAdminInbox } from '@/lib/api/v1/server/admin';

export const GET = route((caller) => getAdminInbox(caller));
