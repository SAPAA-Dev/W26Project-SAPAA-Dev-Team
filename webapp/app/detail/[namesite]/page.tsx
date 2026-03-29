"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getFormResponsesBySite,
  getSiteByName,
  SiteSummary,
  FormResponse,
  FormAnswer,
} from "@/utils/supabase/queries";
import { getCurrentUserUid } from "@/utils/supabase/queries";
import { daysSince } from "@/app/sites/page";
import { 
    Home,
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
    Pencil,
    ImageIcon,
    Loader2,
    Maximize2,
    X,
    Search
} from "lucide-react";
import Image from 'next/image';
import ProtectedRoute from "@/components/ProtectedRoute";
import dynamic from 'next/dynamic';
import { siteDetailSteps } from '@/components/TutorialOverlay';
import { createClient } from '@/utils/supabase/client';

const TutorialOverlay = dynamic(() => import('@/components/TutorialOverlay'), { ssr: false });

type ViewMode = 'by-date' | 'by-question'| 'image-gallery';

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

type GalleryItem = {
  id: string;
  response_id: string;
  question_id: string;
  caption?: string | null;
  identifier?: string | null;
  date?: string | null;
  storage_key: string;
  content_type: string;
  file_size_bytes?: number | null;
  filename: string;
  site_id: string | null; 
  site_name?: string | null;
  imageUrl: string;
  photographer?: string | null;
};

function getInspectionDate(response: FormResponse): string | null {
  return response.inspection_date ?? response.created_at ?? null;
}

function formatInspectionDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return 'N/A';

  const formatOptions = options ?? { year: 'numeric', month: 'numeric', day: 'numeric' };

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Intl.DateTimeFormat('en-US', {
      ...formatOptions,
      timeZone: 'UTC',
    }).format(new Date(`${dateString}T00:00:00Z`));
  }

  return new Date(dateString).toLocaleDateString('en-US', formatOptions);
}

async function getCurrentUser(): Promise<{ email: string; role: string; name: string; avatar: string} | null> {
  try {
    const supabase = createClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('No session or session error');
      return null;
    }
    
    const email = session.user.email ?? '';
    const role = session.user.user_metadata?.role ?? 'steward';
    const name  = session.user.user_metadata?.full_name ?? '';
    const avatar = session.user.user_metadata?.avatar_url ?? '';
    console.log(session.user)
    
    return {
      email,
      role,
      name,
      avatar
    };
  } catch (error) {
    return null;
  }
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

