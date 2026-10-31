import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Photo } from '../types';
import type { Caller } from './auth';
import { db, fetchAll } from './db';
import { visibleSites } from './sites';

// Same S3 setup and one-hour GET links as app/api/sites/[siteId]/gallery and app/api/homepage-images.
// Locally, AWS_ENDPOINT_URL_S3 (set by scripts/local_s3.js) points the SDK at LocalStack.
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface PhotoRow {
  id: number;
  site_id: number | null;
  storage_key: string;
  caption: string | null;
  identifier: string | null;
  photographer: string | null;
  date: string | null;
}

// A report owner can hide one answer (US 1.0.3); the photo answer's pictures go with it. Same rule as
// app/api/sites/[siteId]/gallery: only an admin or the report's owner still sees them.
interface ReportVisibility {
  user_id: string | null;
  inspection_date?: string | null;
  created_at?: string | null;
  answers?: { question_id: number; is_hidden: boolean | null }[] | null;
}
interface AttachmentRow extends PhotoRow {
  question_id: number | null;
  form_responses: ReportVisibility | ReportVisibility[] | null;
}

const COLUMNS = 'id, site_id, storage_key, caption, identifier, photographer, date';

/**
 * Report photos (active, non-archived reports, like the site gallery) and homepage uploads on
 * visible sites. Every approved user can read both under RLS, so no per-user filter applies.
 */
export async function listPhotos(caller: Caller, siteId?: number, includeInactive = false): Promise<Photo[]> {
  const [sites, attachments, uploads] = await Promise.all([
    fetchAll<{ id: number; namesite: string }>((from, to) =>
      visibleSites('id, namesite', includeInactive).order('id').range(from, to)
    ),
    fetchAll<AttachmentRow>((from, to) => {
      let q = db()
        .from('attachments')
        .select(`${COLUMNS}, question_id, form_responses!inner(archived_at, is_active, user_id, inspection_date, created_at, answers(question_id, is_hidden))`)
        .is('form_responses.archived_at', null)
        .eq('form_responses.is_active', true)
        .in('content_type', IMAGE_TYPES);
      if (siteId !== undefined) q = q.eq('site_id', siteId);
      return q.order('id').range(from, to);
    }),
    fetchAll<PhotoRow>((from, to) => {
      let q = db().from('homepage_image_uploads').select(COLUMNS);
      if (siteId !== undefined) q = q.eq('site_id', siteId);
      return q.order('id').range(from, to);
    }),
  ]);
  const siteName = new Map(sites.map((s) => [s.id, s.namesite]));

  const tagged = [
    ...attachments.flatMap((row) => {
      const report = Array.isArray(row.form_responses) ? row.form_responses[0] : row.form_responses;
      const hidden = report?.answers?.some((a) => a.question_id === row.question_id && a.is_hidden === true) ?? false;
      const canRead = caller.isAdmin || report?.user_id === caller.userId;
      return hidden && !canRead ? [] : [{ row, kind: 'attachments' as const, hidden, date: row.date ?? report?.inspection_date ?? report?.created_at?.slice(0, 10) ?? null }];
    }),
    ...uploads.map((row) => ({ row, kind: 'homepage_image_uploads' as const, hidden: false, date: row.date ?? null })),
  ].filter(({ row }) => row.site_id !== null && siteName.has(row.site_id));

  const photos = await Promise.all(
    tagged.map(async ({ row, kind, hidden, date }): Promise<Photo | null> => {
      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: row.storage_key }), { expiresIn: 3600 });
        return {
          id: row.id,
          kind,
          url,
          caption: row.caption,
          identifier: row.identifier,
          photographer: row.photographer,
          date,
          siteId: row.site_id,
          siteName: siteName.get(row.site_id!) ?? null,
          ...(hidden ? { isHidden: true } : {}),
        };
      } catch (error) {
        console.error('[api/v1] signed URL error', error);
        return null;
      }
    })
  );
  return photos
    .filter((p): p is Photo => p !== null)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.id - a.id);
}
