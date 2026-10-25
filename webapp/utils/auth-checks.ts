import 'server-only';

import { createClient } from './supabase/server';

export async function requireApprovedCaller(
  errorMessage = 'You must be signed in to view site boundaries.'
): Promise<{ isAdmin: boolean; userId: string; email: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  const approved = !error && user?.app_metadata?.authenticated === true;
  if (!approved || !user) throw new Error(errorMessage);
  return { isAdmin: user.app_metadata?.role === 'admin', userId: user.id, email: user.email ?? null };
}

export async function requireApprovedAdmin(
  errorMessage = 'Only admins can edit sites.'
): Promise<{ userId: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  const approved = !error
    && user?.app_metadata?.role === 'admin'
    && user?.app_metadata?.authenticated === true;
  if (!approved || !user) throw new Error(errorMessage);
  return { userId: user.id };
}
