'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSitesOnline, getTotalInspectionCount, SiteSummary } from '@/utils/supabase/queries';
import { Award, Search, MapPin, Calendar, ArrowUpDown, AlertCircle, ChevronRight, ClipboardList, TrendingUp, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { Suspense } from "react";
import { SubmissionToast } from "./SubmissionToast";
import UploadImages from "@/components/UploadImages";
import dynamic from 'next/dynamic';
import HelpMenu from '@/components/HelpMenu';
import { sitesDashboardSteps } from '@/components/TutorialOverlay';

const TutorialOverlay = dynamic(() => import('@/components/TutorialOverlay'), { ssr: false });

type UnifiedSite = SiteSummary;

const MSEC_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / MSEC_PER_DAY);
}

// Check if date is missing or set to the "never inspected" placeholder
function formatAgeBadge(days: number, inspectDate: string | null): string | null {
  if (!inspectDate || inspectDate === '1900-01-01') return null;
  
  if (days <= 0) return 'New';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}yr${years > 1 ? 's' : ''} ago`;
}

function getInspectionStatus(days: number, inspectDate: string | null): { label: string; color: string; bgColor: string } {
  if (!inspectDate || inspectDate === '1900-01-01') {
    return { label: 'Never Inspected', color: '#475569', bgColor: '#F1F5F9' };
  }
  if (days < 180) {
    return { label: 'Recent', color: '#065F46', bgColor: '#D1FAE5' };
  }
  if (days <= 365) {
    return { label: 'Past Year', color: '#92400E', bgColor: '#FEF3C7' };
  }
  if (days <= 730) {
    return { label: 'Over 1 Year', color: '#9A3412', bgColor: '#FFEDD5' };
  }
  return { label: 'Needs Review', color: '#7F1D1D', bgColor: '#FEE2E2' };
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

export default function HomeClient() {
  const router = useRouter();
  const [sites, setSites] = useState<UnifiedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<{ field: 'name' | 'date'; direction: 'asc' | 'desc' }>({
    field: 'name',
    direction: 'asc',
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name:string; avatar:string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [forceTutorial, setForceTutorial] = useState(false);

  const handleStartTutorial = useCallback(() => {
    setForceTutorial(false);
    // Defer so state resets before Joyride re-mounts
    setTimeout(() => setForceTutorial(true), 50);
  }, []);

  const handleTutorialFinish = useCallback(() => {
    setForceTutorial(false);
  }, []);

  useEffect(() => {
    getTotalInspectionCount().then(setTotalResponses).catch(() => {});
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
    const loadSites = async () => {
      setLoading(true);
      try {
        const onlineSites = await getSitesOnline();
        setSites(onlineSites);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading sites';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadSites();
  }, []);

  const filteredSites = useMemo(() => {
    const lower = search.toLowerCase();
    const filtered = sites.filter(
      (s) =>
        s.namesite.toLowerCase().includes(lower) ||
        (s.county && s.county.toLowerCase().includes(lower))
    );

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy.field === 'name') comparison = a.namesite.localeCompare(b.namesite);
      else {
        const da = a.inspectdate ?? '1900-01-01';
        const db = b.inspectdate ?? '1900-01-01';
        comparison = new Date(db).getTime() - new Date(da).getTime();
      }
      return sortBy.direction === 'asc' ? comparison : -comparison;
    });
  }, [sites, search, sortBy]);

  const stats = useMemo(() => {
    const totalSites = sites.length;
    
    // Count total inspections (sites with inspection dates)
    const totalInspections = sites.filter(s => s.inspectdate && s.inspectdate !== '1900-01-01').length;
    
    // Active this year (< 365 days)
    const activeThisYear = sites.filter(s => daysSince(s.inspectdate ?? '1900-01-01') <= 365).length;
    
    // Needs attention (> 730 days / 2 years)
    const needsAttention = sites.filter(s => 
      s.inspectdate && 
      s.inspectdate !== '1900-01-01' && 
      daysSince(s.inspectdate) > 730
    ).length;
    
    return { totalSites, totalInspections, totalResponses, activeThisYear, needsAttention };
  }, [sites]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#B91C1C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Unable to Load Sites</h2>
          <p className="text-[#7A8075] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading protected areas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">

      {/* Tutorial Overlay — auto-starts on first visit, re-runs on forceRun */}
      {!loading && !userLoading && (
        <TutorialOverlay
          key={forceTutorial ? 'force' : 'auto'}
          steps={sitesDashboardSteps}
          tutorialKey="sites"
          userId={currentUser?.email ?? null}
          forceRun={forceTutorial}
          onFinish={handleTutorialFinish}
        />
      )}

    <div id="tutorial-header" className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
      <Suspense fallback={null}>
          <SubmissionToast />
        </Suspense>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mt-2.5 mb-3">

          {/* Left: icon + SAPAA info */}
          <div className="flex items-start gap-4 mb-2">
            <Image
              src="/images/sapaa-full-white.png"
              alt="SAPAA"
              width={140}
              height={140}
              priority
              className="h-16 w-auto flex-shrink-0 opacity-100"
            />
          </div>

          {/* Right: Admin + Help buttons */}
          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-[#356B43] hover:bg-[#254431] mt-2 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all"
              >
                <Award className="w-5 h-5" />
                Admin
              </button>
            )}
            <HelpMenu onStartTutorial={handleStartTutorial} />
          </div>

        </div>
      </div>
    </div>
        
    {/* Stats Cards */}
    <div id="tutorial-stats" className="max-w-7xl mx-auto px-6 py-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-[#356B43]" />
            <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Total Sites</div>
          </div>
          <div className="text-3xl font-bold text-[#254431]">{stats.totalSites}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-[#356B43]" />
            <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Total Inspected Sites</div>
          </div>
          <div className="text-3xl font-bold text-[#254431]">{stats.totalInspections}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-[#356B43]" />
            <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Total Responses</div>
          </div>
          <div className="text-3xl font-bold text-[#254431]">{stats.totalResponses}</div>
        </div>

        <div className="bg-[#D1FAE5] rounded-xl p-4 border-2 border-[#065F46]/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#065F46]" />
            <div className="text-xs text-[#065F46] font-medium uppercase tracking-wide">Active over 365 Days</div>
          </div>
          <div className="text-3xl font-bold text-[#065F46]">{stats.activeThisYear}</div>
        </div>

        <div className="bg-[#FEE2E2] rounded-xl p-4 border-2 border-[#B91C1C]/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-[#B91C1C]" />
            <div className="text-xs text-[#B91C1C] font-medium uppercase tracking-wide">Needs Attention</div>
          </div>
          <div className="text-3xl font-bold text-[#7F1D1D]">{stats.needsAttention}</div>
        </div>
      </div>
    </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Sort */}
        <div className="mb-6 space-y-4">
          <div id="tutorial-search" className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8075]" />
            <input
              type="text"
              placeholder="Search by site name or county..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[#7A8075] font-medium">
              {filteredSites.length} {filteredSites.length === 1 ? 'site' : 'sites'} found
            </p>
            <div id="tutorial-sort" className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#254431] font-medium hover:bg-[#F7F2EA] hover:border-[#86A98A] transition-all shadow-sm"
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-[#E4EBE4] overflow-hidden z-10">
                  <button
                    onClick={() => {
                      setSortBy({ field: 'name', direction: 'asc' });
                      setShowSortMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors border-b border-[#E4EBE4]"
                  >
                    Name (A-Z)
                  </button>
                  <button
                    onClick={() => {
                      setSortBy({ field: 'name', direction: 'desc' });
                      setShowSortMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors border-b border-[#E4EBE4]"
                  >
                    Name (Z-A)
                  </button>
                  <button
                    onClick={() => {
                      setSortBy({ field: 'date', direction: 'asc' });
                      setShowSortMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors border-b border-[#E4EBE4]"
                  >
                    Most Recent
                  </button>
                  <button
                    onClick={() => {
                      setSortBy({ field: 'date', direction: 'desc' });
                      setShowSortMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#F7F2EA] text-[#1E2520] transition-colors"
                  >
                    Oldest First
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sites Grid */}
        <div id="tutorial-site-list">
        {filteredSites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#E4EBE4] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-[#7A8075]" />
            </div>
            <h3 className="text-xl font-bold text-[#254431] mb-2">No sites found</h3>
            <p className="text-[#7A8075]">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((item) => {
              const age = daysSince(item.inspectdate ?? '1900-01-01');
              const ageText = formatAgeBadge(age, item.inspectdate);
              const status = getInspectionStatus(age, item.inspectdate);
              const hasDate = item.inspectdate && item.inspectdate !== '1900-01-01';

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(`/detail/${item.namesite}`)}
                  className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] hover:border-[#86A98A] hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#254431] mb-1 group-hover:text-[#356B43] transition-colors">
                        {item.namesite}
                      </h3>
                      {item.county && (
                        <div className="flex items-center gap-1.5 text-[#7A8075]">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{item.county}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#7A8075] group-hover:text-[#356B43] group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[#7A8075]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {hasDate
                          ? new Date(item.inspectdate!).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Never inspected'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ color: status.color, backgroundColor: status.bgColor }}
                      >
                        {status.label}
                      </span>
                      
                      {ageText && (
                        <span className="text-xs font-medium text-[#7A8075]">
                          {ageText}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            <UploadImages />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}