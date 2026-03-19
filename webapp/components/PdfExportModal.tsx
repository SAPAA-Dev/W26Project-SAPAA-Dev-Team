'use client';

import React, { useState, useMemo, useEffect} from 'react';
import {
  X,
  Download,
  Loader2,
  FileText,
  Calendar,
  Image as ImageIcon,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { FormResponse } from '@/utils/supabase/queries';

interface PdfExportModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'single' | 'site' | 'multi-site';
  siteName?: string;
  siteNames?: string[];
  responseId?: number;
  inspections?: FormResponse[];
}

interface PdfModalOptions {
  dateFrom: string;
  dateTo: string;
  includeImages: boolean;
  maxImagesPerInspection: number;
  includeEmptyAnswers: boolean;
  includeCoverPage: boolean;
  includeNaturalnessSummary: boolean;
  selectedSections: string[] | 'all';
  sortOrder: 'newest' | 'oldest';
  pageSize: 'LETTER' | 'A4';
  selectedResponseIds: number[];
}

export default function PdfExportModal({
  open,
  onClose,
  mode,
  siteName,
  siteNames,
  responseId,
  inspections = [],
}: PdfExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(true);

  const [options, setOptions] = useState<PdfModalOptions>({
    dateFrom: '',
    dateTo: '',
    includeImages: false,
    maxImagesPerInspection: 5,
    includeEmptyAnswers: false,
    includeCoverPage: true,
    includeNaturalnessSummary: true,
    selectedSections: 'all',
    sortOrder: 'newest',
    pageSize: 'LETTER',
    selectedResponseIds: [],
  });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const today = new Date().toISOString().split('T')[0];

  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    inspections.forEach((r) =>
      r.answers.forEach((a) => {
        if (a.section_title) sections.add(a.section_title);
      })
    );
    return Array.from(sections);
  }, [inspections]);

  const previewCount = useMemo(() => {
    let filtered = [...inspections];
    if (options.selectedResponseIds.length > 0) {
      filtered = filtered.filter((r) => options.selectedResponseIds.includes(r.id));
    }
    if (options.dateFrom) {
      const from = new Date(options.dateFrom);
      filtered = filtered.filter((r) => r.created_at && new Date(r.created_at) >= from);
    }
    if (options.dateTo) {
      const to = new Date(options.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => r.created_at && new Date(r.created_at) <= to);
    }
    return filtered.length;
  }, [inspections, options.selectedResponseIds, options.dateFrom, options.dateTo]);

  // Count matching inspections ignoring manual selection 
  // used to distinguish "no results from date filter" vs "user deselected everything"
  const dateFilteredCount = useMemo(() => {
    let filtered = [...inspections];
    if (options.dateFrom) {
      const from = new Date(options.dateFrom);
      filtered = filtered.filter((r) => r.created_at && new Date(r.created_at) >= from);
    }
    if (options.dateTo) {
      const to = new Date(options.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => r.created_at && new Date(r.created_at) <= to);
    }
    return filtered.length;
  }, [inspections, options.dateFrom, options.dateTo]);

  const toggleResponseId = (id: number) => {
    setOptions((prev) => {
      if (prev.selectedResponseIds.length === 0) {
        const allExcept = inspections.map((r) => r.id).filter((x) => x !== id);
        return { ...prev, selectedResponseIds: allExcept };
      }
      const ids = prev.selectedResponseIds.includes(id)
        ? prev.selectedResponseIds.filter((x) => x !== id)
        : [...prev.selectedResponseIds, id];
      const allIds = inspections.map((r) => r.id);
      const isAllSelected = allIds.every((x) => ids.includes(x));
      return { ...prev, selectedResponseIds: isAllSelected ? [] : ids };
    });
  };

  const selectAllResponses = () => {
    setOptions((prev) => ({ ...prev, selectedResponseIds: [] }));
  };

  const toggleSection = (section: string) => {
    setOptions((prev) => {
      if (prev.selectedSections === 'all') {
        return { ...prev, selectedSections: availableSections.filter((s) => s !== section) };
      }
      const sections = prev.selectedSections as string[];
      if (sections.includes(section)) {
        const next = sections.filter((s) => s !== section);
        return { ...prev, selectedSections: next };
      }
      const next = [...sections, section];
      return { ...prev, selectedSections: next.length === availableSections.length ? 'all' : next };
    });
  };

  const isSectionSelected = (section: string) => {
    if (options.selectedSections === 'all') return true;
    return (options.selectedSections as string[]).includes(section);
  };

  const noSectionsSelected =
    options.selectedSections !== 'all' &&
    (options.selectedSections as string[]).length === 0;

  // Invalid only when BOTH dates are set and from > to
  const dateRangeInvalid = !!(
    options.dateFrom &&
    options.dateTo &&
    new Date(options.dateFrom) > new Date(options.dateTo)
  );

  const dateRangeNoResults =
    !dateRangeInvalid &&
    (options.dateFrom || options.dateTo) &&
    dateFilteredCount === 0;

  const noInspectionsSelected =
    options.selectedResponseIds.length > 0 &&
    previewCount === 0 &&
    dateFilteredCount > 0;

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      let body: any;
      const apiOptions = {
        dateFrom: options.dateFrom || undefined,
        dateTo: options.dateTo || undefined,
        includeImages: options.includeImages,
        maxImagesPerInspection: options.maxImagesPerInspection,
        includeEmptyAnswers: options.includeEmptyAnswers,
        includeCoverPage: options.includeCoverPage,
        includeNaturalnessSummary: options.includeNaturalnessSummary,
        selectedSections: options.selectedSections,
        sortOrder: options.sortOrder,
        pageSize: options.pageSize,
        selectedResponseIds: options.selectedResponseIds.length > 0 ? options.selectedResponseIds : undefined,
      };

      if (mode === 'single' && responseId) {
        body = { mode: 'single', responseId, options: apiOptions };
      } else if (mode === 'multi-site' && siteNames) {
        body = { mode: 'multi-site', siteNames, options: apiOptions };
      } else if (mode === 'site' && siteName) {
        body = { mode: 'site', siteName, options: apiOptions };
      } else {
        throw new Error('Invalid export configuration');
      }

      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate PDF (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="(.+?)"/);
      a.download = match?.[1] ?? 'SAPAA_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const modeLabel =
    mode === 'single'
      ? 'Single Inspection'
      : mode === 'site'
        ? `${siteName}`
        : `${siteNames?.length ?? 0} Sites`;

  return (
    <div
      className="fixed inset-0 bg-[#254431]/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export PDF Report</h2>
              <p className="text-sm text-[#86A98A]">{modeLabel}</p>
            </div>
          </div>
          <button
            onClick={() => !loading && onClose()}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">

          {/* Quick Options */}
          <div className="bg-[#F7F2EA] rounded-2xl border-2 border-[#E4EBE4]">
            <button
              onClick={() => setShowQuickOptions(!showQuickOptions)}
              className="w-full flex items-center justify-between px-5 py-5 hover:bg-[#E4EBE4]/40 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#356B43]" />
                <h3 className="text-sm font-bold text-[#254431] uppercase tracking-wide">Quick Options</h3>
              </div>
              {showQuickOptions ? (
                <ChevronUp className="w-4 h-4 text-[#7A8075]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#7A8075]" />
              )}
            </button>

            {showQuickOptions && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">

                  {/* Score Summary */}
                  <button
                    onClick={() => setOptions((p) => ({ ...p, includeNaturalnessSummary: !p.includeNaturalnessSummary }))}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      options.includeNaturalnessSummary
                        ? 'bg-[#F7F2EA] border-[#356B43] shadow-sm'
                        : 'bg-[#F7F2EA] border-[#E4EBE4] hover:border-[#86A98A]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${options.includeNaturalnessSummary ? 'bg-[#356B43]' : 'bg-[#E4EBE4]'}`}>
                      <span className={`text-sm font-bold ${options.includeNaturalnessSummary ? 'text-white' : 'text-[#7A8075]'}`}>N</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#254431]">Score Summary</p>
                      <p className="text-xs text-[#7A8075]">Naturalness table</p>
                    </div>
                  </button>

                  {/* Cover Page */}
                  <button
                    onClick={() => setOptions((p) => ({ ...p, includeCoverPage: !p.includeCoverPage }))}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      options.includeCoverPage
                        ? 'bg-[#F7F2EA] border-[#356B43] shadow-sm'
                        : 'bg-[#F7F2EA] border-[#E4EBE4] hover:border-[#86A98A]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${options.includeCoverPage ? 'bg-[#356B43]' : 'bg-[#E4EBE4]'}`}>
                      <Sparkles className={`w-4 h-4 ${options.includeCoverPage ? 'text-white' : 'text-[#7A8075]'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#254431]">Cover Page</p>
                      <p className="text-xs text-[#7A8075]">Title page with summary</p>
                    </div>
                  </button>

                  {/* Include Images */}
                  <button
                    onClick={() => setOptions((p) => ({ ...p, includeImages: !p.includeImages }))}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      options.includeImages
                        ? 'bg-[#F7F2EA] border-[#356B43] shadow-sm'
                        : 'bg-[#F7F2EA] border-[#E4EBE4] hover:border-[#86A98A]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${options.includeImages ? 'bg-[#356B43]' : 'bg-[#E4EBE4]'}`}>
                      <ImageIcon className={`w-4 h-4 ${options.includeImages ? 'text-white' : 'text-[#7A8075]'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#254431]">Include Images</p>
                      <p className="text-xs text-[#7A8075]">{options.includeImages ? `Max ${options.maxImagesPerInspection}/inspection` : 'Off'}</p>
                    </div>
                  </button>

                  {/* Empty Answers */}
                  <button
                    onClick={() => setOptions((p) => ({ ...p, includeEmptyAnswers: !p.includeEmptyAnswers }))}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      options.includeEmptyAnswers
                        ? 'bg-[#F7F2EA] border-[#356B43] shadow-sm'
                        : 'bg-[#F7F2EA] border-[#E4EBE4] hover:border-[#86A98A]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${options.includeEmptyAnswers ? 'bg-[#356B43]' : 'bg-[#E4EBE4]'}`}>
                      <span className={`text-sm font-bold ${options.includeEmptyAnswers ? 'text-white' : 'text-[#7A8075]'}`}>?</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#254431]">Empty Answers</p>
                      <p className="text-xs text-[#7A8075]">{options.includeEmptyAnswers ? 'Show all fields' : 'Only answered'}</p>
                    </div>
                  </button>

                </div>

                {/* Max Images Slider - inline below grid when images enabled */}
                {options.includeImages && (
                  <div className="px-1">
                    <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide mb-2 block">
                      Max images per inspection: {options.maxImagesPerInspection}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={options.maxImagesPerInspection}
                      onChange={(e) => setOptions((p) => ({ ...p, maxImagesPerInspection: parseInt(e.target.value) }))}
                      className="w-full accent-[#356B43]"
                    />
                    <div className="flex justify-between text-xs text-[#7A8075]">
                      <span>1</span>
                      <span>20</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date Range */}
          {mode !== 'single' && (
            <div className="bg-[#F7F2EA] rounded-2xl p-5 border-2 border-[#E4EBE4]">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#356B43]" />
                <h3 className="text-sm font-bold text-[#254431] uppercase tracking-wide">Date Range</h3>
              </div>
              
              {dateRangeInvalid && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FEE2E2] rounded-xl">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] flex-shrink-0" />
                  <p className="text-xs text-[#B91C1C]">Start date cannot be after end date.</p>
                </div>
              )}

              {/* Error: valid range but no inspections fall in it
                  Only shown when it's the date filter causing zero results,
                  not manual deselection by the user */}
              {dateRangeNoResults && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FEE2E2] rounded-xl">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] flex-shrink-0" />
                  <p className="text-xs text-[#B91C1C]">No inspections match this date range.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide mb-1 block">From</label>
                  <input
                    type="date"
                    max={today}
                    value={options.dateFrom}
                    onChange={(e) => setOptions((p) => ({ ...p, dateFrom: e.target.value }))}
                    className="w-full border-2 border-[#E4EBE4] rounded-xl px-3 py-2.5 text-sm text-[#1E2520] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide mb-1 block">To</label>
                  <input
                    type="date"
                    max={today}
                    value={options.dateTo}
                    onChange={(e) => setOptions((p) => ({ ...p, dateTo: e.target.value }))}
                    className="w-full border-2 border-[#E4EBE4] rounded-xl px-3 py-2.5 text-sm text-[#1E2520] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] bg-white"
                  />
                </div>
              </div>
              {(options.dateFrom || options.dateTo) && (
                <button
                  onClick={() => setOptions((p) => ({ ...p, dateFrom: '', dateTo: '' }))}
                  className="mt-2 text-xs text-[#356B43] hover:text-[#254431] font-medium underline"
                >
                  Clear dates
                </button>
              )}
            </div>
          )}

          {/* Inspection Selection */}
          {mode === 'site' && inspections.length > 0 && (
            <div className="bg-[#F7F2EA] rounded-2xl p-5 border-2 border-[#E4EBE4]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#356B43]" />
                  <h3 className="text-sm font-bold text-[#254431] uppercase tracking-wide">Select Inspections</h3>
                </div>
                <button
                  onClick={selectAllResponses}
                  className="text-xs font-semibold text-[#356B43] hover:text-[#254431] transition-colors"
                >
                  {options.selectedResponseIds.length === 0 ? 'All selected' : 'Select all'}
                </button>
              </div>

              {/* Error: user explicitly deselected all inspections
                  but the date range itself still has results */}
              {noInspectionsSelected && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FEE2E2] rounded-xl">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] flex-shrink-0" />
                  <p className="text-xs text-[#B91C1C]">No inspections selected. Please select at least one.</p>
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {inspections.map((r) => {
                  const withinDateRange = (() => {
                    if (!options.dateFrom && !options.dateTo) return true;
                    const date = r.created_at ? new Date(r.created_at) : null;
                    if (!date) return false;
                    if (options.dateFrom && date < new Date(options.dateFrom)) return false;
                    if (options.dateTo) {
                      const to = new Date(options.dateTo);
                      to.setHours(23, 59, 59, 999);
                      if (date > to) return false;
                    }
                    return true;
                  })();

                  const isSelected =
                    withinDateRange &&
                    (options.selectedResponseIds.length === 0 || options.selectedResponseIds.includes(r.id));

                  const dateStr = r.created_at
                    ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'No date';

                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleResponseId(r.id)}
                      disabled={!withinDateRange}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        !withinDateRange
                          ? 'opacity-40 cursor-not-allowed bg-white/30 border-2 border-transparent'
                          : isSelected
                            ? 'bg-white border-2 border-[#356B43] shadow-sm'
                            : 'bg-white/50 border-2 border-transparent hover:border-[#E4EBE4]'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#356B43] flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#7A8075] flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#254431]">{dateStr}</p>
                        <p className="text-xs text-[#7A8075] truncate">
                          {r.steward && `Steward: ${r.steward}`}
                          {r.steward && r.naturalness_score && ' · '}
                          {r.naturalness_score && `Score: ${r.naturalness_score}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="bg-[#F7F2EA] rounded-2xl border-2 border-[#E4EBE4]">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-5 py-5 hover:bg-[#E4EBE4]/40 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#356B43]" />
                <h3 className="text-sm font-bold text-[#254431] uppercase tracking-wide">Advanced Options</h3>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-[#7A8075]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#7A8075]" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4">

                {/* Sort Order */}
                <div>
                  <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide mb-2 block">Sort Order</label>
                  <div className="flex gap-2">
                    {(['newest', 'oldest'] as const).map((order) => (
                      <button
                        key={order}
                        onClick={() => setOptions((p) => ({ ...p, sortOrder: order }))}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                          options.sortOrder === order
                            ? 'bg-[#356B43] text-white border-[#356B43]'
                            : 'bg-white text-[#7A8075] border-[#E4EBE4] hover:border-[#86A98A]'
                        }`}
                      >
                        {order === 'newest' ? 'Newest First' : 'Oldest First'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Size */}
                <div>
                  <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide mb-2 block">Page Size</label>
                  <div className="flex gap-2">
                    {(['LETTER', 'A4'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setOptions((p) => ({ ...p, pageSize: size }))}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                          options.pageSize === size
                            ? 'bg-[#356B43] text-white border-[#356B43]'
                            : 'bg-white text-[#7A8075] border-[#E4EBE4] hover:border-[#86A98A]'
                        }`}
                      >
                        {size === 'LETTER' ? 'US Letter' : 'A4'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Filter */}
                {availableSections.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-[#7A8075] uppercase tracking-wide">Sections</label>
                      <button
                        onClick={() => setOptions((p) => ({ ...p, selectedSections: 'all' }))}
                        className="text-xs font-semibold text-[#356B43] hover:text-[#254431] transition-colors"
                      >
                        {options.selectedSections === 'all' ? 'All selected' : 'Select all'}
                      </button>
                    </div>

                    {/* Error: all sections deselected */}
                    {noSectionsSelected && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FEE2E2] rounded-xl">
                        <AlertCircle className="w-4 h-4 text-[#B91C1C] flex-shrink-0" />
                        <p className="text-xs text-[#B91C1C]">At least one section must be selected.</p>
                      </div>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {availableSections.map((section) => (
                        <button
                          key={section}
                          onClick={() => toggleSection(section)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                            isSectionSelected(section)
                              ? 'bg-white border-2 border-[#356B43] shadow-sm'
                              : 'bg-white/50 border-2 border-transparent hover:border-[#E4EBE4]'
                          }`}
                        >
                          {isSectionSelected(section) ? (
                            <CheckSquare className="w-4 h-4 text-[#356B43] flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#7A8075] flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium text-[#254431]">{section}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#E4EBE4] px-6 py-4 flex-shrink-0">
          {error && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FEE2E2] rounded-xl">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] flex-shrink-0" />
              <p className="text-sm text-[#B91C1C]">{error}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#7A8075]">
              {mode === 'single'
                ? '1 inspection'
                : mode === 'multi-site'
                  ? `${siteNames?.length ?? 0} sites`
                  : `${previewCount} inspection${previewCount !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border-2 border-[#E4EBE4] text-[#7A8075] hover:bg-[#F7F2EA] font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={loading || (mode !== 'single' && previewCount === 0) || dateRangeInvalid || noSectionsSelected}
                className="px-6 py-2.5 bg-gradient-to-r from-[#356B43] to-[#254431] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}