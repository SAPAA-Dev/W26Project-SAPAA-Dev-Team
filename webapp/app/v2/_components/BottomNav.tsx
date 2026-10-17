'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trees, FileText, Image as ImageIcon, CircleUser } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import { prefetch } from '../_lib/useApi';
import { whenIdle } from './sites/useSites';

const TABS = [
  { href: '/v2/sites', label: 'Sites', icon: Trees },
  { href: '/v2/reports', label: 'Reports', icon: FileText },
  { href: '/v2/photos', label: 'Photos', icon: ImageIcon },
  { href: '/v2/me', label: 'You', icon: CircleUser },
];

/** Phone tab bar height above the safe area (mirrors --nav-h). Pages pad with var(--nav-clear), which covers md+ too. */
export const NAV_HEIGHT = 60;

/**
 * Phones: a full-width bar whose own bottom padding holds the home-indicator inset.
 * md+: a floating pill with even 6px padding, lifted max(16px, safe area) off the bottom edge.
 */
export default function BottomNav() {
  const path = usePathname();
  // Every tab starts from /me and /sites. Hold both in memory once the first page is idle (the layout
  // preloaded them), so switching tabs paints from cache instead of a skeleton.
  useEffect(
    () =>
      whenIdle(() => {
        prefetch('me', api.me);
        prefetch('sites', api.sites);
      }),
    [],
  );
  // Full-screen flows hide the tab bar (inspection form).
  if (path.endsWith('/inspect')) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 bg-[var(--forest)] pb-[var(--safe-b)] md:inset-x-auto md:bottom-[max(16px,var(--safe-b))] md:left-1/2 md:-translate-x-1/2 md:rounded-full md:p-1.5 md:shadow-[0_10px_30px_-6px_rgba(18,42,28,0.35)]"
    >
      <ul className="mx-auto flex h-[var(--nav-h)] max-w-md md:h-11 md:max-w-none md:gap-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`press relative flex h-full flex-col items-center justify-center gap-[3px] text-[12px] leading-[15px] font-semibold md:flex-row md:gap-2 md:rounded-full md:px-4 md:text-sm md:leading-5 ${
                  active ? 'text-[var(--honey)]' : 'text-[var(--sage)] hover:text-[var(--birch)] md:hover:bg-[var(--forest-2)]'
                }`}
              >
                <Icon className="size-[22px] md:size-[18px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
                {/* "You are here" mark: shape as well as colour. Grows from its centre when the tab becomes active. */}
                <span
                  aria-hidden
                  className={`absolute bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[var(--honey)] transition-transform duration-[var(--dur-2)] ease-[var(--ease-out)] md:bottom-[3px] ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
