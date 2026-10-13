'use server';

import { supabaseAdmin } from '../utils/supabase/admin';
import { createClient } from './supabase/server';
import type { AdminUserAttributes, User as AuthUser } from '@supabase/supabase-js';

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
const USERS_PER_PAGE = 1000;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export async function getAllUsers(): Promise<User[]> {
  if (!(await isApprovedAdmin())) return [];

  // listUsers returns one page, 50 users by default, so read every page.
  const users: AuthUser[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE });

    if (error) {
      console.error('Failed to list users', error);
      return [];
    }

    users.push(...data.users);
    if (data.users.length < USERS_PER_PAGE) break;
  }

  return users.map((u) => ({
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

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      app_metadata: { role, authenticated }
    });

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (e) {
    console.error('Add user failed', e);
    return { success: false, error: errorMessage(e) };
  }
}

export async function deleteUser(userId: string) {
  try {
    if (!(await isApprovedAdmin())) return { success: false, error: NOT_ADMIN_ERROR };

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    console.error('Delete user failed', e);
    return { success: false, error: errorMessage(e) };
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
    const attrs: AdminUserAttributes = {
      email,
      app_metadata: { ...existing.user.app_metadata, role, authenticated }
    };
    if (password) attrs.password = password;

    const { data: updatedUser, error } =
      await supabaseAdmin.auth.admin.updateUserById(id, attrs);

    if (error) return { success: false, error: error.message };

    return { success: true, data: updatedUser };
  } catch (e) {
    console.error('Update user failed', e);
    return { success: false, error: errorMessage(e) };
  }
}
