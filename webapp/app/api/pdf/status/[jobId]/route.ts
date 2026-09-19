import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

function getS3Client() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: job, error } = await supabase
    .from('S26_pdf_jobs')
    .select('status, storage_path, error')
    .eq('id', jobId)
    .single();

  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  if (job.status === 'complete' && job.storage_path) {
    const s3 = getS3Client();
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: job.storage_path }),
      { expiresIn: 3600 }
    );
    return NextResponse.json({ status: job.status, downloadUrl });
  }

  return NextResponse.json({ status: job.status, error: job.error ?? null });
}