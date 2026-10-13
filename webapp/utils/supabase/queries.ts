'use server';

import { createServerSupabase, createClient } from './server';
import { deleteObjectsByKeys } from '../media/s3Delete';
import { isAllowedStorageKey } from '../media/storageKeys';
import {
  toBoundaryFeatureCollection,
  type BoundaryFeatureCollection,
  type ProtectedAreaBoundaryRow,
} from '../../lib/map/boundaries';

import { SITE_PAGE_FIELDS } from '@/lib/sitePageFields';
import {
  getAttachmentsByResponseId,
  getReportQuestionKeyMap,
  reduceAnswers,
  type FormResponseRow,
} from '@/lib/pdf/reportQueries';

export interface SiteSummary {
  id: number;
  namesite: string;
  county: string | null;
  ab_county: number | null;
  inspectdate: string | null;
  is_active: boolean;
  archived_at: string | null;
  protected_area_id?: number | null;
}

export interface ProtectedAreaChoice {
  id: number;
  name: string;
  fid: number;
  area_type: string;
}

export interface County {
  id: number;
  county: string;
}

export interface InspectionDetail {
  id: number;
  namesite: string;
  _type: string | null;
  county: string | null;
  _naregion: string | null;
  inspectdate: string | null;
  naturalness_score: string | null;
  naturalness_details: string | null;
  notes: string | null;
  steward: string | null;
}

export interface InspectionForm {
  id: number;
  namesite: string;
  questions: Array<question> | null;
  sections: Array<string>
  inspectdate: string | null;
}

export interface question {
  id: number;
  section: number;
  title: string | null;
  text: string | null;
  question_type: string;
  is_required: boolean | null;
  answers: Array<string>;
  formorder?: number | null; 
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  sectionHeader?: string | null;
}

interface SupabaseAnswer {
  response_id: number; 
  question_id: number;
  obs_value: string | null;
  obs_comm: string | null;
}

export interface FormResponse {
  id: number;
  user_id: string | null;
  created_at: string | null;
  inspection_date: string | null;
  inspection_no: string | null;
  naturalness_score: string | null;
  naturalness_details: string | null;  
  steward: string | null;
  answers: FormAnswer[];
}

export interface ArchivedSiteInspectionReport {
  id: number;
  inspectionNo: string | null;
  inspectionDate: string | null;
  createdAt: string | null;
  isActive: boolean;
  archivedAt: string;
  siteId: number | null;
  siteName: string | null;
  submitterId: number | null;
  submitterName: string | null;
}

export interface FormAnswer {
  question_id: number;
  question_text: string;
  obs_value: string | null;
  obs_comm: string | null;
  section_id: number | null;
  section_title: string | null;
}

// One row of the all-reports page. siteName is null when the site was permanently
// deleted, siteArchived marks reports whose site is hidden from the app, and siteInactive
// marks reports whose site is deactivated, so its page cannot be opened.
export interface SiteReportSummary {
  id: number;
  inspectionNo: string | null;
  inspectionDate: string | null;
  createdAt: string | null;
  siteId: number | null;
  siteName: string | null;
  siteArchived: boolean;
  siteInactive: boolean;
  submitterId: number | null;
  submitterName: string | null;
}

// The untyped client types a many-to-one embed as an array; at runtime it is one object.
interface SiteRow {
  id: number;
  namesite: string;
  ab_county: number | null;
  is_active: boolean | null;
  archived_at: string | null;
  protected_area_id?: number | null;
  ab_counties: { county: string } | null;
  form_responses: Array<{ inspection_date: string | null; created_at: string | null; archived_at: string | null }> | null;
}

