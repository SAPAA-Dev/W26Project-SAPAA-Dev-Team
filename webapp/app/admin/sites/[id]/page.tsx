"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getFormResponsesBySite,
  getSiteByName,
  SiteSummary,
  FormResponse,
  FormAnswer,
  deactivateFormResponse,
} from "@/utils/supabase/queries";
import { daysSince } from "@/app/sites/page";
import Image from 'next/image';
import {
  MoreVertical,
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ClipboardList,
  Award,
  AlertCircle,
  Settings,
  X,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Search,
  Download,
  Edit3,
} from "lucide-react";

type ViewMode = 'by-date' | 'by-question';

interface QuestionComparison {
  questionId: string;
  questionText: string;
  section_id: number | null;
  section_title: string | null;
  answers: Array<{
    inspectionId: number;
    date: string;
    displayDate: string;
    answer: string;
  }>;
}

function groupAnswersBySection(answers: FormAnswer[]) {
  const sections: Array<{
    sectionId: number | null;
    sectionTitle: string | null;
    answers: FormAnswer[];
  }> = [];
  const seen = new Map<number | string, number>();

  for (const answer of answers) {
    const key = answer.section_id ?? 'null';
    if (!seen.has(key)) {
      seen.set(key, sections.length);
      sections.push({ sectionId: answer.section_id, sectionTitle: answer.section_title, answers: [] });
    }
    sections[seen.get(key)!].answers.push(answer);
  }

  return sections;
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="h-px flex-1 bg-[#E4EBE4]" />
      <span className="text-xs font-bold text-[#356B43] uppercase tracking-widest px-2">
        {title}
      </span>
      <div className="h-px flex-1 bg-[#E4EBE4]" />
    </div>
  );
}

