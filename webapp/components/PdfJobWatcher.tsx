'use client';
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function PdfJobWatcher() {
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('pdf-jobs-watcher')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'S26_pdf_jobs', filter: `created_by=eq.${user.id}` },
          async (payload) => {
            const job = payload.new as { id: string; status: string };
            if (job.status !== 'complete') return;

            const res = await fetch(`/api/pdf/status/${job.id}`);
            const { downloadUrl } = await res.json();
            if (!downloadUrl) return;

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        )
        .subscribe();
    }

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}