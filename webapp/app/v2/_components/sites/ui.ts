import { ago, type SiteQuery } from '../../_lib/siteQuery';

/** globals.css forces DM Sans on h1-h6 (unlayered, so utilities lose); headings opt back into the Boreal face. */
export const HEADING = { fontFamily: 'inherit' } as const;

/** `.v2` sets font-feature-settings 'tnum' 0, which overrides font-variant-numeric; numbers opt in here. */
export const TNUM = "[font-feature-settings:'tnum']";

export const BASE_QUERY: SiteQuery = {
  mode: 'list',
  q: '',
  view: 'all',
  status: [],
  county: [],
  sort: 'urgency',
  selected: null,
};

export const siteHref = (slug: string) => `/v2/sites/${encodeURIComponent(slug)}`;

/** Date-only ISO strings ("2025-09-14") are calendar days, not UTC midnight (which shows as the day before in Alberta). */
export function toDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso);
}

export function fmtDate(
  iso: string | null,
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
) {
  return iso ? new Intl.DateTimeFormat('en-CA', opts).format(toDate(iso)) : 'No date';
}

/** "14 months ago", "Visited today", "Never inspected". */
export function since(days: number | null) {
  if (days === null) return 'Never inspected';
  const a = ago(days);
  return a === 'today' ? 'Visited today' : `${a} ago`;
}

/**
 * The big time-since number and the label under it, in ago()'s units so every surface agrees with the list's
 * "10 months ago": ['10', 'months since visit'], ['Today', 'last visit'], ['Never', 'inspected'].
 */
export function sinceVisit(days: number | null): [string, string] {
  const text = ago(days);
  if (text === 'never') return ['Never', 'inspected'];
  if (text === 'today') return ['Today', 'last visit'];
  const [n, unit] = text.split(' ');
  return [n, `${unit} since visit`];
}

/** "Parkland County" -> "Parkland", "County of Grande Prairie No. 1" -> "Grande Prairie". */
export const shortCounty = (c: string) =>
  c.replace(/^(County of|Municipal District of|M\.D\. of)\s+/i, '').replace(/\s+(County|No\.\s*\d+)$/i, '');
