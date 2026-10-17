// Contract for the UI-agnostic API (/api/v1). Any frontend can render from these shapes.

export type InspectionStatus = 'recent' | 'due' | 'overdue' | 'never';

/** recent: inspected in the last year; due: 1-2 years; overdue: over 2 years; never: no report. */
export function statusForDays(days: number | null): InspectionStatus {
  if (days === null) return 'never';
  if (days <= 365) return 'recent';
  if (days <= 730) return 'due';
  return 'overdue';
}

export interface PersonRef {
  id: number;
  name: string;
}

export interface SiteSummary {
  id: number;
  /** namesite, used in URLs (encodeURIComponent). */
  slug: string;
  name: string;
  county: string | null;
  isActive: boolean;
  lastInspection: string | null; // ISO date
  daysSince: number | null;
  status: InspectionStatus;
  reportCount: number;
  /** Average naturalness, 1 (poor) to 4 (excellent). */
  avgNaturalness: number | null;
  steward: PersonRef | null;
  areaType: string | null; // e.g. Natural Area, Ecological Reserve
  hectares: number | null;
  /** [lng, lat] of the linked boundary, if any. */
  center: [number, number] | null;
}

export interface SiteLink {
  key: string;
  label: string;
  url: string;
}

export interface SiteDetail extends SiteSummary {
  links: SiteLink[];
  /** Naturalness score per report, oldest to newest. */
  naturalnessTrend: { date: string; score: number }[];
}

export interface ReportAnswer {
  section: string;
  question: string;
  value: string | null;
  comment: string | null;
}

export interface Report {
  id: number;
  inspectionNo: string | null;
  date: string | null;
  siteId: number;
  siteSlug: string;
  siteName: string;
  submittedBy: PersonRef | null;
  /** Name typed in the report's steward-name answer; use when submittedBy is null. */
  stewardName: string | null;
  naturalness: { score: number; label: string } | null;
  isOwn: boolean;
  /** False for a disabled report. Only admins who ask with ?includeInactive=1 receive those. */
  isActive?: boolean;
  answers?: ReportAnswer[];
}

export interface Photo {
  id: number;
  kind: 'attachments' | 'homepage_image_uploads';
  url: string;
  caption: string | null;
  identifier: string | null;
  photographer: string | null;
  date: string | null;
  siteId: number | null;
  siteName: string | null;
}

export interface BoundaryProperties {
  areaId: number;
  name: string;
  areaType: string | null;
  siteId: number | null;
  siteSlug: string | null;
  status: InspectionStatus | null; // null when no site is linked
}

export interface BoundaryCollection {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    id: number;
    properties: BoundaryProperties;
    geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
  }[];
}

export interface Me {
  userId: string;
  email: string | null;
  role: 'steward' | 'admin';
  approved: boolean;
  person: PersonRef | null;
  stats: { reports: number; sites: number };
  assignedSiteIds: number[];
}

export type QuestionType = 'option' | 'selectall' | 'text' | 'date' | 'image' | 'agreement' | 'site_select';

export interface FormQuestion {
  id: number;
  key: string;
  title: string;
  subtext: string | null;
  type: QuestionType;
  required: boolean;
  autofill: string | null;
  options: { id: number; text: string }[];
}

export interface FormSection {
  id: number;
  title: string;
  description: string | null;
  questions: FormQuestion[];
}

export interface NewReportInput {
  siteSlug: string;
  /** question id -> answer. selectall answers are arrays. */
  answers: Record<number, string | string[]>;
  /** question id -> free text for "Other" (stored as obs_comm, like the legacy <id>_comm keys). */
  comments?: Record<number, string>;
}

export interface AdminInbox {
  pendingUsers: { id: string; email: string | null; createdAt: string }[];
  recentReports: Report[];
  overdueSites: SiteSummary[];
}
