import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * #181: links site cards to the KML boundary they name and refreshes the stored
 * centre point. The caller writes the site or the protected areas first, so a failed
 * lookup is logged and never turns a completed save or import into an error.
 *
 * A site save sends shouldLink = false. It must not undo an Admin who clears a link:
 * the function then refreshes the centre only.
 */
export async function refreshProtectedAreaLinks(
  supabase: SupabaseClient,
  shouldLink = true
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('link_sites_to_protected_areas', { p_link: shouldLink });
    if (error === null) return true;
    console.error('Failed to link sites to protected areas', error);
    return false;
  } catch (error) {
    console.error('Failed to link sites to protected areas', error);
    return false;
  }
}
