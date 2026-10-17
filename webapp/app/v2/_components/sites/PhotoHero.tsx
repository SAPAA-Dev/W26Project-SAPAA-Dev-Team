import Image from 'next/image';

/**
 * Deck-style photo hero: the wetland photo under a deep forest scrim. The scrim is the only gradient in Boreal.
 * As the hero scrolls away a canopy layer deepens it (CSS scroll timeline --hero); put .hero-drift on content
 * that should sink and fade with it.
 */
export default function PhotoHero({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <header className={`hero-timeline relative isolate overflow-hidden bg-[var(--canopy)] ${className}`}>
      <Image
        src="/images/prototype/boreal-wetland.jpg"
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,42,28,0.25) 0%, rgba(18,42,28,0.5) 45%, rgba(18,42,28,0.94) 100%)',
        }}
      />
      <div aria-hidden className="hero-deepen absolute inset-0 -z-10 bg-[var(--canopy)]" />
      {children}
    </header>
  );
}

/** The SAPAA mark and wordmark, white, for dark heroes. */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[var(--birch)] ${className}`}>
      <Image src="/images/sapaa-icon-white.png" alt="" width={22} height={24} className="h-6 w-[22px]" />
      <span className="text-[13px] leading-none font-bold tracking-[0.18em]">SAPAA</span>
    </span>
  );
}
