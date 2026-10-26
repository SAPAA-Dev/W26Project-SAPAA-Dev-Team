import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: job, error } = await supabase
    .from('S26_pdf_jobs')
    .select('status, storage_path, error, created_by')
    .eq('id', jobId)
    .single();

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // RLS already limits reads to the owner's jobs; this check also holds if RLS changes.
  if (job.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (job.status === 'complete' && job.storage_path) {
    const downloadUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: job.storage_path }),
      { expiresIn: 3600 }
    );
    return NextResponse.json({ status: job.status, downloadUrl });
  }

  return NextResponse.json({ status: job.status, error: job.error ?? null });
}