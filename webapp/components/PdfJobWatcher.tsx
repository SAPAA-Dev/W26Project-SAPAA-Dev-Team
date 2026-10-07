'use client';
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const POLL_INTERVAL_MS = 3000;

/**
 * Realtime is not used because the local service drops postgres_changes
 * events (supabase/realtime#2289).
 */
export default function PdfJobWatcher() {
  useEffect(() => {
    const supabase = createClient();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mountedAtMs = Date.now();
    const seenPending = new Set<string>();
    const handled = new Set<string>();

    async function download(jobId: string) {
      const res = await fetch(`/api/pdf/status/${jobId}`);
      const { downloadUrl } = await res.json();
      if (!downloadUrl) return;
      handled.add(jobId);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    async function poll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: jobs } = await supabase
        .from('S26_pdf_jobs')
        .select('id, status, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!jobs) return;

      for (const job of jobs) {
        if (job.status === 'pending' || job.status === 'processing') {
          seenPending.add(job.id);
        }
        if (
          job.status === 'complete' &&
          !handled.has(job.id) &&
          (seenPending.has(job.id) || new Date(job.created_at).getTime() >= mountedAtMs)
        ) {
          await download(job.id);
        }
      }
    }

    async function loop() {
      if (stopped) return;
      try {
        await poll();
      } catch {
      }
      if (!stopped) timer = setTimeout(loop, POLL_INTERVAL_MS);
    }

    loop();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
