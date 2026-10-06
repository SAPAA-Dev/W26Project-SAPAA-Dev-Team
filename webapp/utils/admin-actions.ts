'use server';

import { supabaseAdmin } from '../utils/supabase/admin';
import { createClient } from './supabase/server';

export interface User {
  id: string;
  email: string;
  role: string;
  authenticated: boolean;
}

// Every action below runs with the service role, so each one checks the caller
// first. The check reads the signed-in session, never a value the caller sends.
async function isApprovedAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return data.user.app_metadata?.role === 'admin'
    && data.user.app_metadata?.authenticated === true;
}

const NOT_ADMIN_ERROR = 'Only admins can manage user accounts.';

export async function getAllUsers(): Promise<User[]> {
  if (!(await isApprovedAdmin())) return [];

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('Failed to list users', error);
    return [];
  }

  return data.users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    role: u.app_metadata?.role ?? 'steward',
    authenticated: u.app_metadata?.authenticated ?? false
  }));
}

export async function addUser(newUser: { email: string; password: string; role?: string; authenticated?:boolean}) {
  try {
    if (!(await isApprovedAdmin())) return { success: false, error: NOT_ADMIN_ERROR };

    const { email, password, role = 'steward', authenticated = false } = newUser;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      app_metadata: { role, authenticated }
    });

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (e: any) {
    console.error('Add user failed', e);
    return { success: false, error: e.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    if (!(await isApprovedAdmin())) return { success: false, error: NOT_ADMIN_ERROR };

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    console.error('Delete user failed', e);
    return { success: false, error: e.message };
  }
}


export async function updateUser(data: { id: string; email: string; password?: string; role: string; authenticated:boolean }) {
  try {
    if (!(await isApprovedAdmin())) return { success: false, error: NOT_ADMIN_ERROR };

    const { id, email, password, role, authenticated } = data;

    const { data: existing, error: lookupError } = await supabaseAdmin.auth.admin.getUserById(id);
    if (lookupError || !existing?.user) {
      return { success: false, error: lookupError?.message ?? 'User not found.' };
    }

    // The admin update replaces app_metadata, so keep the existing keys (such as the
    // provider entries) and only change the role and the approval flag.
    const attrs: any = {
      email,
      app_metadata: { ...existing.user.app_metadata, role, authenticated }
    };
    if (password) attrs.password = password;

    const { data: updatedUser, error } =
      await supabaseAdmin.auth.admin.updateUserById(id, attrs);

    if (error) return { success: false, error: error.message };

    return { success: true, data: updatedUser };
  } catch (e: any) {
    console.error('Update user failed', e);
    return { success: false, error: e.message };
  }
}
