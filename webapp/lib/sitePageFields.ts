// The pre-existing list of fields an admin can add to a site page (US 2.0.5).
// Frank has not sent the full list yet, so new fields are added here.
export type SitePageFieldKind = 'url' | 'steward';

export interface SitePageFieldDefinition {
  key: string;
  label: string;
  kind: SitePageFieldKind;
}

export const SITE_PAGE_FIELDS: SitePageFieldDefinition[] = [
  { key: 'sapaa_website', label: 'SAPAA website', kind: 'url' },
  { key: 'inaturalist', label: 'iNaturalist', kind: 'url' },
  { key: 'designated_steward', label: 'Designated steward', kind: 'steward' },
];