function getLatestInspectionDate(
  responses: Array<{
    inspection_date?: string | null;
    created_at?: string | null;
    archived_at?: string | null;
  }>
): string | null {
  // An archived report must not set the latest date shown for a site.
  const visibleResponses = responses.filter((response) => !response.archived_at);
  if (visibleResponses.length === 0) return null;

  const sortedResponses = [...visibleResponses].sort((a, b) => {
    const dateA = a.inspection_date ?? a.created_at ?? '';
    const dateB = b.inspection_date ?? b.created_at ?? '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return sortedResponses[0]?.inspection_date ?? sortedResponses[0]?.created_at ?? null;
}

export async function uploadSiteInspectionAnswers(batchArray: SupabaseAnswer[]) {
  for (const responseId of new Set(batchArray.map((answer) => answer.response_id))) {
    await requireReportWriter(responseId);
  }
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('answers')
    .insert(batchArray);

  if (error) {
    throw new Error(error.message || 'Failed to add site inspection answers');
  }
  return data;
}

export async function getQuestionResponseType() {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('questions')
    .select('id, obs_value, obs_comm')
    .eq('is_active', true);

  if (error) {
    throw new Error(error.message || 'Failed to fetch question response types');
  }

  return (data ?? []).map((q) => ({
    question_id: q.id,
    obs_value: q.obs_value,
    obs_comm: q.obs_comm,
  }));
}

// Not exported: only addSiteInspectionReport calls it, after its caller check.
async function getNextFormInspectionNumber() {
  const supabase = createServerSupabase();
  const currentYear = new Date().getFullYear();
  // The database compares the numbers, so "2026-1000" follows "2026-999" and the
  // 1000-row response limit cannot hide the highest one. An empty year returns 0.
  const { data, error } = await supabase.rpc('get_max_inspection_number', {
    p_year: currentYear,
  });

  // A report saved without a number cannot be numbered later, so fail the submission.
  if (error) throw new Error(error.message || 'Failed to get the next inspection number');

  const nextNum = Number(data ?? 0) + 1;
  const paddedNum = nextNum.toString().padStart(3, "0");
  return `${currentYear}-${paddedNum}`;
}

export async function addSiteInspectionReport(siteId: number, inspectionDate: string) {
  // The report belongs to the signed-in user, never to an id the browser sends.
  const caller = await requireApprovedCaller('Only approved users can submit reports.');
  const supabase = createServerSupabase();

  // The page hides deactivated and archived sites, but this action is callable directly.
  const { data: site, error: siteError } = await supabase
    .from('sites_pa')
    .select('id')
    .eq('id', siteId)
    .is('archived_at', null)
    .or('is_active.eq.true,is_active.is.null')
    .maybeSingle();

  if (siteError) throw new Error(siteError.message || 'Failed to check the site');
  if (!site) throw new Error('This site is not accepting new reports.');

  const newInspectNo = await getNextFormInspectionNumber();

  const { data, error } = await supabase
    .from('form_responses')
    .insert({
      site_id: siteId,
      user_id: caller.userId,
      inspection_no: newInspectNo,
      inspection_date: inspectionDate,
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(error.message || 'Failed to add site inspection report');
  }
  return data;
}

const REPORT_WRITE_DENIED = 'You are not allowed to change this report.';
// queries.ts is 'use server', so the browser can call each exported read with any arguments.
const READ_DENIED = 'Only approved users can view this data.';
const REPORT_VIEW_DENIED = 'You are not allowed to view this report.';

// Report writes run with the service role, so each one checks the caller first.
// Only the report owner or an approved admin may change a report, and an archived
// report changes only through the admin archive actions.
async function requireReportWriter(responseId: number, errorMessage = REPORT_WRITE_DENIED): Promise<{
  isAdmin: boolean;
  userId: string;
  siteId: number;
  createdAt: string | null;
}> {
  const caller = await requireApprovedCaller(errorMessage);
  validateResponseId(responseId);

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('form_responses')
    .select('user_id, site_id, created_at')
    .eq('id', responseId)
    .is('archived_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Failed to check the report owner');
  if (!data || (!caller.isAdmin && data.user_id !== caller.userId)) {
    throw new Error(errorMessage);
  }
  return { ...caller, siteId: data.site_id, createdAt: data.created_at ?? null };
}

// The new-report page rolls back a report when its answers or photos fail to save.
// Photo uploads happen in between, so the window allows for a slow connection.
const ROLLBACK_WINDOW_MS = 30 * 60 * 1000;

export async function rollbackSiteInspectionSubmission(responseId: number) {
  const report = await requireReportWriter(responseId);
  const createdAt = report.createdAt ? new Date(report.createdAt).getTime() : NaN;
  // Only a submission that just failed can be undone. Older reports are removed
  // through the admin archive and delete flow (US 7.0.8), which asks to confirm.
  if (!(Date.now() - createdAt <= ROLLBACK_WINDOW_MS)) {
    throw new Error(REPORT_WRITE_DENIED);
  }

  const supabase = createServerSupabase();

  const attachments = await getAttachmentsByResponseId(responseId);
  const storageKeys = attachments.map((attachment) => attachment.storage_key);

  const { error: attachmentsError } = await supabase
    .from('attachments')
    .delete()
    .eq('response_id', responseId);

  if (attachmentsError) {
    throw new Error(attachmentsError.message || 'Failed to remove inspection attachments');
  }

  const { error: answersError } = await supabase
    .from('answers')
    .delete()
    .eq('response_id', responseId);

  if (answersError) {
    throw new Error(answersError.message || 'Failed to remove inspection answers');
  }

  const { error: responseError } = await supabase
    .from('form_responses')
    .delete()
    .eq('id', responseId);

  if (responseError) {
    throw new Error(responseError.message || 'Failed to remove site inspection report');
  }

  await deleteObjectsByKeys(storageKeys);
}

export async function setFormResponseActive(responseId: number, isActive: boolean) {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  // An archived report cannot be changed from the normal report page.
  const { error } = await supabase
    .from('form_responses')
    .update({ is_active: isActive })
    .eq('id', responseId)
    .is('archived_at', null);

  if (error) {
    throw new Error(error.message || 'Failed to update form response status');
  }
}

export async function getCurrentUserUid() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return user?.id;
}

export async function getCurrentSiteId(siteName: string) {
  await requireApprovedCaller(READ_DENIED);
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('sites_pa')
    .select('id')
    .eq('namesite', siteName)
    .is('archived_at', null)
    // A deactivated site takes no new reports, even when the URL is typed in.
    .or('is_active.eq.true,is_active.is.null')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to get site ID');
  }
  return data?.id;
}

export async function getQuestionsOnline(): Promise<question[]> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      subtext,
      question_type,
      is_required,
      section_id,
      form_question,
      autofill_key,
      question_options (
        option_text
      ),
      formorder,
      form_sections!questions_section_id_fkey (
        title,
        description,
        header
      )
    `)
    .eq('is_active', true)
    .eq('question_options.is_active', true)
    .order('position', { referencedTable: 'question_options', ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch questions');
  }

  interface QuestionOnlineRow {
    id: number;
    subtext: string | null;
    question_type: string;
    is_required: boolean | null;
    section_id: number;
    form_question: string | null;
    autofill_key: string | null;
    question_options: Array<{ option_text: string }> | null;
    formorder: number | null;
    form_sections: { title: string | null; description: string | null; header: string | null } | null;
  }

  // The untyped client types a many-to-one embed as an array; at runtime it is one object.
  return ((data ?? []) as unknown as QuestionOnlineRow[]).map((q) => ({
    id: q.id,
    text: q.subtext,
    title: q.form_question,
    question_type: q.question_type,
    is_required: q.is_required ?? null,
    section: q.section_id,
    autofill_key: q.autofill_key ?? null,
    // question.answers is declared non-null, but a question without options still yields null here.
    answers: (q.question_options?.map((opt) => opt.option_text) ?? null) as string[],
    formorder: q.formorder ?? null,
    sectionTitle: q.form_sections?.title ?? null,
    sectionDescription: q.form_sections?.description ?? null,
    sectionHeader: q.form_sections?.header ?? null,
  }));
}

// Checks only the signed-in user, so the browser cannot test other email addresses.
export async function isSteward(): Promise<boolean> {
  const caller = await requireApprovedCaller(READ_DENIED);
  if (!caller.email) return false;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('luperson')
    .select('id')
    .eq('email', caller.email)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getSitesOnline(): Promise<SiteSummary[]> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      archived_at,
      ab_counties (
        county
      ),
      latest_dated:form_responses (
        inspection_date,
        created_at,
        archived_at
      ),
      latest_undated:form_responses (
        inspection_date,
        created_at,
        archived_at
      )
    `)
    .or('is_active.eq.true,is_active.is.null')
    .is('archived_at', null)
    // Only the newest report sets the date of a site. A report without an inspection date
    // uses its created_at, so fetch the newest report of each kind instead of every report.
    .is('latest_dated.archived_at', null)
    .not('latest_dated.inspection_date', 'is', null)
    .order('inspection_date', { referencedTable: 'latest_dated', ascending: false })
    .limit(1, { referencedTable: 'latest_dated' })
    .is('latest_undated.archived_at', null)
    .is('latest_undated.inspection_date', null)
    .order('created_at', { referencedTable: 'latest_undated', ascending: false })
    .limit(1, { referencedTable: 'latest_undated' })
    .order('namesite', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch sites');

  type OnlineSiteRow = Omit<SiteRow, 'form_responses'> & {
    latest_dated: SiteRow['form_responses'];
    latest_undated: SiteRow['form_responses'];
  };
  return ((data ?? []) as unknown as OnlineSiteRow[]).map((site) => {
    const responses = [...(site.latest_dated ?? []), ...(site.latest_undated ?? [])];
    const latestDate = getLatestInspectionDate(responses);

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
      archived_at: site.archived_at ?? null,
    };
  });
}