export default function AdminSiteDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const namesite = decodeURIComponent(params.id);

  const [inspections, setInspections] = useState<FormResponse[]>([]);
  const [site, setSite] = useState<SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInspections, setExpandedInspections] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('by-date');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showDataQuality, setShowDataQuality] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; open: boolean } | null>(null);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const siteData = await getSiteByName(namesite);
        const details = await getFormResponsesBySite(siteData[0].namesite);
        setSite(siteData[0]);
        setInspections(details);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading inspections';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [namesite]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showExportMenu]);

  // Close inspection menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const menuEl = menuRefs.current[openMenuId];
        if (menuEl && !menuEl.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const computeAverageNaturalness = (items: FormResponse[]) => {
    const scores: number[] = [];
    const re = /^(\d+(\.\d+)?)/;

    for (const it of items) {
      if (typeof it.naturalness_score !== "string") continue;
      const m = it.naturalness_score.trim().match(re);
      if (m) scores.push(parseFloat(m[1]));
    }

    if (scores.length === 0) return { average: null, text: "N/A" };

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const r = Math.round(avg * 10) / 10;

    let label = "N/A";
    if (r >= 3.5) label = "Excellent";
    else if (r >= 2.5) label = "Good";
    else if (r >= 1.5) label = "Fair";
    else label = "Poor";

    return { average: r, text: label };
  };

  const { average, text: avgText } = computeAverageNaturalness(inspections);

  const normalizeScore = (score: string | null): string => {
    if (!score || score.trim() === '') return 'N/A';
    const trimmed = score.trim();
    if (trimmed.toLowerCase() === 'cannot answer') return 'Cannot Answer';
    return trimmed;
  };

  const questionComparisons = useMemo((): QuestionComparison[] => {
    const questionMap = new Map<string, {
      label: string;
      section_id: number | null;
      section_title: string | null;
      answers: QuestionComparison["answers"];
    }>();

    inspections.forEach((response) => {
      response.answers.forEach((a) => {
        const key = String(a.question_id);
        if (!questionMap.has(key)) {
          questionMap.set(key, {
            label: a.question_text,
            section_id: a.section_id,
            section_title: a.section_title,
            answers: [],
          });
        }
        const value = a.obs_value ?? a.obs_comm ?? '';
        if (value) {
          questionMap.get(key)!.answers.push({
            inspectionId: response.id,
            date: response.created_at ?? '',
            displayDate: response.created_at ? new Date(response.created_at).toLocaleDateString() : 'N/A',
            answer: value,
          });
        }
      });
    });

    return Array.from(questionMap.entries())
      .map(([questionId, { label, section_id, section_title, answers }]) => ({
        questionId,
        questionText: label,
        section_id,
        section_title,
        answers: answers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }))
      .sort((a, b) => parseInt(a.questionId) - parseInt(b.questionId));
  }, [inspections]);

  const formatAgeBadge = (days: number): string => {
    if (!days || days < 0) return 'New';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}yr ago`;
  };

  const toggleInspection = (id: number) => {
    setExpandedInspections(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.has(questionId) ? newSet.delete(questionId) : newSet.add(questionId);
      return newSet;
    });
  };

  // Handle delete - opens confirmation modal
  const handleDeleteFromMenu = (responseId: number) => {
    setDeleteConfirm({ id: responseId, open: true });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deactivateFormResponse(deleteConfirm.id);
      setInspections(prev => prev.filter(ins => ins.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deactivating form response:', err);
      alert(`Failed to deactivate form response: ${err.message}`);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['Date', 'Score', 'Steward', 'Naturalness Details'];
      const rows = inspections.map(insp => [
        insp.created_at ? new Date(insp.created_at).toLocaleDateString() : '',
        insp.naturalness_score || '',
        insp.steward || '',
        insp.naturalness_details || '',
      ]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${namesite}-inspections.csv`;
      a.click();
    } else {
      const json = JSON.stringify({ site, inspections }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${namesite}-inspections.json`;
      a.click();
    }
    setShowExportMenu(false);
  };

  const getDataQualityScore = (response: FormResponse): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;

    if (!response.created_at) {
      issues.push('Missing date');
      score -= 20;
    }
    if (!response.naturalness_score || response.naturalness_score.trim() === '') {
      issues.push('Missing naturalness score');
      score -= 25;
    }
    if (response.answers.length === 0) {
      issues.push('No answers recorded');
      score -= 15;
    }
    if (!response.naturalness_details || response.naturalness_details.trim() === '') {
      issues.push('Missing naturalness details');
      score -= 10;
    }

    return { score: Math.max(0, score), issues };
  };

  const filteredInspections = useMemo(() => {
    if (!filterText.trim()) return inspections;
    const lower = filterText.toLowerCase();
    return inspections.filter(insp => {
      return (
        (insp.created_at?.toLowerCase().includes(lower)) ||
        (insp.naturalness_score?.toLowerCase().includes(lower)) ||
        (insp.naturalness_details?.toLowerCase().includes(lower)) ||
        (insp.steward?.toLowerCase().includes(lower)) ||
        insp.answers.some(a =>
          (a.obs_value?.toLowerCase().includes(lower)) ||
          (a.obs_comm?.toLowerCase().includes(lower)) ||
          (a.question_text?.toLowerCase().includes(lower))
        )
      );
    });
  }, [inspections, filterText]);

  // Handle Back Button Navigation
  const handleBack = () => {
    const stack: string[] = JSON.parse(sessionStorage.getItem('navStack') || '[]');

    if (stack.length > 1) {
      stack.pop();
      const previous = stack[stack.length - 1];
      stack.pop();
      sessionStorage.setItem('navStack', JSON.stringify(stack));
      router.push(previous);
    } else {
      stack.pop();
      sessionStorage.setItem('navStack', JSON.stringify(stack));
      router.push('/admin/sites');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading site details...</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#B91C1C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Unable to Load Site</h2>
          <p className="text-[#7A8075] mb-6">{error || "Site not found"}</p>
          <button
            onClick={handleBack}
            className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Back to Admin Sites
          </button>
        </div>
      </div>
    );
  }

  const age = daysSince(site.inspectdate ?? '1900-01-01');
  const ageText = formatAgeBadge(age);

  const gradientPosition = average ? ((average - 1) / 3) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#E4EBE4] hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Admin Sites</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                 <Image
                src="/images/sapaa-icon-white.png"
                alt="SAPAA"
                width={48}
                height={48}
                className="w-12 h-12 flex-shrink-0"
              />
                <h1 className="text-3xl font-bold">{site.namesite}</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  Admin View
                </span>
              </div>

              {site.county && (
                <div className="flex items-center gap-2 text-[#E4EBE4] mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{site.county}</span>
                </div>
              )}

              {site.inspectdate && (
                <div className="flex items-center gap-2 text-[#E4EBE4]">
                  <Calendar className="w-5 h-5" />
                  <span>Last Inspection: {new Date(site.inspectdate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                <div className="text-sm text-[#E4EBE4]">Last Visit</div>
                <div className="text-xl font-bold">{ageText}</div>
              </div>

              {/* Admin Actions */}
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Export</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-[#E4EBE4] overflow-hidden z-10">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors border-b border-[#E4EBE4] flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Admin Tools Bar */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#E4EBE4] shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push(`/detail/${namesite}`)}
              className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#E4EBE4] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-[#254431]"
            >
              <Eye className="w-4 h-4" />
              View as User
            </button>
            <button
              onClick={() => setShowDataQuality(!showDataQuality)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showDataQuality
                  ? 'bg-[#356B43] text-white'
                  : 'bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Data Quality
            </button>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#254431]" />
                <input
                  type="text"
                  placeholder="Filter inspections..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#86A98A] rounded-lg text-sm text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality Panel */}
        {showDataQuality && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <h3 className="text-lg font-bold text-[#254431] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#356B43]" />
              Data Quality Analysis
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {inspections.map((response) => {
                const quality = getDataQualityScore(response);
                return (
                  <div key={response.id} className="border-2 border-[#E4EBE4] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#7A8075]">
                        {response.created_at ? new Date(response.created_at).toLocaleDateString() : 'No Date'}
                      </span>
                      <span className={`text-sm font-bold ${
                        quality.score >= 80 ? 'text-[#1C7C4D]' :
                        quality.score >= 60 ? 'text-[#E0A63A]' :
                        'text-[#B91C1C]'
                      }`}>
                        {quality.score}%
                      </span>
                    </div>
                    {quality.issues.length > 0 && (
                      <div className="space-y-1">
                        {quality.issues.map((issue, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-[#7A8075]">
                            <AlertTriangle className="w-3 h-3 text-[#E0A63A]" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                    {quality.issues.length === 0 && (
                      <div className="flex items-center gap-1 text-xs text-[#1C7C4D]">
                        <CheckCircle2 className="w-3 h-3" />
                        All data present
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#356B43]" />
              </div>
              <div className="text-sm font-medium text-[#7A8075] uppercase tracking-wide">Total Reports</div>
            </div>
            <div className="text-3xl font-bold text-[#254431]">{inspections.length}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-[#356B43]" />
              </div>
              <div className="text-sm font-medium text-[#7A8075] uppercase tracking-wide">Avg. Score</div>
            </div>
            <div className="text-3xl font-bold text-[#254431]">{average !== null ? average.toFixed(1) : 'N/A'}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#356B43]" />
              </div>
              <div className="text-sm font-medium text-[#7A8075] uppercase tracking-wide">Condition</div>
            </div>
            <div className="text-2xl font-bold text-[#254431]">{avgText}</div>
          </div>
        </div>

        {/* Naturalness Score Gradient */}
        {average !== null && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#254431] mb-1">Naturalness Score</h2>
                <p className="text-[#7A8075]">Average across all inspections</p>
              </div>
              <div className="text-5xl font-bold text-[#356B43]">{average.toFixed(1)}</div>
            </div>

            <div className="relative mb-4">
              <div className="h-8 rounded-full overflow-hidden bg-gradient-to-r from-[#B91C1C] via-[#E0A63A] via-[#84CC16] to-[#1C7C4D] shadow-inner"></div>

              <div
                className="absolute top-0 transition-all duration-500"
                style={{ left: `${gradientPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-1 h-8 bg-[#254431] rounded-full shadow-lg"></div>
                  <div className="w-4 h-4 bg-[#254431] rounded-full shadow-lg -mt-2 border-4 border-white"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm font-medium text-[#7A8075] px-1">
              <span>1.0 Poor</span>
              <span>2.0 Fair</span>
              <span>3.0 Good</span>
              <span>4.0 Excellent</span>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex gap-2 bg-white rounded-2xl p-2 border-2 border-[#E4EBE4] shadow-sm">
          <button
            onClick={() => setViewMode('by-date')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'by-date'
                ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white shadow-md'
                : 'text-[#7A8075] hover:bg-[#F7F2EA]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            View by Date
          </button>
          <button
            onClick={() => setViewMode('by-question')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'by-question'
                ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white shadow-md'
                : 'text-[#7A8075] hover:bg-[#F7F2EA]'
            }`}
          >
            <FileText className="w-5 h-5" />
            Compare by Question
          </button>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'by-date' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#254431] flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#356B43]" />
                Inspection Reports ({filteredInspections.length}{filterText ? ` of ${inspections.length}` : ''})
              </h2>
            </div>

            {filteredInspections.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-[#E4EBE4]">
                <Search className="w-12 h-12 text-[#7A8075] mx-auto mb-4" />
                <p className="text-[#7A8075] font-medium">No inspections match your filter</p>
              </div>
            ) : (
              filteredInspections.map((response) => {
              const isExpanded = expandedInspections.has(response.id);
              const quality = getDataQualityScore(response);
              const sections = groupAnswersBySection(response.answers);

              return (
                <div key={response.id} className="bg-white rounded-2xl border-2 border-[#E4EBE4] shadow-sm hover:shadow-md transition-all relative">
                  <div className="flex items-center justify-between p-6">
                    <button
                      onClick={() => toggleInspection(response.id)}
                      className="flex-1 flex items-center justify-between text-left hover:bg-[#F7F2EA] transition-colors -m-6 p-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#E4EBE4] rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-[#356B43]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-[#254431]">
                              {response.created_at ? new Date(response.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'No Date'}
                            </h3>
                            {quality.score < 80 && (
                              <div title={`Data quality: ${quality.score}%`}>
                                <AlertTriangle className="w-4 h-4 text-[#E0A63A]" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-[#7A8075]">Score: {normalizeScore(response.naturalness_score)}</p>
                        </div>
                      </div>

                      <div className="relative flex items-center gap-2">
                        {/* Chevron */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleInspection(response.id); }}
                          className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#F7F2EA] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-6 h-6 text-[#7A8075]" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-[#7A8075]" />
                          )}
                        </button>

                        {/* Menu button */}
                        <div className="relative" ref={el => { menuRefs.current[response.id] = el; }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(prev => prev === response.id ? null : response.id);
                            }}
                            className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#F7F2EA] transition-colors z-10"
                          >
                            <MoreVertical className="w-5 h-5 text-[#7A8075]" />
                          </button>

                          {openMenuId === response.id && (
                            <div
                              className="absolute right-0 top-full mt-2 w-40 max-w-[90vw] bg-white rounded-xl shadow-lg border border-[#E4EBE4] z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/detail/${namesite}/edit-report/${response.id}`);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#F7F2EA] flex items-center gap-2 text-[#1E2520] rounded-t-xl"
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteFromMenu(response.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#FEE2E2] flex items-center gap-2 text-[#B91C1C] rounded-b-xl"
                              >
                                <X className="w-4 h-4" /> Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 border-t-2 border-[#E4EBE4] pt-4">
                      {response.steward && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-1">Steward</p>
                          <p className="text-[#1E2520]">{response.steward}</p>
                        </div>
                      )}

                      {response.naturalness_details && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-1">Naturalness Details</p>
                          <p className="text-[#1E2520]">{response.naturalness_details}</p>
                        </div>
                      )}

                      {response.answers.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-2">Observations</p>
                          <div className="space-y-2">
                            {sections.map((section, sIdx) => (
                              <React.Fragment key={sIdx}>
                                {section.sectionTitle && (
                                  <SectionDivider title={section.sectionTitle} />
                                )}
                                {section.answers.map((a, aIdx) => {
                                  const value = a.obs_value ?? a.obs_comm ?? '';
                                  if (!value) return null;
                                  return (
                                    <div key={aIdx} className="bg-[#F7F2EA] rounded-lg p-3">
                                      <span className="font-semibold text-[#356B43]">{a.question_text}:</span>{' '}
                                      <span className="text-[#1E2520]">{value}</span>
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Quality Info */}
                      {quality.issues.length > 0 && (
                        <div className="border-t-2 border-[#E4EBE4] pt-4 mt-4">
                          <p className="text-sm font-semibold text-[#7A8075] mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#E0A63A]" />
                            Data Quality: {quality.score}%
                          </p>
                          <div className="space-y-1">
                            {quality.issues.map((issue, i) => (
                              <div key={i} className="text-xs text-[#7A8075] bg-[#FEF3C7] rounded px-2 py-1">
                                {issue}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#254431] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#356B43]" />
              Question Comparison ({questionComparisons.length} questions)
            </h2>

            {questionComparisons.map((qComp) => {
              const isExpanded = expandedQuestions.has(qComp.questionId);

              return (
                <div key={qComp.questionId} className="bg-white rounded-2xl border-2 border-[#E4EBE4] overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <button
                    onClick={() => toggleQuestion(qComp.questionId)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-[#F7F2EA] transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#E4EBE4] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-[#356B43]">Q{qComp.questionId}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1E2520] font-medium">{qComp.questionText}</p>
                        <p className="text-sm text-[#7A8075] mt-1">{qComp.answers.length} response{qComp.answers.length !== 1 ? 's' : ''} across inspections</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-[#7A8075] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-[#7A8075] flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-3 border-t-2 border-[#E4EBE4] pt-4">
                      {qComp.answers.map((answer, idx) => (
                        <div key={`${answer.inspectionId}-${idx}`} className="bg-[#F7F2EA] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-[#7A8075]" />
                            <span className="text-sm font-semibold text-[#356B43]">
                              {answer.displayDate}
                            </span>
                          </div>
                          <p className="text-[#1E2520]">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Modal */}
      {deleteConfirm?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-[#B91C1C]" />
            </div>
            <h3 className="text-lg font-bold text-[#254431] text-center mb-2">Deactivate Inspection?</h3>
            <p className="text-[#7A8075] text-center mb-6">
              Are you sure you want to deactivate this inspection? It will no longer be visible but the data will be preserved.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="px-5 py-2.5 rounded-xl border-2 border-[#E4EBE4] text-[#7A8075] hover:bg-[#F7F2EA] font-medium transition-colors"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 bg-[#B91C1C] text-white rounded-xl font-semibold hover:bg-[#991B1B] transition-colors"
                onClick={confirmDelete}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
