import type { Report } from '@/lib/api/v1/types';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Report and photo dates are date columns ("2026-09-12"). new Date() reads those as midnight UTC,
 * so they are formatted in UTC to keep the same day in Alberta. Full timestamps use local time.
 */
export function formatDate(value: string | null | undefined, style: 'medium' | 'long' = 'medium'): string {
  if (!value) return 'No date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: style,
    ...(DATE_ONLY.test(value) ? { timeZone: 'UTC' } : {}),
  }).format(d);
}

/** "October 2026", for grouping lists by month. */
export function monthLabel(value: string | null): string {
  if (!value) return 'No date';
  const d = new Date(value.length >= 7 ? `${value.slice(0, 7)}-01` : value);
  if (Number.isNaN(d.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

/** Today as YYYY-MM-DD in the device's time zone (toISOString would give tomorrow on an Alberta evening). */
export const todayLocal = () => new Date().toLocaleDateString('en-CA');

/** "just now", "12 s ago", "4 min ago", "3 h ago", "2 days ago". */
export function since(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s} s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}

/** Question numbers live in the key ("Q21_Date_Of_Visit") or, on older rows, as "(Q21)" in the title. */
export function questionNumber(title: string, key?: string | null): { no: string | null; text: string } {
  const text = title.replace(/\s*\(Q\d+(?:\.\d+)?[A-Za-z]?\)\s*/i, ' ').trim();
  const m = key?.match(/^Q(\d+(?:\.\d+)?)/i) ?? title.match(/\(Q(\d+(?:\.\d+)?[A-Za-z]?)\)/i);
  return { no: m ? `Q${m[1]}` : null, text };
}

/** Character limits on photo fields ignore spaces, matching the legacy upload forms. */
export const nonSpaceLength = (s: string) => s.replace(/\s/g, '').length;

export const SEASON_GOAL = 10;

/** Visits this calendar year: the season the goal counts toward. */
export function seasonVisits(reports: Report[], mine: (r: Report) => boolean): number {
  const year = String(new Date().getFullYear());
  return reports.filter((r) => mine(r) && r.date?.startsWith(year)).length;
}

export const siteHref = (slug: string) => `/v2/sites/${encodeURIComponent(slug)}`;

/** The person on a report: most legacy rows only carry a free-text steward name. */
export const reportPerson = (r: Report) => r.submittedBy?.name ?? r.stewardName ?? null;
