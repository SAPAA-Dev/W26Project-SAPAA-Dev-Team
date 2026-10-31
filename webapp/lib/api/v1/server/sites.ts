import { boundaryBounds, type GeoJsonMultiPolygon } from '@/lib/map/boundaries';
import { SITE_PAGE_FIELDS } from '@/lib/sitePageFields';
import { getSiteLinks } from '@/utils/supabase/queries';
import { statusForDays, type SiteDetail, type SiteLink, type SiteSummary } from '../types';
import { HttpError, type Caller } from './auth';
import { daysSince, db, fetchAll, naturalnessOf, naturalnessQuestionIds, reportDate } from './db';
import { canReadHidden } from './visibility';

interface AreaRow {
  id: number;
  area_type: string | null;
  hectares: number | string | null;
  area_ha: number | string | null;
  geometry?: GeoJsonMultiPolygon;
}
interface SiteRow {
  id: number;
  namesite: string;
  is_active: boolean | null;
  protected_area_id: number | null;
  ab_counties: { county: string } | null;
  protected_areas: AreaRow | null;
}
interface ReportRow {
  id: number;
  site_id: number;
  user_id: string | null;
  inspection_date: string | null;
  created_at: string | null;
}

/**
 * Sites the app shows: active and not archived. A null is_active counts as active, as in queries.ts.
 * includeInactive (admins only, see wantsInactive) adds the deactivated ones; archived sites never show.
 */
export function visibleSites(columns: string, includeInactive = false) {
  const q = db().from('sites_pa').select(columns).is('archived_at', null);
  return includeInactive ? q : q.or('is_active.eq.true,is_active.is.null');
}

/** Resolves a URL slug (namesite) to a visible site, or 404. */
export async function findSite(slug: string, includeInactive = false): Promise<{ id: number; namesite: string }> {
  const { data, error } = await visibleSites('id, namesite', includeInactive).eq('namesite', slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, 'Site not found.');
  return data as unknown as { id: number; namesite: string };
}

/** Reports, naturalness answers and steward links, for the given site ids or (null) every site. */
async function related(ids: number[] | null) {
  const natIds = await naturalnessQuestionIds();
  return Promise.all([
    fetchAll<ReportRow>((from, to) => {
      let q = db()
        .from('form_responses')
        .select('id, site_id, user_id, inspection_date, created_at')
        .eq('is_active', true)
        .is('archived_at', null)
        .not('site_id', 'is', null);
      if (ids) q = q.in('site_id', ids);
      return q.order('id').range(from, to);
    }),
    fetchAll<{ response_id: number; obs_value: string | null; is_hidden?: boolean | null }>((from, to) => {
      // One site reads only its own answers (through the report), not every site's.
      let q = db()
        .from('answers')
        .select(
          ids ? 'response_id, obs_value, is_hidden, form_responses!inner(site_id)' : 'response_id, obs_value, is_hidden'
        )
        .in('question_id', natIds);
      if (ids) q = q.in('form_responses.site_id', ids);
      return q.order('id').range(from, to);
    }),
    fetchAll<{ site_id: number; people: { id: number; display_name: string } | null }>((from, to) => {
      let q = db().from('site_stewards').select('site_id, people(id, display_name)');
      if (ids) q = q.in('site_id', ids);
      return q.order('site_id').range(from, to);
    }),
  ]);
}

/**
 * Builds the summaries from four bulk reads (sites with their areas, reports, naturalness answers,
 * stewards). The whole list runs them all at once; `namesite` narrows everything to one site, whose
 * other reads wait for its id.
 */
