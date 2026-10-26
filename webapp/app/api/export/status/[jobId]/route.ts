import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { s3Client } from '@/lib/s3/client';

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // The service role reads the row, so the Admin-or-creator check below is what protects the link.
  const { data: job, error } = await createServerSupabase()
    .from('export_jobs')
    .select('status, storage_path, error, created_by')
    .eq('id', jobId)
    .maybeSingle();
  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const isAdmin = user.app_metadata?.role === 'admin' && user.app_metadata?.authenticated === true;
  if (!isAdmin && job.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (job.status === 'complete' && job.storage_path) {
    const downloadUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: job.storage_path }),
      { expiresIn: 3600 },
    );
    return NextResponse.json({ status: job.status, downloadUrl });
  }

  return NextResponse.json({ status: job.status, error: job.error ?? null });
}
