"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getFormResponsesBySiteAdmin,
  getSiteByName,
  SiteSummary,
  FormResponse,
  FormAnswer,
  setFormResponseActive,
  updateSiteInspectionAnswers,
} from "@/utils/supabase/queries";
import { daysSince } from "@/app/sites/page";
import PdfExportModal from '@/components/PdfExportModal';
import Image from 'next/image';
import {
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
  EyeOff,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Search,
  Download,
  Edit3,
  Save,
  Loader2,
  Power,
  ImageIcon,
  Maximize2,
} from "lucide-react";

type AdminFormResponse = FormResponse & { is_active: boolean };

type ViewMode = 'by-date' | 'by-question' | 'image-gallery';

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

interface EditableAnswer {
  question_id: number;
  question_text: string;
  obs_value: string;
  obs_comm: string;
  section_id: number | null;
  section_title: string | null;
}

type GalleryItem = {
  id: string;
  site_id: string;
  site_name?: string | null;
  filename: string;
  storage_key: string;
  file_size_bytes?: number | null;
  imageUrl: string;
  caption?: string | null;
  identifier?: string | null;
  // description?: string | null;
  response_id?: string | null;
  question_id?: string | null;
  content_type?: string | null;
  date?: string | null;
  photographer?: string | null;
};

function getInspectionDate(response: FormResponse): string | null {
  return response.inspection_date ?? response.created_at ?? null;
}

function formatInspectionDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return 'No Date';

  const formatOptions = options ?? { year: 'numeric', month: 'numeric', day: 'numeric' };

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Intl.DateTimeFormat('en-US', {
      ...formatOptions,
      timeZone: 'UTC',
    }).format(new Date(`${dateString}T00:00:00Z`));
  }

  return new Date(dateString).toLocaleDateString('en-US', formatOptions);
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

  const [inspections, setInspections] = useState<AdminFormResponse[]>([]);
  const [site, setSite] = useState<SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInspections, setExpandedInspections] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('by-date');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showDataQuality, setShowDataQuality] = useState(false);


  // Edit modal state
  const [editingResponse, setEditingResponse] = useState<AdminFormResponse | null>(null);
  const [editAnswers, setEditAnswers] = useState<EditableAnswer[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle active state
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredGalleryItems = useMemo(() => {
    if (!searchQuery.trim()) return galleryItems;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    return galleryItems.filter((item) => {
      return (
        (item.site_name || site?.namesite || "").toLowerCase().includes(lowerQuery) ||
        (item.caption || "").toLowerCase().includes(lowerQuery) ||
        (item.photographer || "").toLowerCase().includes(lowerQuery) ||
        (item.identifier || "").toLowerCase().includes(lowerQuery) ||
        (item.filename || "").toLowerCase().includes(lowerQuery) ||
        (item.storage_key || "").toLowerCase().includes(lowerQuery)
      );
    });
  }, [galleryItems, searchQuery]);

      useEffect(() => {
        if (selectedImage) {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "auto";
        }

        return () => {
          document.body.style.overflow = "auto";
        };
      }, [selectedImage]);
 
          useEffect(() => {
            if (selectedImage) {
              document.body.style.overflow = "hidden";
            } else {
              document.body.style.overflow = "auto";
            }

            return () => {
              document.body.style.overflow = "auto";
            };
          }, [selectedImage]);


  useEffect(() => {
    const load = async () => {
      try {
        const siteData = await getSiteByName(namesite);
        const details = await getFormResponsesBySiteAdmin(siteData[0].namesite);
        setSite(siteData[0]);
        setInspections(details); // change state type to FormResponse[]
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading inspections';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [namesite]);

  // Fetch gallery images
  useEffect(() => {
    const fetchGalleryForSite = async () => {
      if (!site?.id) return;
      try {
        setGalleryLoading(true);
        const res = await fetch(`/api/sites/${site.id}/gallery`);
        const data = await res.json();
        const res1 = await fetch(`/api/homepage-images/${site.id}`);
        const data1 = await res1.json();

        if (!res.ok) throw new Error(data.error || "Failed to load gallery");
        if (!res1.ok) throw new Error(data1.error || "Failed to load homepage-images");

        const allItems = [
          ...(data.items || []).map((item: any) => ({ ...item, _sortDate: item.created_at ?? item.date ?? "" })),
          ...(data1.items || []).map((item: any) => ({ ...item, _sortDate: item.date ?? item.created_at ?? "" })),
        ].sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime());
        console.log("GALLERY ITEMS:", allItems);
        
        setGalleryItems(allItems || []);
      } catch (err) {
        console.error("Gallery fetch error:", err);
        setGalleryItems([]);
      } finally {
        setGalleryLoading(false);
      }
    };
    fetchGalleryForSite();
  }, [site?.id]);

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
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);


  // Only count active inspections for stats
  const activeInspections = useMemo(() => inspections.filter(i => i.is_active), [inspections]);

  const computeAverageNaturalness = (items: AdminFormResponse[]) => {
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

  const { average, text: avgText } = computeAverageNaturalness(activeInspections);

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

    activeInspections.forEach((response) => {
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
        const inspectionDate = getInspectionDate(response);
        if (value) {
          questionMap.get(key)!.answers.push({
            inspectionId: response.id,
            date: inspectionDate ?? '',
            displayDate: formatInspectionDate(inspectionDate, {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
            }),
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
  }, [activeInspections]);

  const questionComparisonsBySection = useMemo(() => {
    const sections: Array<{
      sectionId: number | null;
      sectionTitle: string | null;
      questions: QuestionComparison[];
    }> = [];
    const seen = new Map<number | string, number>();

    for (const qComp of questionComparisons) {
      const key = qComp.section_id ?? 'null';
      if (!seen.has(key)) {
        seen.set(key, sections.length);
        sections.push({ sectionId: qComp.section_id, sectionTitle: qComp.section_title, questions: [] });
      }
      sections[seen.get(key)!].questions.push(qComp);
    }

    return sections;
  }, [questionComparisons]);

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

  // Toggle active/inactive
  const handleToggleActive = async (response: AdminFormResponse) => {
    setTogglingId(response.id);
    try {
      const newActive = !response.is_active;
      await setFormResponseActive(response.id, newActive);
      setInspections(prev =>
        prev.map(ins => ins.id === response.id ? { ...ins, is_active: newActive } : ins)
      );
    } catch (err: any) {
      console.error('Error toggling form response:', err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Open edit modal
  const handleOpenEditModal = (response: AdminFormResponse) => {
    setEditingResponse(response);
    setEditAnswers(response.answers.map(a => ({
      question_id: a.question_id,
      question_text: a.question_text,
      obs_value: a.obs_value ?? '',
      obs_comm: a.obs_comm ?? '',
      section_id: a.section_id,
      section_title: a.section_title,
    })));
  };

  const handleEditAnswerChange = useCallback((questionId: number, field: 'obs_value' | 'obs_comm', value: string) => {
    setEditAnswers(prev => prev.map(a =>
      a.question_id === questionId ? { ...a, [field]: value } : a
    ));
  }, []);

  const handleSaveEdit = async () => {
    if (!editingResponse) return;
    setIsSaving(true);
    try {
      const batchArray = editAnswers
        .filter(a => a.obs_value || a.obs_comm)
        .map(a => ({
          question_id: a.question_id,
          obs_value: a.obs_value || null,
          obs_comm: a.obs_comm || null,
        }));

      await updateSiteInspectionAnswers(editingResponse.id, batchArray);

      // Reload data
      if (site) {
        const details = await getFormResponsesBySiteAdmin(site.namesite);
        setInspections(details);
      }

      setEditingResponse(null);
      setEditAnswers([]);
    } catch (err: any) {
      console.error('Error saving:', err);
      alert(`Failed to save changes: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['Date', 'Score', 'Steward', 'Naturalness Details', 'Active'];
      const rows = inspections.map(insp => [
        getInspectionDate(insp) ? formatInspectionDate(getInspectionDate(insp), {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }) : '',
        insp.naturalness_score || '',
        insp.steward || '',
        insp.naturalness_details || '',
        insp.is_active ? 'Yes' : 'No',
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

  const getDataQualityScore = (response: AdminFormResponse): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;
    if (!getInspectionDate(response)) { issues.push('Missing date'); score -= 20; }
    if (!response.naturalness_score || response.naturalness_score.trim() === '') { issues.push('Missing naturalness score'); score -= 25; }
    if (response.answers.length === 0) { issues.push('No answers recorded'); score -= 15; }
    if (!response.naturalness_details || response.naturalness_details.trim() === '') { issues.push('Missing naturalness details'); score -= 10; }
    return { score: Math.max(0, score), issues };
  };

  const filteredInspections = useMemo(() => {
    if (!filterText.trim()) return inspections;
    const lower = filterText.toLowerCase();
    return inspections.filter(insp => {
      return (
        (insp.inspection_date?.toLowerCase().includes(lower)) ||
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
          <button onClick={handleBack} className="flex items-center gap-2 text-[#E4EBE4] hover:text-white transition-colors mb-3 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-base font-medium">Back to Admin Sites</span>
          </button>
        </div>
      </div>
    );
  }

  const age = daysSince(site.inspectdate ?? '1900-01-01');
  const ageText = formatAgeBadge(age);
  const gradientPosition = average ? ((average - 1) / 3) * 100 : 0;

  const editSections = editAnswers.length > 0 ? (() => {
    const sections: Array<{ sectionTitle: string | null; answers: EditableAnswer[] }> = [];
    const seen = new Map<string, number>();
    for (const a of editAnswers) {
      const key = a.section_title ?? 'Other';
      if (!seen.has(key)) {
        seen.set(key, sections.length);
        sections.push({ sectionTitle: a.section_title, answers: [] });
      }
      sections[seen.get(key)!].answers.push(a);
    }
    return sections;
  })() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
      {/* Header — matches site details layout */}
      <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[#86A98A] hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Admin Sites</span>
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: icon + site info */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <Image
                      src="/images/sapaa-icon-white.png"
                      alt="SAPAA"
                      width={140}
                      height={140}
                      priority
                      className="h-12 sm:h-16 w-auto flex-shrink-0 opacity-100 mt-1"
                    />
              <div>
                <div className="flex items-center gap-3 mt-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">{site.namesite}</h1>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    Admin View
                  </span>
                </div>
                {site.county && (
                  <div className="flex items-start sm:items-center gap-2 text-[#E4EBE4]">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base">{site.county}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: export + last visit badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto flex-shrink-0">
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full sm:w-auto justify-center bg-white/10 px-4 py-2 rounded-2xl sm:rounded-full border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-medium"               
               >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-[#E4EBE4] overflow-hidden z-10">
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors border-b border-[#E4EBE4] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        setShowPdfModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white/10 px-4 sm:px-6 py-2 rounded-2xl sm:rounded-full border border-white/20 text-center w-full sm:w-auto">
                <div className="text-sm text-[#E4EBE4]">Last Visit</div>
                <div className="text-lg font-bold">{ageText}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Admin Tools Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <button
            onClick={() => router.push(`/detail/${namesite}`)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-white hover:bg-[#F7F2EA] rounded-xl text-sm font-medium transition-colors flex items-center gap-2 text-[#254431] border-2 border-[#E4EBE4]"        
        
        >
            <Eye className="w-4 h-4" />
            View as User
          </button>
          <button
            onClick={() => setShowDataQuality(!showDataQuality)}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border-2 ${showDataQuality ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white border-[#254431]' : 'bg-white hover:bg-[#F7F2EA] text-[#254431] border-[#E4EBE4]'}`}
          
          >
            <CheckCircle2 className="w-4 h-4" />
            Data Quality
          </button>
          <div className="w-full sm:flex-1 sm:min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8075]" />
              <input
                type="text"
                placeholder="Filter inspections..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#E4EBE4] rounded-xl text-sm text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] shadow-sm"
              />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspections.map((response) => {
                const quality = getDataQualityScore(response);
                return (
                  <div key={response.id} className={`border-2 rounded-lg p-4 ${response.is_active ? 'border-[#E4EBE4]' : 'border-[#E4EBE4] opacity-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#7A8075]">
                        {formatInspectionDate(getInspectionDate(response), {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </span>
                      <span className={`text-sm font-bold ${quality.score >= 80 ? 'text-[#1C7C4D]' : quality.score >= 60 ? 'text-[#E0A63A]' : 'text-[#B91C1C]'}`}>
                        {quality.score}%
                      </span>
                    </div>
                    {!response.is_active && <div className="text-xs text-[#B91C1C] font-semibold mb-1">Inactive</div>}
                    {quality.issues.length > 0 ? (
                      <div className="space-y-1">
                        {quality.issues.map((issue, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-[#7A8075]"><AlertTriangle className="w-3 h-3 text-[#E0A63A]" />{issue}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-[#1C7C4D]"><CheckCircle2 className="w-3 h-3" />All data present</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Cards — matches site details style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-[#356B43]" />
              <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Total Reports</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{activeInspections.length}</div>
            {inspections.length !== activeInspections.length && (
              <div className="text-xs text-[#7A8075] mt-1">{inspections.length - activeInspections.length} inactive</div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#356B43]" />
              <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Avg. Score</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{average !== null ? average.toFixed(1) : 'N/A'}</div>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#356B43]" />
              <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Condition</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{avgText}</div>
          </div>
        </div>

        {/* Naturalness Score Gradient */}
        {average !== null && (
          <div className="bg-white rounded-2xl p-4 sm:p-8 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#254431] mb-1">Naturalness Score</h2>
                <p className="text-[#7A8075]">Average across active inspections</p>
              </div>
              <div className="text-3xl sm:text-5xl font-bold text-[#356B43]">{average.toFixed(1)}</div>
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
            <div className="grid grid-cols-2 sm:flex sm:justify-between gap-2 text-xs sm:text-sm font-medium text-[#7A8075] px-1">
              <span>1.0 Poor</span>
              <span>2.0 Fair</span>
              <span>3.0 Good</span>
              <span>4.0 Excellent</span>
            </div>
          </div>
        )}

        {/* View Toggle — matches site details style with 3 tabs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-1.5">
          <button
            onClick={() => setViewMode('by-date')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-semibold transition-all border-2 ${
              viewMode === 'by-date'
                ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white shadow-md border-[#254431]'
                : 'bg-white text-[#7A8075] hover:bg-[#F7F2EA] border-[#E4EBE4]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            View by Date
          </button>

          <button
            onClick={() => setViewMode('by-question')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-semibold transition-all border-2 ${
              viewMode === 'by-question'
                ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white shadow-md border-[#254431]'
                : 'bg-white text-[#7A8075] hover:bg-[#F7F2EA] border-[#E4EBE4]'
            }`}
          >
            <FileText className="w-5 h-5" />
            Compare by Question
          </button>

          <button
            onClick={() => setViewMode('image-gallery')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-semibold transition-all border-2 ${
              viewMode === 'image-gallery'
                ? 'bg-gradient-to-r from-[#356B43] to-[#254431] text-white shadow-md border-[#254431]'
                : 'bg-white text-[#7A8075] hover:bg-[#F7F2EA] border-[#E4EBE4]'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Image Gallery
          </button>
        </div>

        {/* ── VIEW BY DATE ── */}
        {viewMode === 'by-date' && (
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#254431] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#356B43]" />
              Inspection Reports ({filteredInspections.length}{filterText ? ` of ${inspections.length}` : ''})
            </h2>

            {filteredInspections.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-[#E4EBE4] p-8 text-center text-[#7A8075]">
                No inspections match your filter
              </div>
            ) : (
              filteredInspections.map((response) => {
                const isExpanded = expandedInspections.has(response.id);
                const quality = getDataQualityScore(response);
                const isInactive = !response.is_active;

                return (
                  <div
                    key={response.id}
                    className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all ${
                      isInactive ? 'border-[#E0A63A] opacity-70' : 'border-[#E4EBE4]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      {/* Main clickable area — matches site details */}
                      <button
                        onClick={() => toggleInspection(response.id)}
                        className="flex-1 flex items-center justify-between p-4 sm:p-6 sm:pr-4 text-left hover:bg-[#F7F2EA] transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isInactive ? 'bg-[#FEF3C7]' : 'bg-[#E4EBE4]'}`}>
                            <FileText className={`w-6 h-6 ${isInactive ? 'text-[#92400E]' : 'text-[#356B43]'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-[#254431] leading-snug">
                                {formatInspectionDate(getInspectionDate(response), {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </h3>
                              {isInactive && (
                                <span className="px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] text-xs font-bold rounded-full flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Inactive
                                </span>
                              )}
                              {quality.score < 80 && <div title={`Data quality: ${quality.score}%`}><AlertTriangle className="w-4 h-4 text-[#E0A63A]" /></div>}
                            </div>
                            <p className="text-sm text-[#7A8075]">Score: {normalizeScore(response.naturalness_score)}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6 text-[#7A8075]" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-[#7A8075]" />
                        )}
                      </button>

                      {/* Admin action buttons — directly visible */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mx-4 mb-4 sm:mb-0">
                        <button
                          data-testid={`edit-button-${response.id}`}
                          onClick={() => handleOpenEditModal(response)}
                          className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[#1E2520] bg-[#E4EBE4] hover:bg-[#356B43] hover:text-white transition-all"
                          title="Edit Answers"
                        >
                          <Edit3 className="w-4 h-4" /> Edit Answers
                        </button>
                        <button
                          data-testid={`toggle-active-button-${response.id}`}
                          onClick={() => handleToggleActive(response)}
                          disabled={togglingId === response.id}
                          className={`w-full sm:w-auto justify-center flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${response.is_active ? 'bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]' : 'bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]'}`}
                          title={response.is_active ? 'Disable' : 'Enable'}
                        >
                          <Power className="w-4 h-4" />
                          {togglingId === response.id ? 'Updating...' : response.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t-2 border-[#E4EBE4] pt-4">
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
                            <div className="space-y-1">
                              {groupAnswersBySection(response.answers).map((section, sIdx) => (
                                <div key={sIdx}>
                                  {section.sectionTitle && (
                                    <SectionDivider title={"SECTION: " + section.sectionTitle} />
                                  )}
                                  <div className="space-y-2">
                                    {section.answers.map((a, aIdx) => {
                                      return (
                                        <div key={aIdx} className="bg-[#F7F2EA] rounded-lg p-3">
                                          <span className="font-semibold text-[#356B43]">{a.question_text}:</span>{' '}
                                          {a.obs_value && (
                                            <span className="text-[#1E2520]">{a.obs_value}</span>
                                          )}
                                          {a.obs_comm && (
                                            <span className="text-[#1E2520]">
                                              {a.obs_value ? ` (Other: ${a.obs_comm})` : a.obs_comm}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {quality.issues.length > 0 && (
                          <div className="border-t-2 border-[#E4EBE4] pt-4 mt-4">
                            <p className="text-sm font-semibold text-[#7A8075] mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-[#E0A63A]" />Data Quality: {quality.score}%
                            </p>
                            <div className="space-y-1">
                              {quality.issues.map((issue, i) => (
                                <div key={i} className="text-xs text-[#7A8075] bg-[#FEF3C7] rounded px-2 py-1">{issue}</div>
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
        )}

        {/* ── COMPARE BY QUESTION ── */}
        {viewMode === 'by-question' && (
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#254431] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#356B43]" />
              Question Comparison ({questionComparisons.length} questions)
            </h2>

            {questionComparisonsBySection.map((section, sIdx) => (
              <div key={sIdx} className="space-y-3">
                {section.sectionTitle && (
                  <SectionDivider title={"SECTION: " + section.sectionTitle} />
                )}

                {section.questions.map((qComp) => {
                  const isExpanded = expandedQuestions.has(qComp.questionId);

                  return (
                    <div key={qComp.questionId} className="bg-white rounded-2xl border-2 border-[#E4EBE4] overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <button
                        onClick={() => toggleQuestion(qComp.questionId)}
                        className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[#F7F2EA] transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-[#E4EBE4] rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[#356B43]">{qComp.questionId}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1E2520] font-medium break-words leading-snug">{qComp.questionText}</p>
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
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 border-t-2 border-[#E4EBE4] pt-4">
                          {qComp.answers.map((answer, idx) => (
                            <div key={`${answer.inspectionId}-${idx}`} className="bg-[#F7F2EA] rounded-lg p-4">
                              <div className="flex items-start sm:items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-[#7A8075] flex-shrink-0 mt-0.5 sm:mt-0" />
                                <span className="text-sm font-semibold text-[#356B43]">{answer.displayDate}</span>
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
            ))}
          </div>
        )}

        {viewMode === 'image-gallery' && (
          /* ── IMAGE GALLERY ── */
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#254431] flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-[#356B43]" />
                Image Gallery ({galleryItems.length} images)
              </h2>

              {/* SEARCH BAR UI */}
              <div className="mb-6">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[#7A8075]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filter by site, caption, photographer, identifier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border-2 border-[#E4EBE4] rounded-xl bg-white text-sm placeholder-[#7A8075] focus:outline-none focus:border-[#356B43] focus:ring-1 focus:ring-[#356B43] shadow-sm transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-4 w-4 text-[#7A8075] hover:text-red-500 transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {galleryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#356B43]" />
                  <p className="text-[#7A8075]">Loading gallery...</p>
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-[#E4EBE4] p-6 sm:p-8 text-center text-[#7A8075]">
                  No images found for this site.
                </div>
              ) : filteredGalleryItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-[#E4EBE4]">
                  <div className="bg-[#F7F2EA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-[#7A8075]" size={32} />
                  </div>
                  <p className="text-[#254431] font-semibold text-lg">
                    No matching images found.
                  </p>
                  <p className="text-[#7A8075] mt-1">Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {/* 4. MAP OVER FILTERED ITEMS */}
                  {filteredGalleryItems.map((item) => (
                    <div
                      key={`${item.response_id ? 'insp' : 'home'}-${item.id}`}
                      className="bg-white rounded-2xl border-2 border-[#E4EBE4] shadow-sm overflow-hidden hover:shadow-lg transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedImage(item)}
                        className="group relative block w-full h-56 sm:h-64 bg-[#F7F2EA] overflow-hidden"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.identifier|| item.filename || "Inspection image"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-md">
                            <Maximize2 className="w-5 h-5 text-[#254431]" />
                          </div>
                        </div>
                      </button>

                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="text-sm text-[#7A8075] flex items-start sm:items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{item.site_name || site.namesite || "Unknown site"}</span>
                        </div>

                        <div className="text-sm text-[#7A8075] flex items-start gap-2">
                          <ImageIcon className="w-4 h-4 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#254431] break-words leading-snug">
                              {item.identifier || "No identifier"}
                            </p>
                            
                          </div>
                        </div>

                        <div className="text-sm text-[#7A8075] flex items-start gap-2">
                          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-[#7A8075] mt-0.5">
                              {item.date || "No date"}
                            </p>
                        </div>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-[#254431] rounded-full p-2 shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] flex-1 min-h-0">
              <div className="bg-black flex items-center justify-center min-h-[220px] sm:min-h-[300px] lg:min-h-0 max-h-[40vh] sm:max-h-[50vh] lg:max-h-none overflow-auto">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.identifier || selectedImage.filename || "Inspection image"}
                  className="max-w-full max-h-[40vh] sm:max-h-[50vh] lg:max-h-[85vh] object-contain"
                />
              </div>

              <div className="min-w-0 min-h-0 p-4 sm:p-6 bg-white space-y-4 sm:space-y-5 border-t lg:border-t-0 lg:border-l border-[#E4EBE4] overflow-y-auto">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Site</p>
                  <p className="text-base sm:text-lg font-semibold text-[#254431] break-words">{selectedImage.site_name || site.namesite || "Unknown site"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Caption</p>
                  <p className="text-base font-medium text-[#254431]">{selectedImage.caption || "No caption"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Identifier</p>
                  <p className="text-sm text-[#4B5563] leading-6 break-words">{selectedImage.identifier || "No identifier"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                    Date
                  </p>
                  <p className="text-sm text-[#4B5563] leading-6 break-words">
                    {selectedImage.date || "No date"}
                  </p>
                </div>

                {selectedImage.photographer && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                        Photographer
                      </p>
                      <p className="text-sm text-[#4B5563]">
                        {selectedImage.photographer}
                      </p>
                    </div>
                  )}

                <div>
                  <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Filename</p>
                  <p className="text-sm text-[#4B5563] break-all">{selectedImage.filename}</p>
                </div>

                 <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Storage Path
                    </p>
                    <p className="text-sm text-[#4B5563] break-all">
                      {selectedImage.storage_key}
                    </p>
                  </div>
                  
                <div className="pt-2">
                  <a
                    href={selectedImage.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[#254431] text-white px-4 py-2.5 font-medium hover:bg-[#356B43] transition-colors"
                  >
                    Open full image in new tab
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Answers Modal */}
      {editingResponse && (
        <div className="fixed inset-0 bg-[#254431]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b-2 border-[#E4EBE4] flex-shrink-0">
              <h2 className="text-2xl font-bold text-[#254431]">
                Edit Report: {formatInspectionDate(getInspectionDate(editingResponse), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <button onClick={() => { setEditingResponse(null); setEditAnswers([]); }} disabled={isSaving} className="w-10 h-10 rounded-xl hover:bg-[#E4EBE4] flex items-center justify-center transition-colors disabled:opacity-50">
                <X className="w-6 h-6 text-[#7A8075]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 relative">
              {isSaving && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-b-3xl">
                  <Loader2 className="w-12 h-12 text-[#356B43] animate-spin mb-4" />
                  <p className="text-[#356B43] font-medium text-lg">Saving changes...</p>
                </div>
              )}

              <div className="space-y-6">
                {editSections.map((section, sIdx) => (
                  <div key={sIdx}>
                    {section.sectionTitle && (
                      <h3 className="text-sm font-bold text-[#356B43] uppercase tracking-widest mb-3 border-b border-[#E4EBE4] pb-2">{section.sectionTitle}</h3>
                    )}
                    <div className="space-y-4">
                      {section.answers.map((a) => (
                        <div key={a.question_id} className="bg-[#F7F2EA] rounded-lg p-4">
                          <label className="block text-sm font-semibold text-[#254431] mb-2">{a.question_text}</label>
                          {a.obs_value !== '' || !a.obs_comm ? (
                            <input
                              type="text"
                              value={a.obs_value}
                              onChange={(e) => handleEditAnswerChange(a.question_id, 'obs_value', e.target.value)}
                              className="w-full border-2 border-[#E4EBE4] rounded-lg p-3 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] bg-white"
                              placeholder="Enter value..."
                            />
                          ) : (
                            <textarea
                              value={a.obs_comm}
                              onChange={(e) => handleEditAnswerChange(a.question_id, 'obs_comm', e.target.value)}
                              className="w-full border-2 border-[#E4EBE4] rounded-lg p-3 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] min-h-[80px] resize-y bg-white"
                              placeholder="Enter comment..."
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t-2 border-[#E4EBE4] flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => { setEditingResponse(null); setEditAnswers([]); }} className="px-4 py-2 rounded-xl border-2 border-[#E4EBE4] text-[#7A8075] hover:bg-[#F7F2EA] font-medium transition-colors" disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="px-6 py-2 bg-[#356B43] text-white rounded-xl font-semibold hover:bg-[#254431] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<><Save className="w-4 h-4" />Save Changes</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      <PdfExportModal
        open={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        mode="site"
        siteName={namesite}
        inspections={activeInspections}
      />
    </div>
  );
}
