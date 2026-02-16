"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getInspectionDetailsOnline,
  getSiteByName,
  SiteSummary,
  InspectionDetail,
} from "@/utils/supabase/queries";
import { daysSince } from "@/app/sites/page";
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
  X
} from "lucide-react";
import Image from 'next/image';

type ViewMode = 'by-date' | 'by-question';

interface ParsedQuestion {
  questionId: string;
  questionText: string;
}

interface QuestionComparison {
  questionId: string;
  questionText: string; 
  answers: Array<{
    inspectionId: number;
    date: string;        
    displayDate: string; 
    answer: string;
  }>;
}

export default function SiteDetailScreen() {
  const params = useParams<{ namesite: string }>();
  const router = useRouter();
  const namesite = decodeURIComponent(params.namesite);

  const [inspections, setInspections] = useState<InspectionDetail[]>([]);
  const [site, setSite] = useState<SiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInspections, setExpandedInspections] = useState<Set<number>>(new Set());
  const [selectedInspection, setSelectedInspection] = useState<InspectionDetail | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('by-date');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const siteData = await getSiteByName(namesite);
        const details = await getInspectionDetailsOnline(siteData[0].namesite);
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

  const computeAverageNaturalness = (items: InspectionDetail[]) => {
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

  const parseQuestions = (notes: string | null): ParsedQuestion[] => {
    if (!notes) return [];
    const observations = notes.split('; ').filter(obs => obs.trim() !== '');
    return observations.map(obs => {
      const match = obs.match(/^(Q\d+)[_:\s]+(.*)/);
      if (match) {
        return { questionId: match[1], questionText: match[2].trim() };
      }
      return { questionId: 'Q??', questionText: obs.trim() };
    });
  };

  const normalizeScore = (score: string | null): string => {
    if (!score || score.trim() === '') return 'N/A';
    const trimmed = score.trim();
    if (trimmed.toLowerCase() === 'cannot answer') return 'Cannot Answer';
    return trimmed;
  };

  const questionComparisons = useMemo((): QuestionComparison[] => {
    const questionMap = new Map<
      string,
      { label: string; answers: QuestionComparison["answers"] }
    >();
  
    inspections.forEach((inspection) => {
      const questions = parseQuestions(inspection.notes);
  
      questions.forEach((q) => {
        const [rawLabel, ...rest] = q.questionText.split(":");
        const label = rawLabel.trim();
        const answerText = rest.join(":").trim();
  
        if (!questionMap.has(q.questionId)) {
          questionMap.set(q.questionId, { label, answers: [] });
        }
  
        const entry = questionMap.get(q.questionId)!;
  
        entry.answers.push({
          inspectionId: inspection.id,
          date: inspection.inspectdate || '',
          displayDate: inspection.inspectdate ? new Date(inspection.inspectdate).toLocaleDateString() : 'N/A',
          answer: answerText || q.questionText,
        });
      });
    });
  
    const result: QuestionComparison[] = Array.from(
      questionMap.entries()
    ).map(([questionId, { label, answers }]) => {
      const sortedAnswers = answers.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  
      return {
        questionId,
        questionText: label || questionId,
        answers: sortedAnswers,
      };
    });
  
    return result.sort((a, b) => {
      const numA = parseInt(a.questionId.replace("Q", ""));
      const numB = parseInt(b.questionId.replace("Q", ""));
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
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
            className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Back to Sites
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
            onClick={() => router.push('/sites')}
            className="flex items-center gap-2 text-[#E4EBE4] hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Sites</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1 flex items-start gap-4">
              {/* Logo */}
              <Image 
                src="/images/sapaa-icon-white.png" 
                alt="SAPAA"
                width={48}
                height={48}
                className="w-12 h-12 flex-shrink-0"
              />
              
              <div>
                <h1 className="text-3xl font-bold mb-3">{site.namesite}</h1>
                
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
            </div>

            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
              <div className="text-sm text-[#E4EBE4]">Last Visit</div>
              <div className="text-xl font-bold">{ageText}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
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

            {/* Gradient Bar */}
            <div className="relative mb-4">
              <div className="h-8 rounded-full overflow-hidden bg-gradient-to-r from-[#B91C1C] via-[#E0A63A] via-[#84CC16] to-[#1C7C4D] shadow-inner"></div>
              
              {/* Indicator */}
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

            {/* Labels */}
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

        {/* New Report Button */}
        <div className="mt-4">
          <button
            onClick={() => router.push(`/detail/${params.namesite}/new-report`)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-lg">New Site Inspection Report</span>
          </button>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'by-date' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#254431] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#356B43]" />
              Inspection Reports ({inspections.length})
            </h2>
            
            {inspections.map((inspection) => {
              const isExpanded = expandedInspections.has(inspection.id);
              const questions = parseQuestions(inspection.notes);
              
              return (
                <div key={inspection.id} className="bg-white rounded-2xl border-2 border-[#E4EBE4] overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <button
                    onClick={() => toggleInspection(inspection.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-[#F7F2EA] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#E4EBE4] rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-[#356B43]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#254431]">
                          {inspection.inspectdate ? new Date(inspection.inspectdate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </h3>
                        <p className="text-sm text-[#7A8075]">Score: {normalizeScore(inspection.naturalness_score)}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-[#7A8075]" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-[#7A8075]" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 border-t-2 border-[#E4EBE4] pt-4">
                      {inspection.steward && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-1">Steward</p>
                          <p className="text-[#1E2520]">{inspection.steward}</p>
                        </div>
                      )}
                      
                      {inspection.naturalness_details && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-1">Naturalness Details</p>
                          <p className="text-[#1E2520]">{inspection.naturalness_details}</p>
                        </div>
                      )}

                      {questions.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-[#7A8075] mb-2">Observations</p>
                          <div className="space-y-2">
                            {questions.map((q, idx) => (
                              <div key={idx} className="bg-[#F7F2EA] rounded-lg p-3">
                                <span className="font-semibold text-[#356B43]">{q.questionId}:</span>{' '}
                                <span className="text-[#1E2520]">{q.questionText}</span>
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
                        <span className="text-lg font-bold text-[#356B43]">{qComp.questionId}</span>
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

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-[#254431]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b-2 border-[#E4EBE4]">
              <h2 className="text-2xl font-bold text-[#254431]">Inspection Report</h2>
              <button
                onClick={() => setSelectedInspection(null)}
                className="w-10 h-10 rounded-xl hover:bg-[#E4EBE4] flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-[#7A8075]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
              {/* Modal content */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}