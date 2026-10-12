// Image rows store an S3 key, and the server later signs or deletes that key.
// Only keys in the layouts the app writes are accepted, so a row can never point
// at another object in the bucket, for example a PDF export.

const ID = /^[1-9][0-9]*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME = /^(?!\.{1,2}$)[A-Za-z0-9._-]+$/;

// The folders before the file name for each prefix.
const LAYOUTS = new Map<string, RegExp[]>([
  ['inspections', [ID, ID, ID]], // inspections/<siteId>/<responseId>/<questionId>/<file>
  ['homepage-image-uploads', [ID, UUID]], // homepage-image-uploads/<siteId>/<userId>/<file>
  ['seed', [NAME]], // seed/<folder>/<file>, the local images from supabase/seed.sql
]);

/**
 * Returns true when the key is in one of the layouts above. Pass `expected` to
 * also require the leading parts, for example ('inspections', siteId, responseId, questionId).
 */
export function isAllowedStorageKey(
  key: unknown,
  ...expected: Array<string | number>
): key is string {
  if (typeof key !== 'string') return false;
  const parts = key.split('/');
  const layout = LAYOUTS.get(parts[0]);
  if (!layout || parts.length !== layout.length + 2) return false;
  if (!layout.every((rule, index) => rule.test(parts[index + 1]))) return false;
  if (!NAME.test(parts[parts.length - 1])) return false;
  return expected.every((value, index) => parts[index] === String(value));
}
