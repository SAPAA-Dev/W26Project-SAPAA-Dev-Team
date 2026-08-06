import {
  getFormResponsesBySite,
  getAttachmentsByResponseId,
  getSiteByName,
  getSitesByNames,
  getFormResponsesForSiteIds,
  getAttachmentsForResponseIds,
  getReportQuestionKeyMap,
} from '@/utils/supabase/queries';
import { createServerSupabase } from '@/utils/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import pLimit from 'p-limit';
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

function detectImageFormat(buf: Buffer): 'png' | 'jpg' | null {
  if (buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  return null;
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; format: 'png' | 'jpg' } | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const format = detectImageFormat(buffer);
    if (!format) return undefined;
    return { buffer, format };
  } catch {
    return undefined;
  }
}

// Bounded concurrency: at most 15 image downloads in flight at once
const imageDownloadLimit = pLimit(15);

async function downloadOneAttachment(row: {
  filename: string | null;
  caption: string | null;
  identifier: string | null;
  storage_key: string | null;
}): Promise<PdfAttachment> {
  let imageBuffer: Buffer | undefined;
  let detectedFormat: 'png' | 'jpg' = 'jpg';

  if (row.storage_key) {
    try {
      const s3 = getS3Client();
      const command = new GetObjectCommand({ Bucket: BUCKET, Key: row.storage_key });
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

  return {
    filename: row.filename ?? 'unknown',
    caption: row.caption,
    identifier: row.identifier,
    imageBuffer,
    contentType: detectedFormat === 'png' ? 'image/png' : 'image/jpeg',
  };
}

async function downloadAttachmentRows(
  rows: Array<{ filename: string | null; caption: string | null; identifier: string | null; storage_key: string | null }>
): Promise<PdfAttachment[]> {
  return Promise.all(rows.map(row => imageDownloadLimit(() => downloadOneAttachment(row))));
}

function filterResponsesByOptions(
  responses: import('@/utils/supabase/queries').FormResponse[],
  options: PdfOptions
) {
  let filtered = [...responses];

  if (options.selectedResponseIds && options.selectedResponseIds.length > 0) {
    filtered = filtered.filter((r) => options.selectedResponseIds!.includes(r.id));
  }

  if (options.dateFrom) {
    const from = new Date(options.dateFrom);
    filtered = filtered.filter((r) => {
      if (!r.created_at) return false;
      return new Date(r.created_at) >= from;
    });
  }
  if (options.dateTo) {
    const to = new Date(options.dateTo);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter((r) => {
      if (!r.created_at) return false;
      return new Date(r.created_at) <= to;
    });
  }

  filtered.sort((a, b) => {
    const da = new Date(a.created_at ?? 0).getTime();
    const db = new Date(b.created_at ?? 0).getTime();
    return options.sortOrder === 'newest' ? db - da : da - db;
  });

  if (options.selectedSections !== 'all') {
    filtered = filtered.map((r) => ({
      ...r,
      answers: r.answers.filter(
        (a) => a.section_title && (options.selectedSections as string[]).includes(a.section_title)
      ),
    }));
  }

  if (!options.includeEmptyAnswers) {
    filtered = filtered.map((r) => ({
      ...r,
      answers: r.answers.filter((a) => a.obs_value || a.obs_comm),
    }));
  }

  return filtered;
}

async function fetchMultiSiteData(siteNames: string[], options: PdfOptions): Promise<PdfSiteData[]> {
  const siteRows = await getSitesByNames(siteNames);
  if (siteRows.length === 0) throw new Error('No matching sites found');

  const keyMap = await getReportQuestionKeyMap();
  const siteIds = siteRows.map(s => s.id);
  const responsesBySite = await getFormResponsesForSiteIds(siteIds, keyMap);

  const sites: PdfSiteData[] = siteRows.map(site => {
    const raw = responsesBySite.get(site.id) ?? [];
    const responses = filterResponsesByOptions(raw, options);
    return {
      siteName: site.namesite,
      county: site.W26_ab_counties?.county ?? null,
      responses,
      attachmentsByResponse: undefined,
    };
  });

  if (options.includeImages) {
    const allResponseIds = sites.flatMap(s => s.responses.map(r => r.id));
    const attachmentRows = await getAttachmentsForResponseIds(allResponseIds);

    const byResponse = new Map<number, typeof attachmentRows>();
    for (const row of attachmentRows) {
      const list = byResponse.get(row.response_id) ?? [];
      list.push(row);
      byResponse.set(row.response_id, list);
    }

    for (const site of sites) {
      const map = new Map<number, PdfAttachment[]>();
      for (const r of site.responses) {
        const rows = (byResponse.get(r.id) ?? [])
          .filter(row => row.content_type && ALLOWED_IMAGE_TYPES.includes(row.content_type))
          .slice(0, options.maxImagesPerInspection);
        if (rows.length > 0) {
          map.set(r.id, await downloadAttachmentRows(rows));
        }
      }
      site.attachmentsByResponse = map;
    }
  }

  return sites;
}

async function fetchSiteData(siteName: string, options: PdfOptions): Promise<PdfSiteData> {
  const siteInfo = await getSiteByName(siteName);
  if (!siteInfo.length) throw new Error(`Site not found: ${siteName}`);

  const rawResponses = await getFormResponsesBySite(siteName);
  const responses = filterResponsesByOptions(rawResponses, options);

  let attachmentsByResponse: Map<number, PdfAttachment[]> | undefined;
  if (options.includeImages) {
    attachmentsByResponse = new Map();
    for (const r of responses) {
      const rows = await getAttachmentsByResponseId(r.id);
      const imageRows = rows
        .filter(row => row.content_type && ALLOWED_IMAGE_TYPES.includes(row.content_type))
        .slice(0, options.maxImagesPerInspection);
      if (imageRows.length > 0) {
        attachmentsByResponse.set(r.id, await downloadAttachmentRows(imageRows));
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

async function fetchSingleResponse(responseId: number, options: PdfOptions): Promise<PdfSiteData> {
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
    const rows = await getAttachmentsByResponseId(responseId);
    const imageRows = rows
      .filter(row => row.content_type && ALLOWED_IMAGE_TYPES.includes(row.content_type))
      .slice(0, options.maxImagesPerInspection);
    if (imageRows.length > 0) {
      attachmentsByResponse.set(responseId, await downloadAttachmentRows(imageRows));
    }
  }

  return { siteName, county, responses, attachmentsByResponse };
}

export async function fetchReportData(request: PdfRequest): Promise<PdfReportData> {
  const options = request.options;
  let sites: PdfSiteData[];

  switch (request.mode) {
    case 'single': {
      sites = [await fetchSingleResponse(request.responseId, options)];
      break;
    }
    case 'site': {
      sites = [await fetchSiteData(request.siteName, options)];
      break;
    }
    case 'multi-site': {
      sites = await fetchMultiSiteData(request.siteNames, options);
      break;
    }
  }

  return {
    sites,
    generatedAt: new Date().toISOString(),
    options,
  };
}