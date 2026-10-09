import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { normaliseSocials, Socials, toSocials } from '@/lib/socials';

const PROFILE_SELECT = 'id, auth_user_id, display_name, skills, focus_areas';
// socials.person_id is the primary key, so PostgREST embeds one object (or null), not a list.
const PROFILE_WITH_SOCIALS_SELECT = `${PROFILE_SELECT}, socials(email, phone, website, instagram, facebook, x, linkedin)`;
const PAGE_SIZE = 10;
const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 40;
const MAX_DISPLAY_NAME_LENGTH = 29;

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
  sites_pa: { id: number; namesite: string; archived_at: string | null } | null;
};

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

export async function GET(request: NextRequest) {
  const viewer = await requireUser();
  if (!viewer) return NextResponse.json({ error: 'Sign in to view profiles.' }, { status: 401 });

  const requestedId = request.nextUrl.searchParams.get('personId');
  // people.id is a bigint. Anything else cannot match a row, so answer 404 instead of letting
  // PostgREST fail on the cast.
  if (requestedId !== null && !/^\d+$/.test(requestedId)) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }
  const pageValue = Number.parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
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
      stats: { inspectionCount: 0, distinctSiteCount: 0 },
      history: [],
      pagination: { page: 1, pageSize: PAGE_SIZE, total: 0 },
    });
  }

  // Role is display-only. It is never used here (or anywhere in this route) to
  // authorize a request.
  const { data: roleData } = await admin.auth.admin.getUserById(profile.auth_user_id);
  const role = roleData.user?.app_metadata?.role === 'admin' ? 'Admin' : 'Steward';
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Count sites in the database because loading every report only to count it is slow.
  // Archived reports stay saved for restore, but they do not belong in profile history.
  const [{ data: inspections, error: inspectionsError, count }, { data: siteCount, error: siteCountError }] =
    await Promise.all([
      admin
        .from('form_responses')
        .select('id, site_id, inspection_date, created_at, sites_pa(id, namesite, archived_at)', { count: 'exact' })
        .eq('user_id', profile.auth_user_id)
        .eq('is_active', true)
        .is('archived_at', null)
        .order('inspection_date', { ascending: false, nullsFirst: false })
        .range(from, to),
      admin.rpc('get_distinct_inspected_site_count', { p_user_id: profile.auth_user_id }),
    ]);

  if (inspectionsError || siteCountError) {
    return NextResponse.json({ error: 'Unable to load inspection history.' }, { status: 500 });
  }

  const history = ((inspections ?? []) as unknown as InspectionRow[]).map((inspection) => ({
    id: inspection.id,
    siteId: inspection.site_id,
    siteName: inspection.sites_pa?.namesite ?? 'Unknown site',
    // Archived sites are hidden from the app, so the profile lists their reports
    // without linking to the site page.
    siteArchived: inspection.sites_pa?.archived_at != null,
    inspectionDate: inspection.inspection_date ?? inspection.created_at,
  }));

  return NextResponse.json({
    profile: { ...summary, role },
    isOwner,
    stats: { inspectionCount: count ?? 0, distinctSiteCount: Number(siteCount ?? 0) },
    history,
    pagination: { page, pageSize: PAGE_SIZE, total: count ?? 0 },
  });
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

    if (socials) {
      const { error: socialsError } = await sessionClient
        .from('socials')
        .upsert({ person_id: (data as ProfileRow).id, ...socials }, { onConflict: 'person_id' });
      if (socialsError) return NextResponse.json({ error: 'Unable to save your contact details.' }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        id: (data as ProfileRow).id,
        displayName: (data as ProfileRow).display_name,
        skills: (data as ProfileRow).skills ?? [],
        focusAreas: (data as ProfileRow).focus_areas ?? [],
        ...(socials ? { socials } : {}),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid profile update.' },
      { status: 400 },
    );
  }
}
