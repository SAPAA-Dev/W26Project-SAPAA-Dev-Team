import {
  getFormResponsesBySite,
  getAttachmentsByResponseId,
  getSiteByName,
} from '@/utils/supabase/queries';
import { createServerSupabase } from '@/utils/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PdfRequest, PdfReportData, PdfSiteData, PdfAttachment, PdfOptions } from './types';

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

function getS3Client() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Detect image format from the first bytes of a buffer.
 * @react-pdf/renderer only supports PNG and JPEG.
 * Returns 'png', 'jpg', or null if unsupported (e.g. webp).
 */
function detectImageFormat(buf: Buffer): 'png' | 'jpg' | null {
  if (buf.length < 4) return null;

  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpg';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50  (RIFF....WEBP)
  // Not supported by @react-pdf/renderer — return null
  return null;
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; format: 'png' | 'jpg' } | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const arrayBuffer = await res.arrayBuffer();
    // Use Uint8Array to create a proper copy — Buffer.from(arrayBuffer) only
    // creates a view that shares memory with the fetch response, which can be
    // reclaimed by the runtime and leave the Buffer with invalid data.
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    const format = detectImageFormat(buffer);
    if (!format) return undefined; // unsupported format (webp, etc.)
    return { buffer, format };
  } catch {
    return undefined;
  }
}

async function fetchAttachmentsForResponse(
  responseId: number,
  options: PdfOptions
): Promise<PdfAttachment[]> {
  if (!options.includeImages) return [];

  const rows = await getAttachmentsByResponseId(responseId);

  const imageRows = rows
    .filter((r) => r.content_type && ALLOWED_IMAGE_TYPES.includes(r.content_type))
    .slice(0, options.maxImagesPerInspection);

  const attachments: PdfAttachment[] = [];
  const s3 = getS3Client();

  for (const row of imageRows) {
    let imageBuffer: Buffer | undefined;
    let detectedFormat: 'png' | 'jpg' = 'jpg';

    if (row.storage_key) {
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: row.storage_key,
        });
        const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
        const result = await fetchImageBuffer(presignedUrl);
        if (result) {
          imageBuffer = result.buffer;
          detectedFormat = result.format;
        }
      } catch {
        // Skip image on error
      }
    }

    attachments.push({
      filename: row.filename ?? 'unknown',
      caption: row.caption,
      description: row.description,
      imageBuffer,
      contentType: detectedFormat === 'png' ? 'image/png' : 'image/jpeg',
    });
  }

  return attachments;
}

function filterResponsesByOptions(
  responses: import('@/utils/supabase/queries').FormResponse[],
  options: PdfOptions
) {
  let filtered = [...responses];

  // Filter by selected response IDs
  if (options.selectedResponseIds && options.selectedResponseIds.length > 0) {
    filtered = filtered.filter((r) => options.selectedResponseIds!.includes(r.id));
  }

  // Filter by date range
  if (options.dateFrom) {
    const from = new Date(options.dateFrom);
    filtered = filtered.filter((r) => {
      if (!r.created_at) return false;
      return new Date(r.created_at) >= from;
    });
  }
  if (options.dateTo) {
    const to = new Date(options.dateTo);
    to.setUTCHours(23, 59, 59, 999);
    filtered = filtered.filter((r) => {
      if (!r.created_at) return false;
      return new Date(r.created_at) <= to;
    });
  }

  // Sort
  filtered.sort((a, b) => {
    const da = new Date(a.created_at ?? 0).getTime();
    const db = new Date(b.created_at ?? 0).getTime();
    return options.sortOrder === 'newest' ? db - da : da - db;
  });

  // Filter sections from answers
  if (options.selectedSections !== 'all') {
    filtered = filtered.map((r) => ({
      ...r,
      answers: r.answers.filter(
        (a) => a.section_title && (options.selectedSections as string[]).includes(a.section_title)
      ),
    }));
  }

  // Filter empty answers
  if (!options.includeEmptyAnswers) {
    filtered = filtered.map((r) => ({
      ...r,
      answers: r.answers.filter((a) => a.obs_value || a.obs_comm),
    }));
  }

  return filtered;
}

async function fetchSiteData(
  siteName: string,
  options: PdfOptions
): Promise<PdfSiteData> {
  const siteInfo = await getSiteByName(siteName);
  if (!siteInfo.length) throw new Error(`Site not found: ${siteName}`);

  const rawResponses = await getFormResponsesBySite(siteName);
  const responses = filterResponsesByOptions(rawResponses, options);

  let attachmentsByResponse: Map<number, PdfAttachment[]> | undefined;

  if (options.includeImages) {
    attachmentsByResponse = new Map();
    for (const r of responses) {
      const atts = await fetchAttachmentsForResponse(r.id, options);
      if (atts.length > 0) {
        attachmentsByResponse.set(r.id, atts);
      }
    }
  }

  return {
    siteName: siteInfo[0].namesite,
    county: siteInfo[0].county,
    responses,
    attachmentsByResponse,
  };
}

async function fetchSingleResponse(
  responseId: number,
  options: PdfOptions
): Promise<PdfSiteData> {
  const supabase = createServerSupabase();

  const { data: responseData, error } = await supabase
    .from('W26_form_responses')
    .select('site_id')
    .eq('id', responseId)
    .single();

  if (error || !responseData) throw new Error('Response not found');

  const { data: siteData, error: siteError } = await supabase
    .from('W26_sites-pa')
    .select(`namesite, W26_ab_counties (county)`)
    .eq('id', (responseData as any).site_id)
    .single();

  if (siteError || !siteData) throw new Error('Site not found for response');

  const siteName = (siteData as any).namesite;
  const county = (siteData as any).W26_ab_counties?.county ?? null;

  const allResponses = await getFormResponsesBySite(siteName);
  const singleOnly = allResponses.filter((r) => r.id === responseId);
  const responses = filterResponsesByOptions(singleOnly, options);

  let attachmentsByResponse: Map<number, PdfAttachment[]> | undefined;
  if (options.includeImages) {
    attachmentsByResponse = new Map();
    const atts = await fetchAttachmentsForResponse(responseId, options);
    if (atts.length > 0) {
      attachmentsByResponse.set(responseId, atts);
    }
  }

  return {
    siteName,
    county,
    responses,
    attachmentsByResponse,
  };
}

export async function fetchReportData(request: PdfRequest): Promise<PdfReportData> {
  const options = request.options;
  let sites: PdfSiteData[];

  switch (request.mode) {
    case 'single': {
      const site = await fetchSingleResponse(request.responseId, options);
      sites = [site];
      break;
    }
    case 'site': {
      const site = await fetchSiteData(request.siteName, options);
      sites = [site];
      break;
    }
    case 'multi-site': {
      sites = await Promise.all(
        request.siteNames.map((name) => fetchSiteData(name, options))
      );
      break;
    }
  }

  return {
    sites,
    generatedAt: new Date().toISOString(),
    options,
  };
}
