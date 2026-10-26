import { NextResponse, after } from 'next/server';
import { createClient, createServerSupabase } from '@/utils/supabase/server';
import { processExportJob } from '@/lib/export/processExportJob';

// A job that crashed can stay "processing" for ever, so only a recent job blocks a new one.
const RUNNING_JOB_WINDOW_MS = 30 * 60 * 1000;

export async function POST() {
  const sessionClient = await createClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // The role comes from the signed-in session. The export reads every stored file with the service role.
  const isAdmin = user.app_metadata?.role === 'admin' && user.app_metadata?.authenticated === true;
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });

  const admin = createServerSupabase();
  const since = new Date(Date.now() - RUNNING_JOB_WINDOW_MS).toISOString();
  const { data: running, error: runningError } = await admin
    .from('export_jobs')
    .select('id')
    .eq('created_by', user.id)
    .in('status', ['pending', 'processing'])
    .gte('created_at', since)
    .limit(1);
  if (runningError) return NextResponse.json({ error: 'Failed to start the export' }, { status: 500 });
  if (running && running.length > 0) {
    return NextResponse.json({ error: 'An export is already running.', jobId: running[0].id }, { status: 409 });
  }

  const { data: job, error: insertError } = await admin
    .from('export_jobs')
    .insert({ created_by: user.id, status: 'pending' })
    .select('id')
    .single();
  if (insertError || !job) return NextResponse.json({ error: 'Failed to start the export' }, { status: 500 });

  after(() => {
    processExportJob(job.id).catch((error) => {
      console.error('Export job error:', error);
    });
  });

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
