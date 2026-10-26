import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { normaliseSocials, Socials, toSocials } from '@/lib/socials';
import { collectTagOptions } from '@/lib/profileTags';

const PROFILE_SELECT = 'id, auth_user_id, display_name, skills, focus_areas';
// socials.person_id is the primary key, so PostgREST embeds one object (or null), not a list.
const PROFILE_WITH_SOCIALS_SELECT = `${PROFILE_SELECT}, socials(email, phone, website, instagram, facebook, x, linkedin)`;
const PAGE_SIZE = 10;
const AGGREGATE_PAGE_SIZE = 1000;
const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 40;
const MAX_DISPLAY_NAME_LENGTH = 29;
const MAX_BIGINT = BigInt('9223372036854775807');
// A larger page would reach PostgREST as an offset like "1e+21", which it cannot read. Any page
// this high is past the last report anyway, so it gets the empty page below.
const MAX_PAGE = 100_000;

type ProfileRow = {
  id: number;
  auth_user_id: string | null;
  display_name: string;
  skills: string[] | null;
  focus_areas: string[] | null;
  socials?: Partial<Socials> | null;
};

type InspectionRow = {
  id: number;
  site_id: number | null;
  inspection_date: string | null;
  created_at: string | null;
  sites_pa: { id: number; namesite: string; archived_at: string | null; is_active: boolean | null } | null;
};

type AggregateInspectionRow = {
  id: number;
  site_id: number | null;
  inspection_date: string | null;
  created_at: string | null;
  sites_pa: {
    id: number;
    namesite: string;
    ab_counties: { id: number; county: string } | null;
  } | null;
};

type NamedCount = { name: string; count: number };

function profileTableMissing(error: { code?: string } | null) {
  return error?.code === '42P01';
}

function unavailableResponse() {
  return NextResponse.json(
    { error: 'Profile data is being prepared. Please try again after the profile migration is applied.' },
    { status: 503 },
  );
}

function normaliseTags(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_TAGS) {
    throw new Error(`${field} must contain no more than ${MAX_TAGS} entries.`);
  }

  const tags = value.map((tag) => {
    if (typeof tag !== 'string') throw new Error(`${field} entries must be text.`);
    const trimmed = tag.trim();
    if (!trimmed || trimmed.length > MAX_TAG_LENGTH) {
      throw new Error(`${field} entries must be between 1 and ${MAX_TAG_LENGTH} characters.`);
    }
    return trimmed;
  });

  return [...new Set(tags)];
}

async function requireUser() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET reads with the service role, so it repeats the approval check that row level security
// applies to people and socials (20261010000100_require_approval_for_people_reads.sql).
function isApproved(user: { app_metadata?: Record<string, unknown> }) {
  return user.app_metadata?.authenticated === true;
}

function incrementNamedCount(counts: Map<number, NamedCount>, id: number, name: string) {
  const current = counts.get(id);
  counts.set(id, { name, count: (current?.count ?? 0) + 1 });
}

function mostCommon(counts: Map<number, NamedCount>) {
  return [...counts.values()].sort((left, right) =>
    right.count - left.count || left.name.localeCompare(right.name)
  )[0] ?? null;
}

function buildContributionStats(reports: AggregateInspectionRow[], accountCreatedAt: string | null) {
  const siteCounts = new Map<number, NamedCount>();
  const countyCounts = new Map<number, NamedCount>();
  const currentYear = new Date().getUTCFullYear();
  let reportsThisYear = 0;
  let mostRecentSite: { name: string; inspectionDate: string } | null = null;

  for (const report of reports) {
    if (report.created_at && new Date(report.created_at).getUTCFullYear() === currentYear) {
      reportsThisYear += 1;
    }

    const site = report.sites_pa;
    if (!site) continue;

    incrementNamedCount(siteCounts, site.id, site.namesite);
    if (site.ab_counties) {
      incrementNamedCount(countyCounts, site.ab_counties.id, site.ab_counties.county);
    }

    const inspectionDate = report.inspection_date ?? report.created_at;
    if (
      inspectionDate
      && (!mostRecentSite || new Date(inspectionDate).getTime() > new Date(mostRecentSite.inspectionDate).getTime())
    ) {
      mostRecentSite = { name: site.namesite, inspectionDate };
    }
  }

  const topSite = mostCommon(siteCounts);
  const topCounty = mostCommon(countyCounts);

  return {
    topSite: topSite ? { name: topSite.name, visitCount: topSite.count } : null,
    mostRecentSite,
    reportsThisYear,
    accountCreatedAt,
    countyCount: countyCounts.size,
    topCounty: topCounty ? { name: topCounty.name, reportCount: topCounty.count } : null,
  };
}