/**
 * Returns the boundaries the map draws, ready for MapLibre.
 *
 * The geometry column is jsonb that holds a GeoJSON MultiPolygon, so no conversion is
 * needed. The coordinates are rounded and the rings are simplified here, on the
 * server, to keep the payload small.
 */
async function requireApprovedCaller(
  errorMessage = 'You must be signed in to view site boundaries.'
): Promise<{ isAdmin: boolean; userId: string; email: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  const approved = !error && user?.app_metadata?.authenticated === true;
  if (!approved || !user) throw new Error(errorMessage);
  return { isAdmin: user.app_metadata?.role === 'admin', userId: user.id, email: user.email ?? null };
}

function countyFromEmbed(
  value: { county: string } | { county: string }[] | null
): string | null {
  if (value === null) return null;
  if (Array.isArray(value)) return value[0]?.county ?? null;
  return value.county ?? null;
}

// ab_counties has row level security and no select policy for signed-in users.
// The caller is already approved. This read returns only the link, the county, and is_active.
async function readProtectedAreaLinks(): Promise<Map<number, { county: string | null; is_active: boolean | null }>> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('sites_pa')
    .select('protected_area_id, is_active, ab_counties(county)')
    .not('protected_area_id', 'is', null)
    // An archived site is hidden from the app, so it must not give a map area a county or status.
    .is('archived_at', null);

  if (error) throw new Error(error.message || 'Failed to fetch site links');

  const links = new Map<number, { county: string | null; is_active: boolean | null }>();
  for (const row of data ?? []) {
    const areaId = row.protected_area_id as number | null;
    if (areaId === null || links.has(areaId)) continue;
    links.set(areaId, {
      county: countyFromEmbed(row.ab_counties as { county: string } | { county: string }[] | null),
      // A null is_active means active, the same as getSitesOnline and getAllSites.
      is_active: (row.is_active as boolean | null) ?? true,
    });
  }
  return links;
}

export async function getProtectedAreaBoundaries(): Promise<BoundaryFeatureCollection> {
  const caller = await requireApprovedCaller();
  // The cookie client, not createServerSupabase. RLS grants select on protected_areas
  // to authenticated users, so the policy is the gate and the service-role key is not
  // needed for the geometry read.
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('protected_areas')
    .select(
      'id, name, fid, area_type, subtype, iucn, oc_no, acres, hectares, oc_date, date_est, oc_name, notes, geometry'
    );

  if (error) throw new Error(error.message || 'Failed to fetch protected area boundaries');

  const links = await readProtectedAreaLinks();
  const rows = ((data ?? []) as ProtectedAreaBoundaryRow[]).map((row) => {
    const link = links.get(row.id);
    return {
      ...row,
      county: link?.county ?? null,
      is_active: link ? link.is_active : null,
    };
  });

  const collection = toBoundaryFeatureCollection(rows);
  if (caller.isAdmin) return collection;

  return {
    type: 'FeatureCollection',
    features: collection.features.filter((feature) => feature.properties.is_active !== false),
  };
}

