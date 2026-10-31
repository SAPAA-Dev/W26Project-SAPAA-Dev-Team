import type { InspectionHistory } from '../types';
import { HttpError, type Caller } from './auth';
import { db, reportDate } from './db';

// The same rules as GET in app/api/profile/route.ts: any approved user may read a profile's history.
const PAGE_SIZE = 10;
const MAX_BIGINT = BigInt('9223372036854775807');
// A larger page would reach PostgREST as an offset like "1e+21", which it cannot read.
const MAX_PAGE = 100_000;

interface HistoryRow {
  id: number;
  site_id: number;
  inspection_date: string | null;
  created_at: string | null;
  sites_pa: { id: number; namesite: string; archived_at: string | null; is_active: boolean | null } | null;
}

const COLUMNS = 'id, site_id, inspection_date, created_at, sites_pa(id, namesite, archived_at, is_active)';

/**
 * One page of a steward's profile history: active, non-archived reports on a site that still exists,
 * newest first. Reports on an archived or deactivated site are listed but cannot be opened (canOpen).
 * `person` is a people.id; without it the history is the caller's own.
 */
export async function getInspectionHistory(
  caller: Caller,
  person: string | null,
  pageParam: string | null
): Promise<InspectionHistory> {
  const pageValue = Number.parseInt(pageParam ?? '1', 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.min(pageValue, MAX_PAGE) : 1;
  const empty: InspectionHistory = { items: [], page: 1, pageSize: PAGE_SIZE, total: 0 };

  let userId: string | null = caller.userId;
  if (person !== null) {
    // people.id is a bigint. Anything else cannot match a row.
    if (!/^\d+$/.test(person) || BigInt(person) > MAX_BIGINT) throw new HttpError(404, 'Profile not found.');
    const { data, error } = await db().from('people').select('auth_user_id').eq('id', person).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new HttpError(404, 'Profile not found.');
    userId = data.auth_user_id;
  }
  // A person with no linked login owns no reports, and user_id is a uuid, so the query must not run.
  if (!userId) return empty;

  const from = (page - 1) * PAGE_SIZE;
  const active = (columns: string, options: { count: 'exact'; head?: boolean }) =>
    db()
      .from('form_responses')
      .select(columns, options)
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('site_id', 'is', null)
      .is('archived_at', null);

  let { data, error, count } = await active(COLUMNS, { count: 'exact' })
    .order('inspection_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  // PostgREST refuses an offset past the last report (PGRST103) and sends no count: count on its own.
  if (error?.code === 'PGRST103') {
    ({ error, count } = await active('id', { count: 'exact', head: true }));
    data = [];
  }
  if (error) throw new Error(error.message);

  return {
    items: ((data ?? []) as unknown as HistoryRow[]).map((row) => {
      const siteArchived = row.sites_pa?.archived_at != null;
      const siteInactive = row.sites_pa?.is_active === false;
      return {
        id: row.id,
        siteId: row.site_id,
        siteSlug: row.sites_pa?.namesite ?? '',
        siteName: row.sites_pa?.namesite ?? 'Unknown site',
        siteArchived,
        siteInactive,
        date: reportDate(row),
        canOpen: row.sites_pa !== null && !siteArchived && !siteInactive,
      };
    }),
    page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
  };
}
