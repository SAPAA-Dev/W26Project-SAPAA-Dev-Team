import type { Me } from '../types';
import type { Caller } from './auth';
import { db, fetchAll } from './db';

export async function getMe(caller: Caller): Promise<Me> {
  // Two reads side by side: the person with their assigned sites embedded, and their reports.
  const [{ data: person, error }, reports] = await Promise.all([
    db()
      .from('people')
      .select('id, display_name, site_stewards(site_id)')
      .eq('auth_user_id', caller.userId)
      .order('site_id', { referencedTable: 'site_stewards' })
      .maybeSingle(),
    fetchAll<{ site_id: number | null }>((from, to) =>
      db()
        .from('form_responses')
        .select('site_id')
        .eq('user_id', caller.userId)
        .eq('is_active', true)
        // A report whose site was deleted has no site; profile history leaves it out (app/api/profile).
        .not('site_id', 'is', null)
        .is('archived_at', null)
        .order('id')
        .range(from, to)
    ),
  ]);
  if (error) throw new Error(error.message);

  return {
    userId: caller.userId,
    email: caller.email,
    role: caller.isAdmin ? 'admin' : 'steward',
    approved: true, // requireCaller already refused unapproved users
    person: person ? { id: person.id, name: person.display_name } : null,
    stats: {
      reports: reports.length,
      sites: new Set(reports.map((r) => r.site_id).filter((id) => id !== null)).size,
    },
    assignedSiteIds: (person?.site_stewards ?? []).map((row: { site_id: number }) => row.site_id),
  };
}
