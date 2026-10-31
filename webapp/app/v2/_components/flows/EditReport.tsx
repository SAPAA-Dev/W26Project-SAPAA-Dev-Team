'use client';

import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  report: { id: number; date: string | null; siteName: string };
  title: string;
  onSaved: () => void;
}

export function EditReportSheet({ open, report }: Props) {
  const href = `/detail/${encodeURIComponent(report.siteName)}/edit-report/${report.id}`;
  useEffect(() => {
    if (open) window.location.assign(href);
  }, [open, href]);
  return open ? <a href={href}>Open report editor</a> : null;
}
