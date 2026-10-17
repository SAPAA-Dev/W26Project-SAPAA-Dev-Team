import type { AdminInbox } from '../types';
import { HttpError, type Caller } from './auth';
import { db } from './db';
import { listReports } from './reports';
import { listSites } from './sites';

export async function getAdminInbox(caller: Caller): Promise<AdminInbox> {
  if (!caller.isAdmin) throw new HttpError(403, 'Only admins can view the inbox.');

  const [users, reports, sites] = await Promise.all([
    // ponytail: one page of 1000 auth users; page through listUsers if the project grows past that.
    db().auth.admin.listUsers({ perPage: 1000 }),
    listReports(caller),
    listSites(),
  ]);
  if (users.error) throw new Error(users.error.message);

  return {
    pendingUsers: users.data.users
      .filter((u) => u.app_metadata?.authenticated !== true)
      .map((u) => ({ id: u.id, email: u.email ?? null, createdAt: u.created_at }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    recentReports: reports.slice(0, 10),
    overdueSites: sites
      .filter((s) => s.status === 'overdue')
      .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0)),
  };
}
