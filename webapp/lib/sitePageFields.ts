// The pre-existing list of fields an admin can add to a site page (US 2.0.5).
// Frank has not sent the full list yet, so new fields are added here.
export type SitePageFieldKind = 'url' | 'steward';

export interface SitePageFieldDefinition {
  key: string;
  label: string;
  kind: SitePageFieldKind;
  // The link a site shows while it has no saved row for this field. These are the links
  // every site showed before admins could set their own, so a new site is not left blank.
  defaultValue?: string;
}

export const SITE_PAGE_FIELDS: SitePageFieldDefinition[] = [
  { key: 'sapaa_website', label: 'SAPAA website', kind: 'url', defaultValue: 'https://sapaastewards.com/' },
  { key: 'inaturalist', label: 'iNaturalist', kind: 'url', defaultValue: 'https://www.inaturalist.org/' },
  { key: 'designated_steward', label: 'Designated steward', kind: 'steward' },
];