export async function getAllSites(): Promise<SiteSummary[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      archived_at,
      protected_area_id,
      ab_counties (
        county
      ),
      form_responses (
        inspection_date,
        created_at,
        archived_at
      )
    `)
    .is('archived_at', null)
    .order('namesite', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch sites');

  return ((data ?? []) as unknown as SiteRow[]).map((site) => {
    const responses = site.form_responses ?? [];
    const latestDate = getLatestInspectionDate(responses);

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
      archived_at: site.archived_at ?? null,
      protected_area_id: site.protected_area_id ?? null,
    };
  });
}

export async function getCounties(): Promise<County[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('ab_counties')
    .select('id, county')
    .order('county', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch counties');
  return data ?? [];
}

export async function getProtectedAreaChoices(): Promise<ProtectedAreaChoice[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('protected_areas')
    .select('id, name, fid, area_type')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch protected areas');
  return data ?? [];
}

function siteWriteError(error: { code?: string; message?: string }, fallback: string): Error {
  if (error.code === '23505') {
    if ((error.message ?? '').includes('protected_area')) {
      return new Error('That protected area is already linked to a site.');
    }
    return new Error('A site with this name already exists.');
  }
  if (error.code === '23503') return new Error('The selected protected area does not exist.');
  return new Error(error.message || fallback);
}

function protectedAreaIdOrNull(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('The protected area is not valid.');
  }
  return value;
}

export type SiteActionResult = { ok: true } | { ok: false; error: string };

// A production build of Next replaces the message of an error thrown by a server action
// with a generic one. These admin site actions return the message instead, so the admin
// still reads "A site with this name already exists." and similar errors.
async function siteActionResult(run: () => Promise<void>): Promise<SiteActionResult> {
  try {
    await run();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save the site.' };
  }
}

// Site edits run with the service role, so each one checks the caller first.
// The check reads the signed-in session, never a value the caller sends.
async function requireApprovedAdmin(
  errorMessage = 'Only admins can edit sites.'
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const approved = !error
    && data.user?.app_metadata?.role === 'admin'
    && data.user?.app_metadata?.authenticated === true;
  if (!approved) throw new Error(errorMessage);
}

export async function updateSite(
  id: number,
  namesite: string,
  ab_county: number | null,
  protectedAreaId: number | null = null
): Promise<SiteActionResult> {
  return siteActionResult(() => updateSiteOrThrow(id, namesite, ab_county, protectedAreaId));
}

async function updateSiteOrThrow(
  id: number,
  namesite: string,
  ab_county: number | null,
  protectedAreaId: number | null
): Promise<void> {
  await requireApprovedAdmin();
  // The same name rule as createSite: the name is the site's URL, so it cannot be blank.
  const name = namesite.trim();
  if (!name) throw new Error('Site name is required.');
  const protected_area_id = protectedAreaIdOrNull(protectedAreaId);
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('sites_pa')
    .update({ namesite: name, ab_county, protected_area_id })
    .eq('id', id);

  if (error) throw siteWriteError(error, 'Failed to update site');
}

export async function createSite(
  namesite: string,
  ab_county: number | null,
  protectedAreaId: number | null = null
): Promise<SiteActionResult> {
  return siteActionResult(() => createSiteOrThrow(namesite, ab_county, protectedAreaId));
}

async function createSiteOrThrow(
  namesite: string,
  ab_county: number | null,
  protectedAreaId: number | null
): Promise<void> {
  await requireApprovedAdmin();

  const name = namesite.trim();
  if (!name) throw new Error('Site name is required.');
  const protected_area_id = protectedAreaIdOrNull(protectedAreaId);

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('sites_pa')
    .insert({ namesite: name, ab_county, is_active: true, protected_area_id });

  if (error) throw siteWriteError(error, 'Failed to create site');
}

/**
 * Verifies the caller, validates the site ID, and requests the connected-record counts
 * that the Admin confirmation dialogs show before a site is archived or permanently deleted.
 */
export async function getSiteDeleteImpact(
  siteId: number
): Promise<SiteDeleteImpact> {
  // Authorization must run before creating the service-role client that bypasses RLS.
  await requireApprovedAdmin();

  // Server action arguments are untrusted even when the normal UI sends them.
  if (!Number.isSafeInteger(siteId) || siteId <= 0) {
    throw new Error('A valid site ID is required.');
  }

  // The database function returns all counts together so the dialog uses one snapshot.
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('get_site_delete_impact', {
    p_site_id: siteId,
  });

  // Keep the database message when available because it gives the most useful failure reason.
  if (error) {
    throw new Error(
      error.message || 'Failed to get site deletion details'
    );
  }

  // A successful RPC with no JSON result means the requested site was not found.
  if (!data) {
    throw new Error('Site not found.');
  }

  // The RPC returns the JSON shape defined by the SiteDeleteImpact interface.
  return data as SiteDeleteImpact;
}


/**
 * Verifies the caller, validates the site ID, and archives the site in one database
 * transaction. Archiving hides the site from the app; no report, answer, attachment,
 * homepage image, or steward assignment is deleted.
 */
export async function archiveSite(
  siteId: number
): Promise<SiteArchiveResult> {
  await requireApprovedAdmin();

  if (!Number.isSafeInteger(siteId) || siteId <= 0) {
    throw new Error('A valid site ID is required.');
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('archive_site', {
    p_site_id: siteId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to archive site');
  }

  if (!data) {
    throw new Error('The database did not return an archive result.');
  }

  return data as SiteArchiveResult;
}

/**
 * Verifies the caller, validates the site ID, and restores an archived site so it
 * is visible in the app again.
 */
export async function restoreSite(
  siteId: number
): Promise<SiteRestoreResult> {
  await requireApprovedAdmin();

  if (!Number.isSafeInteger(siteId) || siteId <= 0) {
    throw new Error('A valid site ID is required.');
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('restore_site', {
    p_site_id: siteId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to restore site');
  }

  if (!data) {
    throw new Error('The database did not return a restore result.');
  }

  return data as SiteRestoreResult;
}

/**
 * Verifies the caller, validates the site ID, and permanently deletes an archived
 * site. Only the sites_pa row is deleted; reports, answers, attachments, and
 * homepage images stay in the database, disconnected from any site.
 */
export async function permanentlyDeleteSite(
  siteId: number
): Promise<SiteDeleteImpact> {
  await requireApprovedAdmin();

  if (!Number.isSafeInteger(siteId) || siteId <= 0) {
    throw new Error('A valid site ID is required.');
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('permanently_delete_site', {
    p_site_id: siteId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to permanently delete site');
  }

  if (!data) {
    throw new Error('The database did not return a deletion result.');
  }

  return data as SiteDeleteImpact;
}

function validateResponseId(responseId: number): void {
  if (!Number.isSafeInteger(responseId) || responseId <= 0) {
    throw new Error('A valid report ID is required.');
  }
}

export async function getSiteInspectionReportDeleteImpact(
  responseId: number
): Promise<SiteInspectionReportDeleteImpact> {
  // Check the signed-in user before reading protected archive details.
  await requireApprovedAdmin('Only approved admins can manage reports.');
  validateResponseId(responseId);

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc(
    'get_site_inspection_report_delete_impact',
    { p_response_id: responseId }
  );

  if (error) {
    throw new Error(error.message || 'Failed to get report deletion details');
  }
  if (!data) {
    throw new Error('Site Inspection Report not found.');
  }

  return data as SiteInspectionReportDeleteImpact;
}

export async function archiveSiteInspectionReport(
  responseId: number
): Promise<SiteInspectionReportArchiveResult> {
  // Check the signed-in user before changing a report.
  await requireApprovedAdmin('Only approved admins can manage reports.');
  validateResponseId(responseId);

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc(
    'archive_site_inspection_report',
    { p_response_id: responseId }
  );

  if (error) {
    throw new Error(error.message || 'Failed to archive Site Inspection Report');
  }
  if (!data) {
    throw new Error('The database did not return an archive result.');
  }

  return data as SiteInspectionReportArchiveResult;
}

export async function restoreSiteInspectionReport(
  responseId: number
): Promise<SiteInspectionReportRestoreResult> {
  // Check the signed-in user before changing a report.
  await requireApprovedAdmin('Only approved admins can manage reports.');
  validateResponseId(responseId);

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc(
    'restore_site_inspection_report',
    { p_response_id: responseId }
  );

  if (error) {
    throw new Error(error.message || 'Failed to restore Site Inspection Report');
  }
  if (!data) {
    throw new Error('The database did not return a restore result.');
  }

  return data as SiteInspectionReportRestoreResult;
}

export async function permanentlyDeleteSiteInspectionReport(
  responseId: number
): Promise<SiteInspectionReportDeleteOutcome> {
  // Check the signed-in user before deleting saved data.
  await requireApprovedAdmin('Only approved admins can manage reports.');
  validateResponseId(responseId);

  const supabase = createServerSupabase();
  // Delete the saved data first. If this step fails, the image files stay in storage.
  const { data, error } = await supabase.rpc(
    'permanently_delete_site_inspection_report',
    { p_response_id: responseId }
  );

  if (error) {
    throw new Error(error.message || 'Failed to permanently delete Site Inspection Report');
  }
  if (!data) {
    throw new Error('The database did not return a deletion result.');
  }

  const result = data as SiteInspectionReportDeleteDatabaseResult;
  const storageKeys = Array.isArray(result.storageKeys)
    ? result.storageKeys.filter((key): key is string => typeof key === 'string')
    : [];
  const impact: SiteInspectionReportDeleteImpact = {
    responseId: result.responseId,
    inspectionNo: result.inspectionNo,
    inspectionDate: result.inspectionDate,
    siteName: result.siteName,
    answerCount: result.answerCount,
    attachmentCount: result.attachmentCount,
  };
  let storageCleanupComplete = true;

  try {
    await deleteObjectsByKeys(storageKeys);
  } catch (storageError) {
    // The saved data is already gone, so report the image cleanup problem separately.
    storageCleanupComplete = false;
    console.error('SIR S3 cleanup failed after database deletion.', {
      responseId,
      storageKeys,
      error: storageError,
    });
  }

  return { impact, storageCleanupComplete };
}

export async function getArchivedSiteInspectionReports(): Promise<ArchivedSiteInspectionReport[]> {
  // Archived reports are private admin records.
  await requireApprovedAdmin('Only approved admins can manage reports.');
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('form_responses')
    .select(`
      id, user_id, inspection_no, inspection_date, created_at, is_active,
      archived_at, site_id,
      sites_pa (id, namesite)
    `)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch archived Site Inspection Reports');
  }

  interface ArchivedReportRow {
    id: number;
    user_id: string | null;
    inspection_no: string | null;
    inspection_date: string | null;
    created_at: string | null;
    is_active: boolean;
    archived_at: string;
    site_id: number | null;
    sites_pa: { id: number; namesite: string } | null;
  }

  const rows = (data ?? []) as unknown as ArchivedReportRow[];
  // Load all submitter names together instead of making one request for each report.
  const userIds = [...new Set(
    rows.map((row) => row.user_id).filter((id): id is string => Boolean(id))
  )];
  let peopleByAuthId = new Map<string, { id: number; displayName: string }>();

  if (userIds.length > 0) {
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, auth_user_id, display_name')
      .in('auth_user_id', userIds);

    if (peopleError) {
      throw new Error(peopleError.message || 'Failed to fetch report submitters');
    }

    peopleByAuthId = new Map(
      (people ?? []).map((person: {
        id: number;
        auth_user_id: string;
        display_name: string;
      }) => [
        person.auth_user_id,
        { id: person.id, displayName: person.display_name },
      ])
    );
  }

  return rows.map((row) => {
    const submitter = row.user_id ? peopleByAuthId.get(row.user_id) : undefined;
    return {
      id: row.id,
      inspectionNo: row.inspection_no,
      inspectionDate: row.inspection_date,
      createdAt: row.created_at,
      isActive: row.is_active,
      archivedAt: row.archived_at,
      siteId: row.site_id,
      siteName: row.sites_pa?.namesite ?? null,
      submitterId: submitter?.id ?? null,
      submitterName: submitter?.displayName ?? null,
    };
  });
}

/**
 * Returns the archived sites for the Admin archived sites page. Archived sites are
 * hidden from every other site list.
 */
export async function getArchivedSites(): Promise<SiteSummary[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      archived_at,
      protected_area_id,
      ab_counties (
        county
      ),
      form_responses (
        inspection_date,
        created_at,
        archived_at
      )
    `)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch archived sites');

  return ((data ?? []) as unknown as SiteRow[]).map((site) => {
    const responses = site.form_responses ?? [];
    const latestDate = getLatestInspectionDate(responses);

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
      archived_at: site.archived_at ?? null,
      protected_area_id: site.protected_area_id ?? null,
    };
  });
}

