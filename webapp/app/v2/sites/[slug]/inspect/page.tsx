'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function InspectionPage() {
  const { slug } = useParams<{ slug: string }>();
  let siteName: string;
  try {
    siteName = decodeURIComponent(slug);
  } catch {
    siteName = slug;
  }
  const href = `/detail/${encodeURIComponent(siteName)}/new-report`;
  useEffect(() => {
    // A full navigation also clears cached report data before the main form takes over.
    window.location.replace(href);
  }, [href]);
  return <main className="p-6"><a href={href}>Open inspection form</a></main>;
}
