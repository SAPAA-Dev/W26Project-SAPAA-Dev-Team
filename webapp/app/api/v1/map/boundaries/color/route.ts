import { HttpError, route } from '@/lib/api/v1/server/auth';
import { setBoundaryColor } from '@/lib/api/v1/server/boundaries';

export const PUT = route(async (caller, request) => {
  const body = await request.json().catch(() => {
    throw new HttpError(400, 'The body must be JSON.');
  });
  return setBoundaryColor(caller, body);
});
