import { createServerSupabase } from '@/utils/supabase/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Zip, ZipPassThrough } from 'fflate';
import { s3Client } from '@/lib/s3/client';

export const MAX_EXPORT_BYTES = 500 * 1024 * 1024;
const GPX_BUCKET = 'gpx-tracks';
const PAGE_SIZE = 1000;
const MAX_NAMES_IN_ERROR = 10;

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

// An error whose message an Admin can read on the page. Any other error is logged and shown as a general message.
class ExportError extends Error {}

type ExportEntry = { source: 's3' | 'gpx'; key: string; zipPath: string };
type ServerSupabase = ReturnType<typeof createServerSupabase>;

// The key names the file in the zip. A key comes from a table that a user can write, so it is not trusted.
// Both "/" and "\\" separate folders (Windows unpacks "\\" as a separator), segments that are only dots are
// dropped, and any other character outside [A-Za-z0-9._-] becomes "_". A key can then never write outside
// its folder when the zip is unpacked.
export function zipPathFor(folder: string, key: string): string {
  const segments = key
    .split(/[\\/]/)
    .filter((segment) => segment !== '' && !/^\.+$/.test(segment))
    .map((segment) => segment.replace(/[^A-Za-z0-9._-]/g, '_'));
  return [folder, ...segments].join('/');
}

// Two different keys can give one name after the clean-up. Each file keeps its own entry: the later
// one gets "_2", "_3" and so on before its extension.
function withUniquePaths(entries: ExportEntry[]): ExportEntry[] {
  const used = new Set<string>();
  return entries.map((entry) => {
    let zipPath = entry.zipPath;
    for (let copy = 2; used.has(zipPath); copy += 1) {
      const dot = entry.zipPath.lastIndexOf('.');
      const hasExtension = dot > entry.zipPath.lastIndexOf('/') + 1;
      zipPath = hasExtension
        ? `${entry.zipPath.slice(0, dot)}_${copy}${entry.zipPath.slice(dot)}`
        : `${entry.zipPath}_${copy}`;
    }
    used.add(zipPath);
    return { ...entry, zipPath };
  });
}

// PostgREST returns at most 1000 rows for one request, so read the table page by page.
async function readColumn(supabase: ServerSupabase, table: string, column: string, onlyComplete = false): Promise<string[]> {
  const values: string[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from(table).select(column).order(column);
    if (onlyComplete) query = query.eq('status', 'complete').not(column, 'is', null);
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    const rows = (data ?? []) as unknown as Array<Record<string, string | null>>;
    for (const row of rows) if (row[column]) values.push(row[column] as string);
    if (rows.length < PAGE_SIZE) return values;
  }
}

export async function collectExportEntries(supabase: ServerSupabase): Promise<ExportEntry[]> {
  const [inspectionImages, homepageImages, gpxFiles, pdfFiles] = await Promise.all([
    readColumn(supabase, 'attachments', 'storage_key'),
    readColumn(supabase, 'homepage_image_uploads', 'storage_key'),
    readColumn(supabase, 'gpx_tracks', 'storage_path'),
    readColumn(supabase, 'S26_pdf_jobs', 'storage_path', true),
  ]);
  const entries: ExportEntry[] = [
    ...inspectionImages.map((key) => ({ source: 's3' as const, key, zipPath: zipPathFor('images/inspections', key) })),
    ...homepageImages.map((key) => ({ source: 's3' as const, key, zipPath: zipPathFor('images/homepage', key) })),
    ...gpxFiles.map((key) => ({ source: 'gpx' as const, key, zipPath: zipPathFor('gpx', key) })),
    ...pdfFiles.map((key) => ({ source: 's3' as const, key, zipPath: zipPathFor('pdfs', key) })),
  ];
  // Two rows can name one object. The zip holds one copy.
  const distinct = [...new Map(entries.map((entry) => [`${entry.source}:${entry.zipPath}:${entry.key}`, entry])).values()];
  return withUniquePaths(distinct);
}

async function readFile(entry: ExportEntry, supabase: ServerSupabase, s3: S3Client): Promise<Uint8Array> {
  if (entry.source === 'gpx') {
    const { data, error } = await supabase.storage.from(GPX_BUCKET).download(entry.key);
    if (error || !data) throw new Error('missing');
    return new Uint8Array(await data.arrayBuffer());
  }
  const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: entry.key }));
  if (!response.Body) throw new Error('missing');
  return response.Body.transformToByteArray();
}

// ponytail: one file at a time and the whole zip in memory. The 500 MB cap keeps that safe;
// switch to a multipart upload (@aws-sdk/lib-storage) if the cap must go up.
export async function buildExportZip(
  entries: ExportEntry[],
  supabase: ServerSupabase,
  s3: S3Client,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let finished: (() => void) | undefined;
  let failed: ((error: Error) => void) | undefined;
  const done = new Promise<void>((resolve, reject) => { finished = resolve; failed = reject; });
  const zip = new Zip((error, chunk, final) => {
    if (error) { failed?.(error); return; }
    chunks.push(chunk);
    if (final) finished?.();
  });

  const missing: string[] = [];
  let totalBytes = 0;
  for (const entry of entries) {
    let bytes: Uint8Array;
    try {
      bytes = await readFile(entry, supabase, s3);
    } catch {
      missing.push(entry.zipPath);
      continue;
    }
    totalBytes += bytes.length;
    if (totalBytes > MAX_EXPORT_BYTES) {
      throw new ExportError(`The files are larger than ${MAX_EXPORT_BYTES / (1024 * 1024)} MB, which is the most that one export can hold.`);
    }
    // Images and PDFs are already compressed, so the files are stored as they are.
    const file = new ZipPassThrough(entry.zipPath);
    zip.add(file);
    file.push(bytes, true);
  }

  if (missing.length > 0) {
    const names = missing.slice(0, MAX_NAMES_IN_ERROR).join(', ');
    const more = missing.length > MAX_NAMES_IN_ERROR ? ` and ${missing.length - MAX_NAMES_IN_ERROR} more` : '';
    throw new ExportError(`These files could not be read: ${names}${more}.`);
  }

  zip.end();
  await done;
  return Buffer.concat(chunks);
}

export async function processExportJob(jobId: string) {
  const supabase = createServerSupabase();
  const { data: job, error: jobError } = await supabase
    .from('export_jobs')
    .select('created_by')
    .eq('id', jobId)
    .single();
  if (jobError || !job) throw new Error('Export job not found');

  try {
    const { error: processingError } = await supabase.from('export_jobs').update({ status: 'processing' }).eq('id', jobId);
    if (processingError) throw processingError;

    const entries = await collectExportEntries(supabase);
    const zipBytes = await buildExportZip(entries, supabase, s3Client);

    const dateStamp = new Date().toISOString().split('T')[0];
    const key = `exports/${job.created_by}/${jobId}/SAPAA_All_Files_${dateStamp}.zip`;
    await s3Client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: zipBytes, ContentType: 'application/zip' }));

    const { error: completionError } = await supabase
      .from('export_jobs')
      .update({ status: 'complete', storage_path: key, file_count: entries.length, finished_at: new Date().toISOString() })
      .eq('id', jobId);
    if (completionError) throw completionError;
  } catch (error) {
    // Only a message written for an Admin goes to the row. Anything else could name the bucket or a table.
    const message = error instanceof ExportError ? error.message : 'The export failed. Try again.';
    if (!(error instanceof ExportError)) console.error('Export job failed', error);
    const { error: failureError } = await supabase
      .from('export_jobs')
      .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
      .eq('id', jobId);
    if (failureError) throw failureError;
  }
}
