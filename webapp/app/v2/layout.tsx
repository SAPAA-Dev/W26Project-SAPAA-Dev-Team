import { Suspense } from 'react';
import { preload } from 'react-dom';
import type { Viewport } from 'next';
import { Nunito_Sans } from 'next/font/google';
import './forest.css';
import BottomNav from './_components/BottomNav';
import PhotoHero from './_components/sites/PhotoHero';
import { ListSkeleton } from './_components/flows/ui';

// Avenir Next is native on Apple devices (the deck's face); Nunito Sans is the close web fallback.
const nunito = Nunito_Sans({ subsets: ['latin'], variable: '--font-nunito', display: 'swap', axes: ['wdth'] });

export const metadata = { title: 'SAPAA · Boreal prototype' };

// Without viewport-fit=cover, iOS reports env(safe-area-inset-*) as 0 and the tab bar can't clear the home indicator.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function V2Layout({ children }: { children: React.ReactNode }) {
  // Every tab reads /me and most read /sites: the HTML starts both while the scripts download. useApi's
  // fetch() then takes the preloaded response (or the HTTP cache entry it filled) instead of asking again.
  preload('/api/v1/me', { as: 'fetch', crossOrigin: 'anonymous' });
  preload('/api/v1/sites', { as: 'fetch', crossOrigin: 'anonymous' });
  return (
    <div className={`v2 ${nunito.variable}`}>
      {/* The tab bar shares the page's boundary: its idle cache warm-up must not land before the page
          hydrates, or the page would hydrate with data the server HTML did not have. A page that reads the URL
          query renders on the client in a static build; until then this fallback paints a header-and-list
          skeleton with the tab bar (static HTML, never hydrated), not a blank screen. */}
      <Suspense
        fallback={
          <>
            <PageSkeleton />
            <BottomNav />
          </>
        }
      >
        {children}
        <BottomNav />
      </Suspense>
    </div>
  );
}

/** The shape every tab page shares (PageHeader's photo hero, then a list), for first paint before hydration. */
function PageSkeleton() {
  return (
    <main aria-busy="true">
      <PhotoHero className="pb-8 md:pb-10">
        <div className="mx-auto max-w-3xl px-5 pt-[max(12px,env(safe-area-inset-top))] md:px-8">
          <div className="min-h-11" />
          <div aria-hidden className="mt-10 flex flex-col md:mt-16">
            <span className="h-[15px] w-32 animate-pulse rounded bg-white/20" />
            <span className="mt-2 h-[34px] w-1/2 animate-pulse rounded-lg bg-white/20" />
          </div>
        </div>
      </PhotoHero>
      <div className="mx-auto max-w-3xl px-4 pt-4 md:px-8">
        <ListSkeleton label="Loading" />
      </div>
    </main>
  );
}
