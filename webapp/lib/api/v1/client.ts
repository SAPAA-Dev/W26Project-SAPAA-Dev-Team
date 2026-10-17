// Typed browser client for /api/v1. UI code calls these, never Supabase or server actions.
import type {
  AdminInbox,
  BoundaryCollection,
  FormSection,
  Me,
  NewReportInput,
  Photo,
  Report,
  SiteDetail,
  SiteSummary,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/*
 * Safe reads may be answered from the browser's HTTP cache (the API allows 30 s fresh, then 5 min stale
 * while it refetches). After a write, reads go to the network until anything cached before the write
 * has aged out. The deadline survives a reload of this tab.
 */
const FRESH_KEY = 'v2:fresh-until';
const STALE_WINDOW_MS = 330_000;
let freshUntil: number | null = null;

/** Call after any write (or a manual retry): reads skip the HTTP cache for the next few minutes. */
export function freshReads() {
  freshUntil = Date.now() + STALE_WINDOW_MS;
  try {
    sessionStorage.setItem(FRESH_KEY, String(freshUntil));
  } catch {
    // storage blocked: this page still reads fresh
  }
}

function readCache(): RequestCache {
  if (freshUntil === null) {
    try {
      freshUntil = Number(sessionStorage.getItem(FRESH_KEY)) || 0;
    } catch {
      freshUntil = 0;
    }
  }
  return Date.now() < freshUntil ? 'no-cache' : 'default';
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...(!init?.method && { cache: readCache() }),
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  // Middleware redirects signed-out calls to /login (HTML 200); treat that as 401.
  if (res.redirected || !res.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(401, 'Your session expired. Sign in again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  return body as T;
}

const slug = (s: string) => encodeURIComponent(s);

/**
 * The server honours this for admins only: one site page then shows them an inactive site and its
 * disabled reports (Report.isActive false). Stewards get exactly the default response.
 */
const ALL = '?includeInactive=1';

export const api = {
  me: () => call<Me>('/me'),
  sites: (opts?: { includeInactive?: boolean }) => call<SiteSummary[]>(`/sites${opts?.includeInactive ? ALL : ''}`),
  site: (s: string) => call<SiteDetail>(`/sites/${slug(s)}${ALL}`),
  siteReports: (s: string) => call<Report[]>(`/sites/${slug(s)}/reports${ALL}`),
  sitePhotos: (s: string) => call<Photo[]>(`/sites/${slug(s)}/photos${ALL}`),
  boundaries: () => call<BoundaryCollection>('/map/boundaries'),
  form: () => call<FormSection[]>('/form'),
  reports: () => call<Report[]>('/reports'),
  report: (id: number) => call<Report>(`/reports/${id}`),
  submitReport: (input: NewReportInput) => {
    freshReads();
    return call<{ id: number; inspectionNo: string }>('/reports', { method: 'POST', body: JSON.stringify(input) });
  },
  photos: () => call<Photo[]>('/photos'),
  adminInbox: () => call<AdminInbox>('/admin/inbox'),
};
