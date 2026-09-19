'use client';
import React, { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface PdfJobRow {
  id: string;
  mode: string;
  status: string;
  created_at: string;
  request_payload: { siteName?: string; siteNames?: string[]; responseId?: number };
}

export default function PdfExportsDropdown({ onClose }: { onClose: () => void }) {
  const [jobs, setJobs] = useState<PdfJobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('S26_pdf_jobs')
        .select('id, mode, status, created_at, request_payload')
        .order('created_at', { ascending: false })
        .limit(20);
      setJobs(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const download = async (jobId: string) => {
    const res = await fetch(`/api/pdf/status/${jobId}`);
    const { downloadUrl } = await res.json();
    if (downloadUrl) window.open(downloadUrl, '_blank');
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border-2 border-[#E4EBE4] overflow-hidden z-20 max-h-96 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#E4EBE4] flex items-center justify-between sticky top-0 bg-white">
        <h3 className="text-sm font-bold text-[#254431] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#356B43]" />
          Recent Exports
        </h3>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-[#7A8075]" />
        </button>
      </div>
      {loading ? (
        <p className="p-4 text-sm text-[#7A8075]">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="p-4 text-sm text-[#7A8075]">No exports yet.</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="px-4 py-3 border-b border-[#F0EDE8] flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#254431] capitalize">
                {job.mode === 'site' && job.request_payload?.siteName
                  ? job.request_payload.siteName
                  : `${job.mode} export`}
              </p>
              <p className="text-xs text-[#7A8075]">{new Date(job.created_at).toLocaleString()}</p>
            </div>
            {job.status === 'complete' && (
              <button onClick={() => download(job.id)} className="text-xs font-semibold text-[#356B43] underline">
                Download
              </button>
            )}
            {job.status === 'failed' && <span className="text-xs text-[#B91C1C]">Failed</span>}
            {(job.status === 'pending' || job.status === 'processing') && (
              <span className="text-xs text-[#7A8075]">Processing…</span>
            )}
          </div>
        ))
      )}
    </div>
  );
}