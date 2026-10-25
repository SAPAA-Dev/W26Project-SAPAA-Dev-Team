import { route } from '@/lib/api/v1/server/auth';
import { getInspectionHistory } from '@/lib/api/v1/server/history';

export const GET = route(
  (caller, request) => {
    const params = new URL(request.url).searchParams;
    return getInspectionHistory(caller, params.get('person'), params.get('page'));
  },
  { cache: true }
);