// Containment on very short names (e.g. "Elk") would match many sites, so it needs a minimum length.
const MIN_CONTAINED_NAME_LENGTH = 4;

function isPossibleDuplicate(newName: string, existingName: string): boolean {
  if (newName === existingName) return true;
  const shorter = newName.length < existingName.length ? newName : existingName;
  const longer = shorter === newName ? existingName : newName;
  return shorter.length >= MIN_CONTAINED_NAME_LENGTH && longer.includes(shorter);
}

export async function findSitesWithName(namesite: string): Promise<string[]> {
  await requireApprovedAdmin();

  const name = namesite.trim().toLowerCase();
  if (!name) return [];

  const supabase = createServerSupabase();
  const { data, error } = await supabase.from('sites_pa').select('namesite');

  if (error) throw new Error(error.message || 'Failed to check for duplicate sites');
  return (data ?? [])
    .map((site) => site.namesite as string)
    .filter((existing) => isPossibleDuplicate(name, existing.toLowerCase()));
}

export interface SiteSuggestion {
  name: string;
  category: string;
}

export async function getSiteSuggestions(): Promise<SiteSuggestion[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const [areas, sites] = await Promise.all([
    supabase.from('protected_areas').select('name, folder'),
    supabase.from('sites_pa').select('namesite'),
  ]);
  if (areas.error) throw new Error(areas.error.message || 'Failed to load the SAPAA map areas');
  if (sites.error) throw new Error(sites.error.message || 'Failed to load sites');

  const existingNames = new Set((sites.data ?? []).map((site) => (site.namesite as string).toLowerCase()));
  const suggestions = new Map<string, SiteSuggestion>();
  for (const area of areas.data ?? []) {
    const key = (area.name as string).toLowerCase();
    if (!existingNames.has(key) && !suggestions.has(key)) {
      suggestions.set(key, { name: area.name, category: area.folder });
    }
  }
  return [...suggestions.values()].sort((first, second) => first.name.localeCompare(second.name));
}

export async function toggleSiteActive(
  id: number,
  is_active: boolean
): Promise<void> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('sites_pa')
    .update({ is_active })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update site status');
}

