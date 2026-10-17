import data from './siteInfo.json';

/**
 * Static summaries of each protected area, paraphrased from sapaastewards.com (or Alberta Parks where SAPAA has
 * no page) and checked by hand. No runtime fetching: refresh siteInfo.json and bump lastChecked instead.
 */
export type HighlightKind = 'area' | 'habitat' | 'wildlife' | 'access' | 'history';

export interface SapaaInfo {
  key: string;
  names: string[];
  designation: 'NA' | 'ER' | 'WPP' | null;
  source: 'sapaa' | 'albertaparks';
  summary: string;
  highlights: { kind: HighlightKind; text: string }[];
  sourceUrl: string;
  /** ISO date the source page was last read. */
  lastChecked: string;
}

const ALL = data as SapaaInfo[];

/** What SAPAA is, for sites with no entry of their own. */
export const SAPAA_GENERAL = ALL.find((e) => e.key === 'sapaa')!;
export const SAPAA_LIST_URL = 'https://sapaastewards.com/protected-areas/list-of-protected-areas/';

const SUFFIX =
  /\b(natural areas?|ecological reserve|wildland provincial park|wildland park|wildland|provincial park|heritage rangeland|wilderness area)\b/g;

/** "Wagner (NA)", "Wagner Natural Area" and "wagner" all normalize to "wagner". */
export function normalize(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(SUFFIX, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const INDEX = new Map<string, SapaaInfo[]>();
for (const e of ALL) {
  if (e === SAPAA_GENERAL) continue;
  for (const n of new Set([e.key, ...e.names].map(normalize))) INDEX.set(n, [...(INDEX.get(n) ?? []), e]);
}

/** Entry for a site name like "Rumsey (ER)"; the designation picks between same-named sites. */
export function getSapaaInfo(siteName: string): SapaaInfo | null {
  const hits = INDEX.get(normalize(siteName));
  if (!hits) return null;
  const d = /\((NA|ER|WPP)\)/i.exec(siteName)?.[1].toUpperCase();
  return hits.find((e) => e.designation === d) ?? hits[0];
}
