export function shortenUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    const hasPath = pathname !== '' && pathname !== '/';
    return hasPath ? `${host}/…` : host;
  } catch {
    return url;
  }
}

interface SiteLinksProps {
  sapaaWebsiteUrl: string | null;
  iNaturalistUrl: string | null;
}

const links = [
  { label: 'SAPAA website', key: 'sapaaWebsiteUrl' },
  { label: 'iNaturalist', key: 'iNaturalistUrl' },
] as const;

export default function SiteLinks(props: SiteLinksProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#E4EBE4]">
      {links.map(({ label, key }) => {
        const url = props[key];
        return (
          <span key={key}>
            {label}:{' '}
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                {shortenUrl(url)}
              </a>
            ) : (
              <span className="italic">Not available</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