export default function SiteDetailScreen() {
  const params = useParams<{ namesite: string }>();
  const router = useRouter();
  const namesite = decodeURIComponent(params.namesite);

  const [inspections, setInspections] = useState<FormResponse[]>([]);
  const [site, setSite] = useState<SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInspections, setExpandedInspections] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('by-date');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name:string; avatar:string } | null>(null);
  const [forceTutorial, setForceTutorial] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false); 

  const handleStartTutorial = useCallback(() => {
    setForceTutorial(false);
    setTimeout(() => setForceTutorial(true), 50);
  }, []);

  const handleTutorialFinish = useCallback(() => {
    setForceTutorial(false);
  }, []);

      useEffect(() => {
        const fetchUser = async () => {
          setUserLoading(true);
          try {
            const user = await getCurrentUser();
            setCurrentUser(user);
          } catch (err) {
            setCurrentUser(null);
          } finally {
            setUserLoading(false);
          }
        };
        fetchUser();
      }, []);

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
        const [siteData, uid] = await Promise.all([
          getSiteByName(namesite),
          getCurrentUserUid(),
        ]);
        const details = await getFormResponsesBySite(siteData[0].namesite);

        setSite(siteData[0]);
        setInspections(details);
        setCurrentUserId(uid ?? null);
        try {
          const { createClient } = await import('@/utils/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          setCurrentUserEmail(session?.user?.email ?? null);
        } catch { /* ignore */ }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading inspections';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [namesite]);

  useEffect(() => {
    const fetchGalleryForSite = async () => {
      if (!site?.id) return;

      try {
        setGalleryLoading(true);

        const res = await fetch(`/api/sites/${site.id}/gallery`);
        const data = await res.json();

        const res1 = await fetch(`/api/homepage-images/${site.id}`);
        const data1 = await res1.json();

        if ((!res.ok)) {
          throw new Error(data.error || "Failed to load gallery");
        }

        if ((!res1.ok)) {
          throw new Error(data1.error || "Failed to load homepage-images");
        }

        const allItems = [
          ...(data.items || []).map((item: any) => ({
            ...item,
            _sortDate: item.created_at ?? item.date ?? "",
          })),
          ...(data1.items || []).map((item: any) => ({
            ...item,
            _sortDate: item.date ?? item.created_at ?? "",
          })),
        ].sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime());
        
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

  // client side filter logic
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
  }, [galleryItems, searchQuery, site?.namesite]);

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
        const inspectionDate = getInspectionDate(response);
        if (value) {
          questionMap.get(key)!.answers.push({
            inspectionId: response.id,
            date: inspectionDate ?? '',
            displayDate: formatInspectionDate(inspectionDate),
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
            onClick={() => router.push('/sites')}
            className="flex items-center gap-2 text-[#E4EBE4] hover:text-white transition-colors mb-3 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-base font-medium">Back to Sites</span>
          </button>
        </div>
      </div>
    );
  }

  const age = daysSince(site.inspectdate ?? '1900-01-01');
  const ageText = formatAgeBadge(age);
  const gradientPosition = average ? ((average - 1) / 3) * 100 : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">

      {/* Tutorial Overlay for site detail page */}
      {!loading && (
        <TutorialOverlay
          key={forceTutorial ? 'force' : 'auto'}
          steps={siteDetailSteps}
          tutorialKey="detail"
          userId={currentUserEmail}
          forceRun={forceTutorial}
          onFinish={handleTutorialFinish}
        />
      )}

      <div id="tutorial-detail-header" className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto">

    <button
      onClick={() => router.push('/sites')}
      className="flex items-center gap-1.5 text-[#86A98A] hover:text-white transition-colors mb-4 group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium">Back to Sites</span>
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
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2.5 leading-tight break-words">{site.namesite}</h1>
          {site.county && (
            <div className="flex items-start sm:items-center gap-2 text-[#E4EBE4]">
              <MapPin className="w-5 h-5" />
              <span className="text-base">{site.county}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: last visit badge + Help button */}
      <div className="flex items-center gap-3">
        <div className="bg-white/10 px-6 py-2 rounded-full border border-white/20 text-center flex-shrink-0">
          <div className="text-sm text-[#E4EBE4]">Last Visit</div>
          <div className="text-lg font-bold">{ageText}</div>
        </div>
        <UserNavBar onStartTutorial={handleStartTutorial} />

      </div>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Stats Cards */}
        <div id="tutorial-detail-stats" className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-[#356B43]" />
              <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Total Reports</div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{inspections.length}</div>
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
          <div className="bg-white rounded-2xl p-8 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#254431] mb-1">Naturalness Score</h2>
                <p className="text-[#7A8075]">Average across all inspections</p>
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

        {/* New Report Button */}
        <div id="tutorial-new-report" className="mt-4">
          <button
            onClick={() => router.push(`/detail/${params.namesite}/new-report`)}
            className="w-full flex items-center justify-center border-2 border-[#065F46] gap-2 bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-base sm:text-lg text-center">New Site Inspection Report</span>
          </button>
        </div>

        {/* View Toggle */}
        <div id="tutorial-view-toggle" className="flex gap-1.5">
          <button
            onClick={() => setViewMode('by-date')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base transition-all border-2 ${
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
              Inspection Reports ({inspections.length})
            </h2>

            {inspections.map((response) => {
              const isExpanded = expandedInspections.has(response.id);
              const isOwner = currentUserId !== null && response.user_id === currentUserId;

              return (
                <div key={response.id} className="bg-white rounded-2xl border-2 border-[#E4EBE4] overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    {/* Main clickable area */}
                    <button
                      onClick={() => toggleInspection(response.id)}
                      className="flex-1 flex items-center justify-between p-4 sm:p-6 sm:pr-4 text-left hover:bg-[#F7F2EA] transition-colors"
                      data-testid={`expand-inspection-button`}
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 bg-[#E4EBE4] rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-[#356B43]" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-[#254431] leading-snug">
                            {formatInspectionDate(getInspectionDate(response), {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                          <p className="text-sm text-[#7A8075]">Score: {normalizeScore(response.naturalness_score)}</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-[#7A8075]" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-[#7A8075]" />
                      )}
                    </button>

                    {/* Edit button - only visible to the submitting user */}

                    {isOwner && (
                      <button
                        onClick={() => router.push(`/detail/${params.namesite}/edit-report/${response.id}`)}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 mx-4 px-4 py-2 rounded-xl text-sm font-semibold bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431] transition-all"
                        title="Edit this report"
                        data-testid="edit-form-button"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    )}
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
                                  {section.answers
                                    .filter(a => a.obs_value || a.obs_comm)
                                    .map((a, idx) => (
                                    <div key={idx} className="bg-[#F7F2EA] rounded-lg p-3">
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
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        )}
        {viewMode === 'by-question' && (
          /* ── COMPARE BY QUESTION ── */
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
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-[#7A8075]" />
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
              <div className="mb-4 sm:mb-6">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[#7A8075]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filter by site, caption, photographer, identifier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 sm:py-2.5 border-2 border-[#E4EBE4] rounded-xl bg-white text-sm sm:text-base placeholder-[#7A8075] focus:outline-none focus:border-[#356B43] focus:ring-1 focus:ring-[#356B43] shadow-sm transition-all"
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
                <div className="text-center py-16 sm:py-20 px-4 bg-white rounded-2xl border-2 border-dashed border-[#E4EBE4]">
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
                          <MapPin className="w-4 h-4" />
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
                          <Calendar className="w-4 h-4 mt-0.5" />
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
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Site
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-[#254431] break-words">
                      {selectedImage.site_name || site.namesite || "Unknown site"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Caption
                    </p>
                    <p className="text-base font-medium text-[#254431]">
                      {selectedImage.caption || "No caption"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Identifier
                    </p>
                    <p className="text-sm text-[#4B5563] leading-6 break-words">
                      {selectedImage.identifier || "No identifier"}
                    </p>
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
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Filename
                    </p>
                    <p className="text-sm text-[#4B5563] break-all">
                      {selectedImage.filename}
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

    </div>
    </ProtectedRoute>
  );
}