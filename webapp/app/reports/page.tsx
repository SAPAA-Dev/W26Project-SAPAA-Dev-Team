'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Archive, ClipboardList, Search } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserNavBar from '@/components/HeaderDropdown';
import { getAllSiteReports, SiteReportSummary } from '@/utils/supabase/queries';

function formatReportDate(report: SiteReportSummary): string {
  const value = report.inspectionDate ?? report.createdAt;
  if (!value) return 'Date not recorded';
  // inspection_date is a date column, so PostgREST sends "2026-09-12". Without timeZone: 'UTC'
  // the browser reads that as midnight UTC and prints the day before in Alberta.
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}

function SiteName({ report }: { report: SiteReportSummary }) {
  // Archived sites are hidden from the app, so their reports are listed but not linked.
  if (report.siteId && !report.siteArchived && report.siteName) {
    return (
      <Link
        href={`/detail/${encodeURIComponent(report.siteName)}?report=${report.id}`}
        className="hover:underline"
        data-testid={`report-site-link-${report.id}`}
      >
        {report.siteName}
      </Link>
    );
  }

  return (
    <span data-testid={`report-site-plain-${report.id}`}>
      {report.siteName ?? 'Unknown site'}
      {report.siteArchived && (
        <span
          data-testid={`report-site-archived-${report.id}`}
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
        >
          <Archive className="h-3 w-3" />
          Archived
        </span>
      )}
    </span>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SiteReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await getAllSiteReports());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inspection reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) =>
      (report.siteName?.toLowerCase().includes(query)) ||
      (report.inspectionNo?.toLowerCase().includes(query)) ||
      (report.submitterName?.toLowerCase().includes(query))
    );
  }, [reports, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading inspection reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#B91C1C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Unable to Load Reports</h2>
          <p className="text-[#7A8075] mb-6">{error}</p>
          <button
            onClick={() => void load()}
            className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/sapaa-icon-white.png"
                alt="SAPAA"
                width={140}
                height={140}
                priority
                className="h-16 w-auto flex-shrink-0 opacity-100 mt-1"
              />
              <div>
                <h1 className="text-3xl font-bold mt-3">Inspection Reports</h1>
                <p className="text-[#E4EBE4] text-base mt-0.5">
                  Every site inspection report, newest first
                </p>
              </div>
            </div>

            <UserNavBar />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 mt-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8075]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by site, report number, or steward"
                data-testid="reports-search"
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <p className="text-sm text-[#7A8075]">
              {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
            </p>
          </div>

          {filteredReports.length === 0 ? (
            <div className="mt-6 bg-white rounded-2xl shadow-sm p-10 text-center">
              <ClipboardList className="w-10 h-10 text-[#7A8075] mx-auto mb-4" />
              <p className="text-[#5B655D]">
                {search.trim() ? 'No reports match your search.' : 'No inspection reports recorded yet.'}
              </p>
            </div>
          ) : (
            <ul className="mt-6 bg-white rounded-2xl shadow-sm divide-y divide-[#E4EBE4]" data-testid="reports-list">
              {filteredReports.map((report) => (
                <li key={report.id} data-testid={`report-row-${report.id}`} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <p className="font-semibold text-[#254431]">
                      <SiteName report={report} />
                    </p>
                    <p className="mt-1 text-sm text-[#5B655D]">
                      {report.inspectionNo ?? `Report #${report.id}`} · {formatReportDate(report)}
                    </p>
                  </div>
                  <p className="text-sm text-[#5B655D]" data-testid={`report-submitter-${report.id}`}>
                    {report.submitterId && report.submitterName ? (
                      <Link href={`/people/${report.submitterId}`} className="font-semibold text-[#356B43] hover:underline">
                        {report.submitterName}
                      </Link>
                    ) : (
                      'Unknown steward'
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