export async function getSiteByName(namesite: string): Promise<SiteSummary[]> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      archived_at,
      ab_counties (
        county
      ),
      form_responses (
        inspection_date,
        created_at,
        archived_at
      )
    `)
    .eq('namesite', namesite)
    .is('archived_at', null)
    .limit(1);

  if (error) throw new Error(error.message || 'Failed to fetch site');

  return ((data ?? []) as unknown as SiteRow[]).map((site) => {
    const responses = site.form_responses ?? [];
    const latestDate = getLatestInspectionDate(responses);

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
      archived_at: site.archived_at ?? null,
    };
  });
}

/**
 * Returns one site for an approved administrator, including inactive sites,
 * and calculates the date of its latest inspection.
 */
export async function getSiteByNameAdmin(
  namesite: string
): Promise<SiteSummary[]> {
  //Verify user before using client that bypasses RLS
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  //Do not filter by is_active since this is for admins to view
  const { data, error } = await supabase
    .from('sites_pa')
    .select(`
      id,
      namesite,
      ab_county,
      is_active,
      archived_at,
      ab_counties (
        county
      ),
      form_responses (
        inspection_date,
        created_at,
        archived_at
      )
    `)
    .eq('namesite', namesite)
    .limit(1);
  //Process termination if query fails
  if (error) {
    throw new Error(error.message || 'Failed to fetch site');
  }
  //Convert database row into the site summary used by the page
  return ((data ?? []) as unknown as SiteRow[]).map((site) => {
    const responses = site.form_responses ?? [];
    const latestDate = getLatestInspectionDate(responses);

    return {
      id: site.id,
      namesite: site.namesite,
      county: site.ab_counties?.county ?? null,
      ab_county: site.ab_county ?? null,
      inspectdate: latestDate,
      is_active: site.is_active ?? true,
      archived_at: site.archived_at ?? null,
    };
  });
}

export interface SitePageFieldValue {
  fieldKey: string;
  value: string | null;
  isVisible: boolean;
}

export async function getSitePageFields(siteId: number): Promise<SitePageFieldValue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_page_fields')
    .select('field_key, value, is_visible')
    .eq('site_id', siteId);

  if (error) throw new Error(error.message || 'Failed to load site page fields');
  return (data ?? []).map((row) => ({
    fieldKey: row.field_key,
    value: row.value,
    isVisible: row.is_visible,
  }));
}

// Only http and https links are saved, so a link like "javascript:..." can never reach the page.
function cleanLink(value: string | null): string | null {
  const link = (value ?? '').trim();
  if (!link) return null;
  if (!/^https?:\/\/\S+$/i.test(link)) throw new Error('Links must start with http:// or https://');
  return link;
}

export async function updateSitePageFields(siteId: number, fields: SitePageFieldValue[]): Promise<SiteActionResult> {
  return siteActionResult(() => updateSitePageFieldsOrThrow(siteId, fields));
}

async function updateSitePageFieldsOrThrow(siteId: number, fields: SitePageFieldValue[]): Promise<void> {
  await requireApprovedAdmin();
  // Server action arguments are untrusted even when the normal UI sends them.
  if (!Number.isSafeInteger(siteId) || siteId <= 0) throw new Error('A valid site ID is required.');
  if (!Array.isArray(fields)) throw new Error('The site page fields are not valid.');
  const { data: { user } } = await (await createClient()).auth.getUser();

  const definitions = new Map(SITE_PAGE_FIELDS.map((definition) => [definition.key, definition]));
  const seenKeys = new Set<string>();
  const rows = fields.map((field) => {
    const definition = definitions.get(field.fieldKey);
    if (!definition) throw new Error(`Unknown site page field: ${field.fieldKey}`);
    // One upsert cannot change the same row twice, so a repeated key is refused here.
    if (seenKeys.has(field.fieldKey)) throw new Error(`Site page field listed twice: ${field.fieldKey}`);
    seenKeys.add(field.fieldKey);
    if (typeof field.isVisible !== 'boolean') throw new Error(`Visibility must be true or false: ${field.fieldKey}`);
    return {
      site_id: siteId,
      field_key: field.fieldKey,
      value: definition.kind === 'url' ? cleanLink(field.value) : null,
      is_visible: field.isVisible,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    };
  });
  if (rows.length === 0) return;

  const { error } = await createServerSupabase()
    .from('site_page_fields')
    .upsert(rows, { onConflict: 'site_id,field_key' });
  if (error) throw new Error(error.message || 'Failed to save site page fields');
}

export interface SiteDeleteImpact {
  siteId: number;
  siteName: string;
  inspectionCount: number;
  answerCount: number;
  attachmentCount: number;
  homepageImageCount: number;
  siteStewardCount: number;
}

export interface SiteArchiveResult {
  siteId: number;
  siteName: string;
  archivedAt: string;
}

export interface SiteRestoreResult {
  siteId: number;
  siteName: string;
}

export interface SiteInspectionReportDeleteImpact {
  responseId: number;
  inspectionNo: string | null;
  inspectionDate: string | null;
  siteName: string | null;
  answerCount: number;
  attachmentCount: number;
}

export interface SiteInspectionReportArchiveResult {
  responseId: number;
  archivedAt: string;
}

export interface SiteInspectionReportRestoreResult {
  responseId: number;
}

interface SiteInspectionReportDeleteDatabaseResult
  extends SiteInspectionReportDeleteImpact {
  storageKeys: unknown;
}

export interface SiteInspectionReportDeleteOutcome {
  impact: SiteInspectionReportDeleteImpact;
  storageCleanupComplete: boolean;
}

export interface SiteLinks {
  sapaaWebsiteUrl: string | null;
  iNaturalistUrl: string | null;
}

export async function getSiteLinks(siteId: number): Promise<SiteLinks> {
  const fields = await getSitePageFields(siteId);
  const shownValue = (fieldKey: string) => {
    const field = fields.find((candidate) => candidate.fieldKey === fieldKey);
    // No saved row yet: show the default link, as every site did before admins could set one.
    if (!field) return SITE_PAGE_FIELDS.find((definition) => definition.key === fieldKey)?.defaultValue ?? null;
    return field.isVisible ? field.value : null;
  };
  return {
    sapaaWebsiteUrl: shownValue('sapaa_website'),
    iNaturalistUrl: shownValue('inaturalist'),
  };
}

export async function getInspectionDetailsOnline(namesite: string): Promise<InspectionDetail[]> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('sites_detail_fnr_test')
    .select('namesite, _type, county, _naregion, inspectdate, naturalness_score, naturalness_details, notes')
    .eq('namesite', namesite)
    .order('inspectdate', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch inspection details');

  return ((data ?? []) as unknown as Omit<InspectionDetail, 'id'>[]).map((insp, i) => ({
    id: i + 1,
    namesite: insp.namesite,
    _type: insp._type,
    county: insp.county,
    _naregion: insp._naregion,
    inspectdate: insp.inspectdate,
    naturalness_score: insp.naturalness_score,
    naturalness_details: insp.naturalness_details,
    notes: insp.notes,
    steward: insp.steward,
  }));
}


export async function insertInspectionAttachments(rows: Array<{
  response_id: number | null;
  question_id: number;
  site_id?: number | null;
  storage_key: string; 
  filename?: string | null;
  content_type?: string | null;
  file_size_bytes?: number | null;
  caption?: string | null;
  description?: string | null;
  photographer?: string | null;
  identifier?: string | null;
  date?: string | null;
  
}>) {
  const siteIds = new Map<number, number>();
  for (const responseId of new Set(rows.map((row) => row.response_id))) {
    if (responseId === null) throw new Error(REPORT_WRITE_DENIED);
    siteIds.set(responseId, (await requireReportWriter(responseId)).siteId);
  }
  // Each photo must sit in its own report's folder, the one the presign route made.
  for (const row of rows) {
    const siteId = siteIds.get(row.response_id!);
    const keyMatches = isAllowedStorageKey(row.storage_key, 'inspections', siteId!, row.response_id!, row.question_id);
    if (!keyMatches || (row.site_id != null && row.site_id !== siteId)) {
      throw new Error('The photo storage key is not valid.');
    }
  }
  const supabase = createServerSupabase();  

  const { data, error } = await supabase
    .from('attachments')
    .insert(rows);

  if (error) {
    throw new Error(error.message || 'Failed to insert attachments');
  }

  return data;
}

export async function insertHomepageImageUpload(rows: Array<{
  storage_key: string; 
  filename?: string | null;
  content_type?: string | null;
  file_size_bytes?: number | null;
  site_id: number;
  date: Date;
  photographer: string | null;
  identifier: string | null;
  caption: string | null;
  created_at: string | null;
}>) {
  // The uploader is the signed-in user, never an id the browser sends.
  const caller = await requireApprovedCaller('Only approved users can upload images.');
  if (!rows.every((row) => isAllowedStorageKey(row.storage_key, 'homepage-image-uploads', row.site_id, caller.userId))) {
    throw new Error('The photo storage key is not valid.');
  }
  const supabase = createServerSupabase();  

  const { data, error } = await supabase
    .from('homepage_image_uploads')
    .insert(rows.map((row) => ({ ...row, user_id: caller.userId })));

  if (error) {
    throw new Error(error.message || 'Failed to insert homepage attachments');
  }

  return data;
}

// Admin viewing for sites, difference is the is_active flag so that admin can see all reports
export async function getFormResponsesBySiteAdmin(siteName: string): Promise<(FormResponse & { is_active: boolean })[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();

  const { data: siteData, error: siteError } = await supabase
    .from('sites_pa')
    .select('id')
    .eq('namesite', siteName)
    .single();

  if (siteError || !siteData) throw new Error('Site not found');

  const keyMap = await getReportQuestionKeyMap();
  const ids = {
    naturalnessId: Number(keyMap['Q31_Naturalness']),
    naturalnessDetailsId: Number(keyMap['Q32_Natural_Comm']),
    stewardId: Number(keyMap['Q13_FirstandLastNameForGuests']),
  };

  const { data, error } = await supabase
    .from('form_responses')
    .select(`
      id, user_id, created_at, inspection_date, inspection_no, is_active,
      answers (
        question_id, obs_value, obs_comm,
        questions ( id, form_question, section_id,
          form_sections!questions_section_id_fkey ( id, title ) )
      )
    `)
    .eq('site_id', siteData.id)
    .is('archived_at', null)
    .order('inspection_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to fetch form responses');

  return ((data ?? []) as unknown as (FormResponseRow & { is_active: boolean | null })[]).map((r) => {
    const { answers, naturalness, naturalnessDetails, steward } = reduceAnswers(r.answers, ids);
    return {
      id: r.id,
      user_id: r.user_id ?? null,
      created_at: r.created_at,
      inspection_date: r.inspection_date ?? null,
      inspection_no: r.inspection_no,
      naturalness_score: naturalness,
      naturalness_details: naturalnessDetails,
      steward,
      is_active: r.is_active ?? true,
      answers,
    };
  });
}

// User viewing for sites, uses is_active flag to prevent users from viewing disabled responses
export async function getFormResponsesBySite(siteName: string): Promise<FormResponse[]> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();

  const { data: siteData, error: siteError } = await supabase
    .from('sites_pa')
    .select('id')
    .eq('namesite', siteName)
    .single();

  if (siteError || !siteData) throw new Error('Site not found');

  const keyMap = await getReportQuestionKeyMap();
  const ids = {
    naturalnessId: Number(keyMap['Q31_Naturalness']),
    naturalnessDetailsId: Number(keyMap['Q32_Natural_Comm']),
    stewardId: Number(keyMap['Q13_FirstandLastNameForGuests']),
  };

  // Page past the PostgREST max_rows limit (1000) so older reports are not cut off.
  const PAGE_SIZE = 1000;
  const data: FormResponseRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data: page, error } = await supabase
      .from('form_responses')
      .select(`
        id, user_id, created_at, inspection_date, inspection_no,
        answers (
          question_id, obs_value, obs_comm,
          questions ( id, form_question, section_id,
            form_sections!questions_section_id_fkey ( id, title ) )
        )
      `)
      .eq('site_id', siteData.id)
      .eq('is_active', true)
      .is('archived_at', null)
      .order('inspection_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message || 'Failed to fetch form responses');
    data.push(...((page ?? []) as unknown as FormResponseRow[]));
    if (!page || page.length < PAGE_SIZE) break;
  }

  return data.map((r) => {
    const { answers, naturalness, naturalnessDetails, steward } = reduceAnswers(r.answers, ids);
    return {
      id: r.id,
      user_id: r.user_id ?? null,
      created_at: r.created_at,
      inspection_date: r.inspection_date ?? null,
      inspection_no: r.inspection_no,
      naturalness_score: naturalness,
      naturalness_details: naturalnessDetails,
      steward,
      answers,
    };
  });
}

// Any signed-in user can see current reports, but archived reports are admin-only.
export async function getAllSiteReports(): Promise<SiteReportSummary[]> {
  await requireApprovedCaller('Sign in to view inspection reports.');

  const supabase = createServerSupabase();

  // Page past the PostgREST max_rows limit (1000) so reports past the first 1000 are not cut off.
  const PAGE_SIZE = 1000;
  const data: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data: page, error } = await supabase
      .from('form_responses')
      .select(`
        id, user_id, inspection_no, inspection_date, created_at, site_id,
        sites_pa (
          id, namesite, archived_at, is_active
        )
      `)
      .eq('is_active', true)
      .is('archived_at', null)
      .order('inspection_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message || 'Failed to fetch inspection reports');
    data.push(...(page ?? []));
    if (!page || page.length < PAGE_SIZE) break;
  }

  interface SiteReportRow {
    id: number;
    user_id: string | null;
    inspection_no: string | null;
    inspection_date: string | null;
    created_at: string | null;
    site_id: number | null;
    sites_pa: { id: number; namesite: string; archived_at: string | null; is_active: boolean | null } | null;
  }

  // The untyped client types a many-to-one embed as an array; at runtime it is one object.
  const rows = (data ?? []) as unknown as SiteReportRow[];

  // Resolve submitter display names in one query instead of one lookup per report.
  const userIds = [...new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
  let peopleByAuthId = new Map<string, { id: number; displayName: string }>();
  if (userIds.length > 0) {
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, auth_user_id, display_name')
      .in('auth_user_id', userIds);

    if (peopleError) throw new Error(peopleError.message || 'Failed to fetch inspection submitters');

    peopleByAuthId = new Map(
      (people ?? []).map((person: { id: number; auth_user_id: string; display_name: string }) => [
        person.auth_user_id,
        { id: person.id, displayName: person.display_name },
      ])
    );
  }

  return rows.map((row) => {
    const submitter = row.user_id ? peopleByAuthId.get(row.user_id) : undefined;
    return {
      id: row.id,
      inspectionNo: row.inspection_no ?? null,
      inspectionDate: row.inspection_date ?? null,
      createdAt: row.created_at ?? null,
      siteId: row.site_id ?? null,
      siteName: row.sites_pa?.namesite ?? null,
      siteArchived: row.sites_pa?.archived_at != null,
      siteInactive: row.sites_pa?.is_active === false,
      submitterId: submitter?.id ?? null,
      submitterName: submitter?.displayName ?? null,
    };
  });
}

// Returns raw answers for a single response shaped as Record<questionId, value>
// ready to drop straight into the form's `responses` state.
export async function getFormResponseById(responseId: number): Promise<Record<string | number, string | string[]>> {
  // The answers go only to the owner or an admin, and never for an archived report.
  await requireReportWriter(responseId, REPORT_VIEW_DENIED);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('answers')
    .select(`
      question_id,
      obs_value,
      obs_comm,
      questions (
        question_type
      )
    `)
    .eq('response_id', responseId);

  if (error) throw new Error(error.message || 'Failed to fetch response answers');

  const map: Record<string | number, string | string[]> = {}; // 2. Update local map type

  for (const row of data ?? []) {
    const qid: number = row.question_id;
    const questionType: string = (row as unknown as { questions: { question_type: string } | null }).questions?.question_type ?? '';

    if (row.obs_value === 'Other' && row.obs_comm) {
      if (!map[qid]) map[qid] = [];
      if (Array.isArray(map[qid]) && !map[qid].includes('Other')) {
        map[qid].push('Other');
      }
      // 3. Fix: Use backticks for template literals
      map[`${qid}_comm`] = row.obs_comm; 
      
    } else if (row.obs_value) {
        if (questionType === 'checkbox' || questionType === 'multi' || questionType === 'selectall') {
          if (!map[qid]) map[qid] = [];
          (map[qid] as string[]).push(row.obs_value);
        } else {
          map[qid] = row.obs_value;
        }
    } else if (row.obs_comm) {
      map[qid] = row.obs_comm;
    }
  }

  return map;
}


// Updates caption and identifier for an existing attachments row
export async function updateAttachmentMetadata(
  attachmentId: number,
  fields: { caption?: string | null; identifier?: string | null }
) {
  // Check the caller before the service-role read below.
  await requireApprovedCaller(REPORT_WRITE_DENIED);
  const supabase = createServerSupabase();

  // Only the owner of the attachment's report, or an admin, may change it.
  const { data: attachment, error: readError } = await supabase
    .from('attachments')
    .select('response_id')
    .eq('id', attachmentId)
    .maybeSingle();

  if (readError) throw new Error(readError.message || 'Failed to read attachment');
  if (!attachment?.response_id) throw new Error(REPORT_WRITE_DENIED);
  await requireReportWriter(attachment.response_id);

  const { error } = await supabase
    .from('attachments')
    .update({ caption: fields.caption, identifier: fields.identifier })
    .eq('id', attachmentId);

  if (error) throw new Error(error.message || 'Failed to update attachment metadata');
}

// Replaces all answers for an existing response (delete + reinsert), keeping the same response_id
export async function updateSiteInspectionAnswers(
  responseId: number,
  batchArray: Omit<SupabaseAnswer, 'response_id'>[],
  inspectionDate: string,
) {
  await requireReportWriter(responseId);
  const supabase = createServerSupabase();

  // Do not change answers while the report is in the archive.
  const { error: updateDateError } = await supabase
    .from('form_responses')
    .update({
      inspection_date: inspectionDate,
    })
    .eq('id', responseId)
    .is('archived_at', null)
    .select('id')
    .single();

  if (updateDateError) throw new Error(updateDateError.message || 'Failed to clear existing answers');

  const { error: deleteError } = await supabase
    .from('answers')
    .delete()
    .eq('response_id', responseId);

  if (deleteError) throw new Error(deleteError.message || 'Failed to clear existing answers');

  const rows = batchArray.map(a => ({ ...a, response_id: responseId }));
  const { data, error: insertError } = await supabase
    .from('answers')
    .insert(rows);

  if (insertError) throw new Error(insertError.message || 'Failed to reinsert updated answers');

  return data;
}

export async function getResponseOwnerId(responseId: number): Promise<string | null> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('form_responses')
    .select('user_id')
    .eq('id', responseId)
    .is('archived_at', null)
    .single();

  if (error || !data) return null;
  return data.user_id;
}

export async function getSiteIdForResponse(responseId: number): Promise<number | null> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('form_responses')
    .select('site_id')
    .eq('id', responseId)
    .is('archived_at', null)
    .single();
  if (error || !data) return null;
  return data.site_id ?? null;
}

export async function getTotalInspectionCount(): Promise<number> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();
  // Dashboard totals include only reports that are still in normal use.
  const { count, error } = await supabase
    .from('form_responses')
    .select('*', { count: 'exact', head: true })
    .is('archived_at', null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getLastInspectionDate(): Promise<string | null> {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('form_responses')
    .select('created_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data.created_at;
}

export async function getDateOfVisitQuestionId() {
  await requireApprovedCaller(READ_DENIED);
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('questions')
    .select('id')
    .eq('question key', "Q21_Date_Of_Visit")
    .single();
  if (error || !data) return null;
  return data.id;
}
export async function getNaturalnessDistribution(): Promise<{ naturalness_score: string; count: number }[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('get_naturalness_distribution');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { naturalness_score: string; count: number | string }) => ({
    naturalness_score: r.naturalness_score,
    count: Number(r.count),
  }));
}

export async function getTopSitesDistribution(): Promise<{ namesite: string; count: number }[]> {
  await requireApprovedAdmin();
  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('get_top_sites_distribution');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { namesite: string; count: number | string }) => ({
    namesite: r.namesite,
    count: Number(r.count),
  }));
}