export async function GET(request: NextRequest) {
  const viewer = await requireUser();
  if (!viewer) return NextResponse.json({ error: 'Sign in to view profiles.' }, { status: 401 });
  if (!isApproved(viewer)) {
    return NextResponse.json({ error: 'Your account is waiting for admin approval.' }, { status: 403 });
  }

  const requestedId = request.nextUrl.searchParams.get('personId');
  // people.id is a bigint. Anything else cannot match a row, so answer 404 instead of letting
  // PostgREST fail on the cast with a 500.
  if (requestedId !== null && (!/^\d+$/.test(requestedId) || BigInt(requestedId) > MAX_BIGINT)) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }
  const pageValue = Number.parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.min(pageValue, MAX_PAGE) : 1;
  const admin = createServerSupabase();
  const profileQuery = admin.from('people').select(PROFILE_WITH_SOCIALS_SELECT);
  const { data, error } = requestedId
    ? await profileQuery.eq('id', requestedId).maybeSingle()
    : await profileQuery.eq('auth_user_id', viewer.id).maybeSingle();

  if (profileTableMissing(error)) return unavailableResponse();
  if (error) return NextResponse.json({ error: 'Unable to load this profile.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

  const profile = data as ProfileRow;
  const isOwner = profile.auth_user_id === viewer.id;
  const summary = {
    id: profile.id,
    displayName: profile.display_name,
    skills: profile.skills ?? [],
    focusAreas: profile.focus_areas ?? [],
    socials: toSocials(profile.socials),
  };

  // A person with no linked login cannot own inspections, and user_id is a uuid, so the
  // inspection queries must not run at all.
  if (!profile.auth_user_id) {
    return NextResponse.json({
      profile: { ...summary, role: 'Steward' },
      isOwner,
      stats: {
        inspectionCount: 0,
        distinctSiteCount: 0,
        topSite: null,
        mostRecentSite: null,
        reportsThisYear: 0,
        accountCreatedAt: null,
        countyCount: 0,
        topCounty: null,
      },
      history: [],
      pagination: { page: 1, pageSize: PAGE_SIZE, total: 0 },
    });
  }

  // Role is display-only. It is never used here (or anywhere in this route) to
  // authorize a request.
  const { data: roleData } = await admin.auth.admin.getUserById(profile.auth_user_id);
  const role = roleData.user?.app_metadata?.role === 'admin' ? 'Admin' : 'Steward';
  const accountCreatedAt = roleData.user?.created_at ?? null;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Archived reports stay saved for restore, but they do not belong in profile history.
  const activeReports = (columns: string, options?: { count: 'exact'; head?: boolean }) =>
    admin
      .from('form_responses')
      .select(columns, options)
      .eq('user_id', profile.auth_user_id)
      .eq('is_active', true)
      .not('site_id', 'is', null)
      .is('archived_at', null);

  const fetchAggregateReports = async () => {
    const reports: AggregateInspectionRow[] = [];

    for (let from = 0; ; from += AGGREGATE_PAGE_SIZE) {
      const { data: reportPage, error: reportError } = await activeReports(
        'id, site_id, inspection_date, created_at, sites_pa(id, namesite, ab_counties(id, county))',
      )
        .order('id', { ascending: true })
        .range(from, from + AGGREGATE_PAGE_SIZE - 1)
        .overrideTypes<AggregateInspectionRow[], { merge: false }>();

      if (reportError) return { data: null, error: reportError };

      const pageRows = reportPage ?? [];
      reports.push(...pageRows);
      if (pageRows.length < AGGREGATE_PAGE_SIZE) break;
    }

    return { data: reports, error: null };
  };

  // Count sites in the database because loading every report only to count it is slow.
  const [historyResult, { data: siteCount, error: siteCountError }] =
    await Promise.all([
      activeReports('id, site_id, inspection_date, created_at, sites_pa(id, namesite, archived_at, is_active)', { count: 'exact' })
        .order('inspection_date', { ascending: false, nullsFirst: false })
        .range(from, to)
        .overrideTypes<InspectionRow[], { merge: false }>(),
      admin.rpc('get_distinct_inspected_site_count', { p_user_id: profile.auth_user_id }),
    ]);

  let { data: inspections, error: inspectionsError, count } = historyResult;
  // PostgREST refuses an offset past the last report with PGRST103 and sends no count. That page
  // is empty, so count the reports on their own and answer with an empty history.
  if (inspectionsError?.code === 'PGRST103') {
    const totalResult = await activeReports('id', { count: 'exact', head: true });
    inspections = [];
    inspectionsError = totalResult.error;
    count = totalResult.count;
  }

  if (inspectionsError || siteCountError) {
    return NextResponse.json({ error: 'Unable to load inspection history.' }, { status: 500 });
  }

  const { data: aggregateReports, error: aggregateError } = await fetchAggregateReports();
  if (aggregateError || !aggregateReports) {
    return NextResponse.json({ error: 'Unable to load profile activity.' }, { status: 500 });
  }

  const contributionStats = buildContributionStats(aggregateReports, accountCreatedAt);

  const history = (inspections ?? []).filter((inspection) => inspection.site_id !== null).map((inspection) => ({
    id: inspection.id,
    siteId: inspection.site_id,
    siteName: inspection.sites_pa?.namesite ?? 'Unknown site',
    // Archived sites are hidden from the app, so the profile lists their reports
    // without linking to the site page.
    siteArchived: inspection.sites_pa?.archived_at != null,
    // A deactivated site's page shows an error, so it is not linked either.
    siteInactive: inspection.sites_pa?.is_active === false,
    inspectionDate: inspection.inspection_date ?? inspection.created_at,
  }));

  return NextResponse.json({
    profile: { ...summary, role },
    isOwner,
    stats: {
      inspectionCount: count ?? 0,
      distinctSiteCount: Number(siteCount ?? 0),
      ...contributionStats,
    },
    history,
    pagination: { page, pageSize: PAGE_SIZE, total: count ?? 0 },
    options: isOwner ? await loadTagOptions(admin) : undefined,
  });
}

// 1.0.6: only the owner edits, so only the owner gets the values that other profiles use.
// The values carry no names, so the list does not say who has which skill.
async function loadTagOptions(admin: ReturnType<typeof createServerSupabase>) {
  const { data, error } = await admin
    .from('people')
    .select('skills, focus_areas')
    .overrideTypes<Array<Pick<ProfileRow, 'skills' | 'focus_areas'>>, { merge: false }>();
  // The picker still works with no list: the person can use Other.
  if (error || !data) return { skills: [], focusAreas: [] };
  return {
    skills: collectTagOptions(data.map((row) => row.skills)),
    focusAreas: collectTagOptions(data.map((row) => row.focus_areas)),
  };
}

export async function PATCH(request: NextRequest) {
  // This route writes, so it uses the signed-in client, not the service role. Row level security
  // and the column grant on public.people are what stop the write, not this code.
  const sessionClient = await createClient();
  const { data: { user: viewer }, error: viewerError } = await sessionClient.auth.getUser();
  if (viewerError || !viewer) return NextResponse.json({ error: 'Sign in to edit your profile.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid profile update.' }, { status: 400 });
  }

  try {
    if (typeof body.displayName !== 'string') throw new Error('Display name is required.');
    const displayName = body.displayName.trim();
    // people.display_name has check (length(trim(display_name)) < 30), so 29 characters is the
    // longest name the database accepts. 20261004000000_create_user_model.sql:9
    if (!displayName || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      throw new Error(`Display name must be between 1 and ${MAX_DISPLAY_NAME_LENGTH} characters.`);
    }

    const update = {
      display_name: displayName,
      skills: normaliseTags(body.skills, 'Skills'),
      focus_areas: normaliseTags(body.focusAreas, 'Focus areas'),
    };
    // Older clients send no socials. Then they are left as they are.
    const socials = body.socials === undefined ? null : normaliseSocials(body.socials);
    const { data, error } = await sessionClient
      .from('people')
      .update(update)
      .eq('auth_user_id', viewer.id)
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (profileTableMissing(error)) return unavailableResponse();
    if (error) return NextResponse.json({ error: 'Unable to save your profile.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

    const saved = {
      id: (data as ProfileRow).id,
      displayName: (data as ProfileRow).display_name,
      skills: (data as ProfileRow).skills ?? [],
      focusAreas: (data as ProfileRow).focus_areas ?? [],
    };

    if (socials) {
      const { error: socialsError } = await sessionClient
        .from('socials')
        .upsert({ person_id: saved.id, ...socials }, { onConflict: 'person_id' });
      // The name, skills and focus areas are already saved, so send them back with the error and
      // the page can show what is stored.
      if (socialsError) {
        return NextResponse.json(
          { error: 'Your name, skills and focus areas were saved, but your contact details were not. Try again.', profile: saved },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ profile: { ...saved, ...(socials ? { socials } : {}) } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid profile update.' },
      { status: 400 },
    );
  }
}
