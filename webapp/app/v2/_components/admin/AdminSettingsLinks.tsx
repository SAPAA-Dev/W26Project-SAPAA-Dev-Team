'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronRight, ClipboardList, LayoutDashboard, UsersRound } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import { useApi } from '@/app/v2/_lib/useApi';
import { card, SectionTitle } from '@/app/v2/_components/flows/ui';
import { plural, useIsAdmin } from './shared';

const ROW =
  'press flex min-h-14 items-center gap-3 px-4 py-2 text-[15px] font-semibold [--press-scale:0.99] hover:bg-[var(--bg)] active:bg-[var(--bg-sunken)]';
const ICON = 'shrink-0 text-[var(--ink-2)]';

/**
 * The admin group in Settings. Site, report and photo tools sit on those screens for admins, so only the
 * pages with no steward twin are listed. Form editor and dashboard still open the classic view.
 */
export default function AdminSettingsLinks() {
  const isAdmin = useIsAdmin();
  const inbox = useApi(isAdmin ? 'admin-inbox' : null, api.adminInbox);
  if (!isAdmin) return null;
  const pending = inbox.data?.pendingUsers.length;

  return (
    <section className="mt-8 first:mt-0">
      <SectionTitle>Admin tools</SectionTitle>
      <p className="text-sm text-[var(--ink-2)]">Manage sites, reports and photos from their own pages.</p>
      <ul className={`${card} mt-2 divide-y divide-[var(--line)] overflow-hidden`}>
        <li>
          <Link href="/v2/admin/accounts" className={ROW}>
            <UsersRound size={20} aria-hidden className={ICON} />
            <span className="min-w-0 flex-1">
              Accounts and approvals
              {!!pending && (
                <span className="block text-sm font-normal text-[var(--st-due-ink)]">
                  {plural(pending, 'person', 'people')} waiting for approval
                </span>
              )}
            </span>
            <ChevronRight size={18} aria-hidden className="text-[var(--ink-2)]" />
          </Link>
        </li>
        {[
          { href: '/admin/form-editor', label: 'Inspection form editor', Icon: ClipboardList },
          { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
        ].map(({ Icon, ...l }) => (
          <li key={l.href}>
            <Link href={l.href} className={ROW}>
              <Icon size={20} aria-hidden className={ICON} />
              <span className="min-w-0 flex-1">
                {l.label}
                <span className="block text-sm font-normal text-[var(--ink-2)]">Opens classic view</span>
              </span>
              <ArrowUpRight size={18} aria-hidden className="text-[var(--ink-2)]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