export async function loadSites(
  namesite?: string,
  includeInactive = false,
  { geometry = true, caller }: { geometry?: boolean; caller?: Caller } = {}
) {
  const siteRows = fetchAll<SiteRow>((from, to) => {
    // Without geometry (the map's boundary read has its own copy) a summary has no center.
    const area = `protected_areas(id, area_type, hectares, area_ha${geometry ? ', geometry' : ''})`;
    const q = visibleSites(`id, namesite, is_active, protected_area_id, ab_counties(county), ${area}`, includeInactive);
    return (namesite !== undefined ? q.eq('namesite', namesite) : q).order('namesite').order('id').range(from, to);
  });
  const trend = new Map<number, { date: string; score: number }[]>();
  const areaBySite = new Map<number, number>();
  const [sites, [reports, natAnswers, stewards]] =
    namesite === undefined
      ? await Promise.all([siteRows, related(null)])
      : await siteRows.then(async (rows) => [rows, rows.length ? await related(rows.map((s) => s.id)) : [[], [], []]] as const);
  if (sites.length === 0) return { sites: [] as SiteSummary[], areaBySite, trend };

  // A hidden naturalness answer counts toward the average and trend only for an admin or the report's owner
  // (no caller: for nobody), the same rule as getFormResponsesBySite.
  const ownerOf = new Map(reports.map((report) => [report.id, report.user_id]));
  const scoreByReport = new Map<number, number>();
  for (const answer of natAnswers) {
    if (answer.is_hidden === true && !canReadHidden(caller, ownerOf.get(answer.response_id))) continue;
    const nat = naturalnessOf(answer.obs_value);
    if (nat) scoreByReport.set(answer.response_id, nat.score);
  }
  const reportsBySite = new Map<number, ReportRow[]>();
  for (const report of reports) {
    const list = reportsBySite.get(report.site_id) ?? [];
    list.push(report);
    reportsBySite.set(report.site_id, list);
  }
  const stewardBySite = new Map(stewards.map((row) => [row.site_id, row.people]));

  const summaries: SiteSummary[] = sites.map((site) => {
    const siteReports = (reportsBySite.get(site.id) ?? [])
      .map((report) => ({ date: reportDate(report), score: scoreByReport.get(report.id) }))
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
    const scored = siteReports.filter((r): r is { date: string; score: number } => r.date !== null && r.score !== undefined);
    trend.set(site.id, scored);

    const last = siteReports.at(-1)?.date ?? null;
    const days = daysSince(last);
    const area = site.protected_areas ?? undefined;
    if (area) areaBySite.set(site.id, area.id);
    const bounds = area?.geometry ? boundaryBounds(area.geometry) : null;
    const hectares = area ? Number(area.hectares ?? area.area_ha ?? NaN) : NaN;
    const steward = stewardBySite.get(site.id);

    return {
      id: site.id,
      slug: site.namesite,
      name: site.namesite,
      county: site.ab_counties?.county ?? null,
      isActive: site.is_active ?? true,
      lastInspection: last,
      daysSince: days,
      status: statusForDays(days),
      reportCount: siteReports.length,
      avgNaturalness: scored.length
        ? Math.round((scored.reduce((sum, r) => sum + r.score, 0) / scored.length) * 10) / 10
        : null,
      steward: steward ? { id: steward.id, name: steward.display_name } : null,
      areaType: area?.area_type ?? null,
      hectares: Number.isFinite(hectares) ? hectares : null,
      center: bounds
        ? [round5((bounds[0][0] + bounds[1][0]) / 2), round5((bounds[0][1] + bounds[1][1]) / 2)]
        : null,
    };
  });

  return { sites: summaries, areaBySite, trend };
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export async function listSites(includeInactive = false, caller?: Caller): Promise<SiteSummary[]> {
  return (await loadSites(undefined, includeInactive, { caller })).sites;
}

export async function getSiteDetail(slug: string, includeInactive = false, caller?: Caller): Promise<SiteDetail> {
  // The links need only the site's id, so they load beside the summary instead of after it.
  const [{ sites, trend }, shown] = await Promise.all([
    loadSites(slug, includeInactive, { caller }),
    findSite(slug, includeInactive).then((found) => getSiteLinks(found.id)),
  ]);
  const site = sites[0];
  if (!site) throw new HttpError(404, 'Site not found.');

  const label = (key: string) => SITE_PAGE_FIELDS.find((field) => field.key === key)?.label ?? key;
  const links: SiteLink[] = [
    { key: 'sapaa_website', label: label('sapaa_website'), url: shown.sapaaWebsiteUrl },
    { key: 'inaturalist', label: label('inaturalist'), url: shown.iNaturalistUrl },
  ].filter((link): link is SiteLink => Boolean(link.url));

  return { ...site, links, naturalnessTrend: trend.get(site.id) ?? [] };
}
