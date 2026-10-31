'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import { addUser, deleteUser, getAllUsers, updateUser, type User } from '@/utils/admin-actions';
import { invalidate, useApi } from '@/app/v2/_lib/useApi';
import {
  btn,
  card,
  EmptyState,
  ErrorState,
  Field,
  fieldAria,
  inputCls,
  ListSkeleton,
  PageHeader,
  SearchField,
  Segmented,
  Sheet,
  tabBarPadding,
  useUrlParam,
} from '@/app/v2/_components/flows/ui';
import { Confirm, errMsg, plural, toast, Toggle } from './shared';

type Filter = 'all' | 'pending' | 'approved' | 'admin';
const FILTERS: [Filter, string][] = [
  ['all', 'People'],
  ['pending', 'Waiting'],
  ['approved', 'Approved'],
  ['admin', 'Admins'],
];
const keep: Record<Filter, (u: User) => boolean> = {
  all: () => true,
  pending: (u) => !u.authenticated,
  approved: (u) => u.authenticated,
  admin: (u) => u.role === 'admin',
};

/** /v2/admin/accounts: the classic account management page (utils/admin-actions.ts) in Boreal. */
export default function AccountsView() {
  const me = useApi('me', api.me);
  const isAdmin = me.data?.role === 'admin';
  const users = useApi(isAdmin ? 'admin:users' : null, getAllUsers);
  const [filterParam, setFilter] = useUrlParam('show', 'all');
  const [q, setQ] = useUrlParam('q');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const edit = (who: User | 'new', e: React.MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget;
    setEditing(who);
  };
  const stopEditing = () => {
    setEditing(null);
    // The sheet unmounts; focus goes back to the row or button that opened it.
    requestAnimationFrame(() => opener.current?.focus());
  };
  const [approving, setApproving] = useState<string | null>(null);
  const filter = (FILTERS.find(([f]) => f === filterParam)?.[0] ?? 'all') as Filter;

  const all = users.data;
  const term = q.trim().toLowerCase();
  const list = (all ?? [])
    .filter(keep[filter])
    .filter((u) => !term || u.email.toLowerCase().includes(term))
    // Waiting first: they are the ones an admin came here for.
    .sort((a, b) => Number(a.authenticated) - Number(b.authenticated) || a.email.localeCompare(b.email));
  const count = (f: Filter) => all?.filter(keep[f]).length;

  const refresh = () => {
    users.refetch();
    invalidate('admin-inbox');
  };
  const approve = async (u: User) => {
    setApproving(u.id);
    const r = await updateUser({ id: u.id, email: u.email, role: u.role, authenticated: true }).catch((e) => ({
      success: false,
      error: errMsg(e, ''),
    }));
    setApproving(null);
    if (!r.success) return toast(('error' in r && r.error) || `${u.email} was not approved. Try again.`, 'error');
    toast(`${u.email} approved. They can sign in now.`);
    refresh();
  };

  if (me.data && !isAdmin)
    return (
      <main className="mx-auto max-w-md px-5 pt-24 text-center" style={tabBarPadding}>
        <EmptyState title="Only admins manage accounts" body="Ask a SAPAA admin if you need to change someone’s access.">
          <Link href="/v2/me/settings" className={btn.secondary}>
            Back to settings
          </Link>
        </EmptyState>
      </main>
    );

  return (
    <>
      <PageHeader
        eyebrow={me.data ? 'Admin' : me.error ? null : undefined}
        title="Accounts"
        sub={all ? `${plural(all.length, 'person', 'people')}, ${count('pending')} waiting for approval` : undefined}
        back={
          <Link href="/v2/me/settings" aria-label="Back to settings" className={`${btn.onPhoto} -ml-1`}>
            <ArrowLeft size={22} aria-hidden />
          </Link>
        }
        action={
          <button type="button" onClick={(e) => edit('new', e)} disabled={!isAdmin} className={`${btn.onPhoto} px-4`}>
            <UserPlus size={18} aria-hidden />
            Add person
          </button>
        }
      >
        <SearchField label="Search by email" placeholder="Search by email" value={q} onChange={setQ} />
      </PageHeader>

      <main className="mx-auto max-w-3xl px-4 pt-2 md:px-8" style={tabBarPadding}>
        {/* The four counts double as the filter. */}
        <div role="group" aria-label="Show" className={`${card} grid grid-cols-4 divide-x divide-[var(--line)] overflow-hidden`}>
          {FILTERS.map(([f, label]) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`press px-2 py-3.5 text-left transition-colors duration-[var(--dur-1)] md:px-4 ${
                filter === f ? 'bg-[var(--bg-sunken)] shadow-[inset_0_-3px_0_var(--accent)]' : 'hover:bg-[var(--bg)]'
              }`}
            >
              <span
                className="num block text-[28px] leading-none font-bold [font-stretch:87.5%] md:text-[34px]"
                style={f === 'pending' && count('pending') ? { color: 'var(--st-due-ink)' } : undefined}
              >
                {count(f) ?? '–'}
              </span>
              <span className="mt-2 block text-[13px] leading-tight text-[var(--ink-2)]">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          {users.error ? (
            <ErrorState title="Accounts didn’t load" error={users.error} onRetry={users.refetch} />
          ) : !all ? (
            <ListSkeleton label="Loading accounts" />
          ) : list.length === 0 ? (
            <EmptyState
              title={term ? `No one matches “${q.trim()}”` : filter === 'pending' ? 'No one is waiting' : 'No accounts here'}
              body={filter === 'pending' && !term ? 'New sign-ups show up here until you approve them.' : undefined}
            />
          ) : (
            <ul className={`${card} divide-y divide-[var(--line)] overflow-hidden`}>
              {list.map((u) => (
                <li key={u.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => edit(u, e)}
                    className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 pr-2 pl-4 text-left transition-colors duration-[var(--dur-1)] hover:bg-[var(--bg)] active:bg-[var(--bg-sunken)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{u.email || 'No email'}</span>
                      <span className="flex items-center gap-1.5 text-sm text-[var(--ink-2)]">
                        {u.role === 'admin' && <ShieldCheck size={14} aria-hidden className="text-[var(--forest)]" />}
                        {u.role === 'admin' ? 'Admin' : 'Steward'}
                        {!u.authenticated && <span className="font-semibold text-[var(--st-due-ink)]">Waiting for approval</span>}
                      </span>
                    </span>
                    {u.authenticated && <ChevronRight size={18} aria-hidden className="shrink-0 text-[var(--ink-2)]" />}
                  </button>
                  {!u.authenticated && (
                    <button
                      type="button"
                      onClick={() => approve(u)}
                      disabled={approving !== null}
                      className={`${btn.primary} mr-3 min-h-11 shrink-0 px-4 text-[15px]`}
                    >
                      {approving === u.id && <Loader2 size={16} aria-hidden className="animate-spin" />}
                      Approve
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {editing && (
        <AccountSheet
          user={editing === 'new' ? null : editing}
          self={editing !== 'new' && editing.id === me.data?.userId}
          onClose={stopEditing}
          onSaved={(message) => {
            stopEditing();
            toast(message);
            refresh();
          }}
        />
      )}
    </>
  );
}

/* ---------- add or edit one account (AccountDetailsModal) ---------- */

function AccountSheet({
  user,
  self,
  onClose,
  onSaved,
}: {
  user: User | null;
  self: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<'steward' | 'admin'>(user?.role === 'admin' ? 'admin' : 'steward');
  const [approved, setApproved] = useState(user?.authenticated ?? true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const save = async () => {
    const next = {
      email: !email.trim() ? 'Enter an email address.' : undefined,
      // A new account needs a password; an existing one changes it only when typed.
      password: !user && !password ? 'Set a password.' : password && password.length < 6 ? 'Use at least 6 characters.' : undefined,
      confirm: password && password !== confirm ? 'The passwords don’t match.' : undefined,
    };
    setErrors(next);
    const first = (['email', 'password', 'confirm'] as const).find((k) => next[k]);
    if (first) return document.getElementById(`acct-${first}`)?.focus();
    setBusy(true);
    setError(null);
    try {
      const r = user
        ? await updateUser({ id: user.id, email: email.trim(), role, authenticated: approved, ...(password && { password }) })
        : await addUser({ email: email.trim(), password, role, authenticated: approved });
      if (!r.success) throw new Error(r.error);
      onSaved(user ? `${email.trim()} saved.` : `${email.trim()} added${approved ? ' and approved' : ''}.`);
    } catch (e) {
      setError(errMsg(e, 'The account was not saved. Try again.'));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!user) return;
    setRemoving(true);
    const r = await deleteUser(user.id).catch((e) => ({ success: false, error: errMsg(e, '') }));
    setRemoving(false);
    if (!r.success) return setError(('error' in r && r.error) || 'The account was not deleted. Try again.');
    setDeleting(false);
    onSaved(`${user.email} deleted.`);
  };

  return (
    <>
      <Sheet
        open={!deleting}
        onClose={() => !busy && onClose()}
        title={user ? 'Edit account' : 'Add a person'}
        description={user ? user.email : 'They sign in with this email and password.'}
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="flex flex-col gap-5 pt-1"
        >
          <Field id="acct-email" label="Email" required error={errors.email}>
            <input
              {...fieldAria('acct-email', errors.email)}
              type="email"
              autoComplete="off"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className={`${inputCls} h-12`}
            />
          </Field>

          <div>
            <p id="acct-role" className="mb-1.5 text-[15px] font-semibold">
              Role
            </p>
            <div aria-labelledby="acct-role">
              <Segmented<'steward' | 'admin'>
                label="Role"
                value={role}
                onChange={setRole}
                options={[
                  ['steward', 'Steward'],
                  ['admin', 'Admin'],
                ]}
              />
            </div>
            {self && role !== 'admin' && (
              <p className="mt-1.5 text-sm font-semibold text-[var(--clay-ink)]">This removes your own admin access.</p>
            )}
          </div>

          <Toggle
            label="Approved"
            hint={approved ? 'Can sign in and use the app.' : 'Waits for approval before they can sign in.'}
            checked={approved}
            onChange={setApproved}
            disabled={busy}
          />

          <fieldset className="flex flex-col gap-4 border-t border-[var(--line)] pt-4">
            <legend className="sr-only">Password</legend>
            <Field
              id="acct-password"
              label={user ? 'New password' : 'Password'}
              required={!user}
              hint={user ? 'Leave blank to keep the current one.' : 'At least 6 characters.'}
              error={errors.password}
            >
              <input
                {...fieldAria('acct-password', errors.password, true)}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className={`${inputCls} h-12`}
              />
            </Field>
            {password && (
              <Field id="acct-confirm" label="Type it again" error={errors.confirm}>
                <input
                  {...fieldAria('acct-confirm', errors.confirm)}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={busy}
                  className={`${inputCls} h-12`}
                />
              </Field>
            )}
          </fieldset>

          {error && (
            <p role="alert" className="text-[15px] font-semibold text-[var(--clay-ink)]">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
            {busy && <Loader2 size={18} aria-hidden className="animate-spin" />}
            {user ? 'Save account' : 'Add person'}
          </button>
          {user && (
            <button
              type="button"
              onClick={() => setDeleting(true)}
              disabled={busy || self}
              className="press -mt-2 flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-m)] text-[15px] font-semibold text-[var(--clay-ink)] hover:bg-[var(--bg-sunken)] disabled:opacity-45"
            >
              <Trash2 size={16} aria-hidden />
              {self ? 'You can’t delete your own account' : 'Delete account'}
            </button>
          )}
        </form>
      </Sheet>
      {user && deleting && (
        <Confirm
          open
          onClose={() => setDeleting(false)}
          title={`Delete ${user.email}?`}
          description="They can no longer sign in. Reports they filed stay on their sites. This cannot be undone."
          confirmLabel={removing ? 'Deleting' : 'Delete account'}
          busy={removing}
          error={error}
          onConfirm={remove}
        />
      )}
    </>
  );
}
