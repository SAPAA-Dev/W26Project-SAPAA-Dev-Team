// 1.0.1 AT1: a person's optional contact details. One list, used by /api/profile and ProfilePage.
// The checks here match the ones on public.socials in 20261005010000_create_socials.sql.

export const SOCIAL_FIELDS = [
  { key: 'email', label: 'Email', kind: 'email' },
  { key: 'phone', label: 'Phone', kind: 'phone' },
  { key: 'website', label: 'Website', kind: 'link' },
  { key: 'instagram', label: 'Instagram', kind: 'link' },
  { key: 'facebook', label: 'Facebook', kind: 'link' },
  { key: 'x', label: 'X', kind: 'link' },
  { key: 'linkedin', label: 'LinkedIn', kind: 'link' },
] as const;

export type SocialKey = (typeof SOCIAL_FIELDS)[number]['key'];
export type Socials = Record<SocialKey, string | null>;

const MAX_LENGTH = { email: 254, phone: 30, link: 300 } as const;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Only https links, so a stored link can never be a javascript: URL.
const LINK_PATTERN = /^https:\/\/\S+$/i;

export function emptySocials(): Socials {
  return Object.fromEntries(SOCIAL_FIELDS.map(({ key }) => [key, null])) as Socials;
}

// Reads a socials row (or nothing) into the shape the page uses.
export function toSocials(row: Partial<Record<SocialKey, string | null>> | null | undefined): Socials {
  const socials = emptySocials();
  for (const { key } of SOCIAL_FIELDS) socials[key] = row?.[key] ?? null;
  return socials;
}

// Checks what a user typed. Blank fields become null. Throws a message the user can read.
export function normaliseSocials(value: unknown): Socials {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Contact details must be an object.');
  }
  const input = value as Record<string, unknown>;
  const socials = emptySocials();

  for (const { key, label, kind } of SOCIAL_FIELDS) {
    const raw = input[key];
    if (raw !== undefined && raw !== null && typeof raw !== 'string') throw new Error(`${label} must be text.`);
    const text = (raw ?? '').trim();
    if (!text) continue;
    if (text.length > MAX_LENGTH[kind]) throw new Error(`${label} must be ${MAX_LENGTH[kind]} characters or fewer.`);
    if (kind === 'email' && !EMAIL_PATTERN.test(text)) throw new Error('Enter a valid email address.');
    if (kind === 'link' && !LINK_PATTERN.test(text)) throw new Error(`${label} must be a link that starts with https://`);
    socials[key] = text;
  }

  return socials;
}

export function socialHref(kind: (typeof SOCIAL_FIELDS)[number]['kind'], value: string): string {
  if (kind === 'email') return `mailto:${value}`;
  if (kind === 'phone') return `tel:${value.replace(/[^\d+]/g, '')}`;
  return value;
}
