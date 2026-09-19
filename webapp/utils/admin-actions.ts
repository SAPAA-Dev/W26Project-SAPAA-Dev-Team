'use server';

import { supabaseAdmin } from '../utils/supabase/admin';

export interface User {
  id: string;
  email: string;
  role: string;
  authenticated: boolean;
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('Failed to list users', error);
    return [];
  }

  return data.users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    role: u.user_metadata?.role ?? 'steward',
    authenticated: u.user_metadata?.authenticated ?? false
  }));
}

export async function addUser(newUser: { email: string; password: string; role?: string; authenticated?:boolean}) {
  try {
    const { email, password, role = 'steward', authenticated = false } = newUser;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { role, authenticated }
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
    const { id, email, password, role, authenticated } = data;

    const attrs: any = {
      email,
      user_metadata: { role, authenticated }
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
