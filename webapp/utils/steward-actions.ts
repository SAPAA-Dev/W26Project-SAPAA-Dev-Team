'use server';

import { createClient, createServerSupabase } from './supabase/server';

export interface StewardOption {
  id: number;
  displayName: string;
}

export interface StewardedSite {
  siteId: number;
  namesite: string;
  isActive: boolean;
}

type ActionResult = { success: true } | { success: false; error: string };

// PostgREST embeds a to-one relation as one object (or null). Without generated database types
// the client cannot know that, so overrideTypes states the shape of each embed.
type EmbeddedPerson = { id: number; display_name: string } | null;
type EmbeddedSite = { namesite: string; archived_at: string | null; is_active: boolean | null } | null;

async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const approvedAdmin = data.user.app_metadata?.role === 'admin'
    && data.user.app_metadata?.authenticated === true;
  return approvedAdmin ? data.user.id : null;
}

// 3.0.2 AT1: admins search people by name.
export async function searchStewards(query: string): Promise<StewardOption[]> {
  if (!(await getAdminUserId())) return [];
  // PostgREST reads "*" as "%" in ilike and has no escape for it, so drop it.
  const term = query.replace(/\*/g, '').trim();
  if (!term) return [];
  // Escape the LIKE wildcards so a search for "_" or "%" matches those characters, not everyone.
  const escaped = term.replace(/[\\%_]/g, '\\$&');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('people')
    .select('id, display_name')
    .ilike('display_name', `%${escaped}%`)
    .order('display_name')
    .limit(10);

  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ id: p.id, displayName: p.display_name }));
}

// 3.0.2 AT2 and AT4: only admins assign. A new steward replaces the old one (site_id is the key).
export async function assignSiteSteward(siteId: number, personId: number): Promise<ActionResult> {
  const adminId = await getAdminUserId();
  if (!adminId) return { success: false, error: 'Only admins can assign a steward.' };
  if (!Number.isInteger(siteId) || siteId <= 0 || !Number.isInteger(personId) || personId <= 0) {
    return { success: false, error: 'Invalid site or person.' };
  }

  // site_stewards has no write policy for users, so the write uses the service role.
  const { error } = await createServerSupabase()
    .from('site_stewards')
    .upsert(
      { site_id: siteId, steward_id: personId, assigned_by: adminId, assigned_at: new Date().toISOString() },
      { onConflict: 'site_id' }
    );

  // The database error can name tables and constraints, so it stays in the server log.
  if (error) {
    console.error('assignSiteSteward failed', error);
    return { success: false, error: 'The steward was not assigned. Try again.' };
  }
  return { success: true };
}

// 3.0.2 AT3: the steward shown on the site page.
export async function getSiteSteward(siteId: number): Promise<StewardOption | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_stewards')
    .select('people(id, display_name)')
    .eq('site_id', siteId)
    .maybeSingle()
    .overrideTypes<{ people: EmbeddedPerson }, { merge: false }>();

  if (error) throw new Error(error.message);
  const person = data?.people;
  return person ? { id: person.id, displayName: person.display_name } : null;
}

// 3.0.2 AT3: the sites shown on a steward's profile (#76 calls this).
export async function getSitesForSteward(personId: number): Promise<StewardedSite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_stewards')
    .select('site_id, sites_pa(namesite, archived_at, is_active)')
    .eq('steward_id', personId)
    .overrideTypes<Array<{ site_id: number; sites_pa: EmbeddedSite }>, { merge: false }>();

  if (error) throw new Error(error.message);
  return (data ?? [])
    // Archived sites are hidden from the app.
    .filter((row) => !row.sites_pa?.archived_at)
    .map((row) => ({
      siteId: row.site_id,
      namesite: row.sites_pa?.namesite ?? '',
      // A deactivated site stays on the profile, but its page cannot be opened.
      isActive: row.sites_pa?.is_active !== false,
    }));
}

// 1.0.1 AT3: the person who submitted an inspection, so the site page can link to their profile.
export async function getPersonByAuthUserId(authUserId: string): Promise<StewardOption | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('people')
    .select('id, display_name')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? { id: data.id, displayName: data.display_name } : null;
}
