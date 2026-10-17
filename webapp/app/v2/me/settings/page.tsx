'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronRight, FileText, Loader2, LogOut, Mail, Pencil, ShieldCheck, UserRound } from 'lucide-react';
import { useSignOut } from '@/hooks/useSignOut';
import { api } from '@/lib/api/v1/client';
import { useApi } from '@/app/v2/_lib/useApi';
import { PageHeader, SectionTitle, btn, card, tabBarPadding } from '@/app/v2/_components/flows/ui';
import { AdminSettingsLinks } from '@/app/v2/_components/admin/lazy';

const ROW = 'flex min-h-14 items-center gap-3 px-4 py-2 text-[15px]';
const LINK_ROW = `${ROW} press font-semibold [--press-scale:0.99] hover:bg-[var(--bg)] active:bg-[var(--bg-sunken)]`;

export default function SettingsPage() {
  const router = useRouter();
  const me = useApi('me', api.me);
  const { signOut, error } = useSignOut(() => router.replace('/login'));
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = me.data?.role === 'admin';

  return (
    <>
      <PageHeader
        eyebrow={me.data ? (isAdmin ? 'Admin account' : 'Steward account') : me.error ? null : undefined}
        title="Settings"
        back={
          <Link href="/v2/me" aria-label="Back to your profile" className={`${btn.onPhoto} -ml-1`}>
            <ArrowLeft size={22} aria-hidden />
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pt-6 md:px-8" style={tabBarPadding}>
        <Group title="Account">
          <li className={ROW}>
            <Mail size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
            <span className="text-[var(--ink-2)]">Email</span>
            <span className="ml-auto min-w-0 truncate font-semibold">
              {me.data ? me.data.email ?? 'Not set' : <span aria-hidden className="inline-block h-4 w-40 animate-pulse rounded bg-[var(--bg-sunken)] align-middle" />}
            </span>
          </li>
          <li className={ROW}>
            {isAdmin ? (
              <ShieldCheck size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
            ) : (
              <UserRound size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
            )}
            <span className="text-[var(--ink-2)]">Role</span>
            <span className="ml-auto font-semibold">{me.data ? (isAdmin ? 'Admin' : 'Steward') : ''}</span>
          </li>
          <li>
            <Link href="/v2/me?edit=1" className={LINK_ROW}>
              <Pencil size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
              <span className="flex-1">Edit profile</span>
              <ChevronRight size={18} aria-hidden className="text-[var(--ink-2)]" />
            </Link>
          </li>
        </Group>

        <Group title="Help">
          <li>
            <a href="mailto:devteams@sapaastewards.com" className={LINK_ROW}>
              <Mail size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
              <span className="flex-1">
                Contact us
                <span className="block text-[13px] font-normal text-[var(--ink-2)]">devteams@sapaastewards.com</span>
              </span>
              <ArrowUpRight size={18} aria-hidden className="text-[var(--ink-2)]" />
            </a>
          </li>
          <li>
            <Link href={{ pathname: '/terms', query: { from: '/v2/me/settings' } }} className={LINK_ROW}>
              <FileText size={20} aria-hidden className="shrink-0 text-[var(--ink-2)]" />
              <span className="flex-1">Terms and conditions</span>
              <ChevronRight size={18} aria-hidden className="text-[var(--ink-2)]" />
            </Link>
          </li>
        </Group>

        <AdminSettingsLinks />

        {/* Destructive, and set apart from everything above. */}
        <div className={`${card} mt-12 overflow-hidden`}>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              if (!(await signOut())) setSigningOut(false);
            }}
            aria-describedby={error ? 'signout-error' : undefined}
            className={`${LINK_ROW} w-full text-[var(--clay-ink)] disabled:opacity-60`}
          >
            {signingOut ? <Loader2 size={20} aria-hidden className="animate-spin" /> : <LogOut size={20} aria-hidden />}
            <span className="flex-1 text-left">{signingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
        {error && (
          <p id="signout-error" role="alert" className="mt-2 text-[15px] font-semibold text-[var(--clay-ink)]">
            {error}
          </p>
        )}
      </main>
    </>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <SectionTitle>{title}</SectionTitle>
      {note && <p className="text-sm text-[var(--ink-2)]">{note}</p>}
      <ul className={`${card} mt-2 divide-y divide-[var(--line)] overflow-hidden`}>{children}</ul>
    </section>
  );
}
