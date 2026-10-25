// Typed browser client for /api/v1. UI code calls these, never Supabase or server actions.
import type {
  AdminInbox,
  BoundaryCollection,
  BoundaryColorInput,
  FormSection,
  InspectionHistory,
  Me,
  NewReportInput,
  Photo,
  Report,
  ReportAnswersForEdit,
  ReportUpdateInput,
  SiteDetail,
  SiteSummary,
  SiteTrack,
  TrackCollection,
  TrackUpload,
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

  // ---- Reports and profile history (sprint 3) ----
  reportAnswers: (id: number) => call<ReportAnswersForEdit>(`/reports/${id}/answers`),
  updateReport: (id: number, input: ReportUpdateInput) => {
    freshReads();
    return call<{ id: number }>(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(input) });
  },
  /** Another steward's history with person (people.id); your own without. */
  inspectionHistory: (opts: { person?: number | string | null; page?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.person) q.set('person', String(opts.person));
    if (opts.page && opts.page > 1) q.set('page', String(opts.page));
    return call<InspectionHistory>(`/me/history${q.size ? `?${q}` : ''}`);
  },

  // ---- Map: GPX tracks and boundary colours ----
  tracks: () => call<TrackCollection>('/map/tracks'),
  siteTracks: (s: string) => call<SiteTrack[]>(`/sites/${slug(s)}/tracks`),
  /** Three steps: a signed URL, the file straight to the bucket (up to 50 MB), then the server checks and saves it. */
  uploadTrack: async (s: string, file: File) => {
    freshReads();
    const { path, signedUrl } = await call<TrackUpload>(`/sites/${slug(s)}/tracks/upload-url`, { method: 'POST' });
    // The same multipart body supabase-js sends for a signed upload.
    const body = new FormData();
    body.append('cacheControl', '3600');
    body.append('', new Blob([file], { type: 'application/gpx+xml' }), 'track.gpx');
    // The token in the URL is the credential; the public key only addresses the project, as in supabase-js.
    const apikey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const put = await fetch(signedUrl, { method: 'PUT', body, headers: { 'x-upsert': 'false', ...(apikey && { apikey }) } });
    if (!put.ok) throw new ApiError(put.status, 'The upload failed. Try again.');
    return call<{ id: number; pointCount: number }>(`/sites/${slug(s)}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ path, fileName: file.name }),
    });
  },
  deleteTrack: (s: string, id: number) => {
    freshReads();
    return call<{ ok: true }>(`/sites/${slug(s)}/tracks/${id}`, { method: 'DELETE' });
  },
  setBoundaryColor: (input: BoundaryColorInput) => {
    freshReads();
    return call<{ ok: true }>('/map/boundaries/color', { method: 'PUT', body: JSON.stringify(input) });
  },
};
