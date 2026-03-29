'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSitesOnline, getTotalInspectionCount, SiteSummary } from '@/utils/supabase/queries';
import { Award, Search, MapPin, Calendar, Home, Leaf, ArrowUpDown, AlertCircle, ChevronRight, ClipboardList, TrendingUp, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { Suspense } from "react";
import { SubmissionToast } from "./SubmissionToast";
import ProtectedRoute from "@/components/ProtectedRoute";
import UploadImages from "@/components/UploadImages";
import { logout } from "@/services/auth";
import dynamic from 'next/dynamic';
import { sitesDashboardSteps } from '@/components/TutorialOverlay';
import UserNavBar from "@/components/HeaderDropdown";

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
      return null;
    }
    
    const email = session.user.email ?? '';
    const role = session.user.user_metadata?.role ?? 'steward';
    const name  = session.user.user_metadata?.full_name ?? '';
    const avatar = session.user.user_metadata?.avatar_url ?? '';
    
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
  const [menuOpen, setMenuOpen] = useState(false); 
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  
  const [forceTutorial, setForceTutorial] = useState(false);

  const handleStartTutorial = useCallback(() => {
    setForceTutorial(false);
    setTimeout(() => setForceTutorial(true), 50);
  }, []);

  const handleTutorialFinish = useCallback(() => {
    setForceTutorial(false);
  }, []);


  useEffect(() => {
    getTotalInspectionCount().then(setTotalResponses).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSortMenu && !target.closest('.sort-menu-container')) {
        setShowSortMenu(false);
      }
    };
  
    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSortMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (activeTooltip !== null && !target.closest('.stat-card')) {
        setActiveTooltip(null);
      }
    };
  
    if (activeTooltip !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeTooltip]);
  
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
    <ProtectedRoute>

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
      
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo + title */}
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
              <h1 className="text-3xl font-bold mt-3">Protected Areas</h1>
              <p className="text-[#E4EBE4] text-base mt-0.5">
                Monitor and track site inspections across Alberta
              </p>
            </div>
          </div>

          <UserNavBar/>
      

        </div>
      </div>
        
    {/* Stats Cards */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[
        {
          icon: <MapPin className="w-5 h-5 text-[#356B43]" />,
          label: 'Total Sites',
          value: stats.totalSites,
          tooltip: 'Total number of protected area sites in the system.',
          bg: 'bg-white', border: 'border-[#E4EBE4]',
          textColor: 'text-[#254431]', labelColor: 'text-[#7A8075]',
          tooltipBg: 'bg-white', tooltipText: 'text-[#254431]', tooltipBorder: 'border-[#E4EBE4]', arrowColor: 'border-t-white',
        },
        {
          icon: <ClipboardList className="w-5 h-5 text-[#356B43]" />,
          label: 'Total Inspected Sites',
          value: stats.totalInspections,
          tooltip: 'Sites that have had at least one inspection recorded.',
          bg: 'bg-white', border: 'border-[#E4EBE4]',
          textColor: 'text-[#254431]', labelColor: 'text-[#7A8075]',
          tooltipBg: 'bg-white', tooltipText: 'text-[#254431]', tooltipBorder: 'border-[#E4EBE4]', arrowColor: 'border-t-white',
        },
        {
          icon: <ClipboardList className="w-5 h-5 text-[#356B43]" />,
          label: 'Total Responses',
          value: stats.totalResponses,
          tooltip: 'Total inspection form submissions across all sites.',
          bg: 'bg-white', border: 'border-[#E4EBE4]',
          textColor: 'text-[#254431]', labelColor: 'text-[#7A8075]',
          tooltipBg: 'bg-white', tooltipText: 'text-[#254431]', tooltipBorder: 'border-[#E4EBE4]', arrowColor: 'border-t-white',
        },
        {
          icon: <TrendingUp className="w-5 h-5 text-[#065F46]" />,
          label: 'Active over 365 Days',
          value: stats.activeThisYear,
          tooltip: 'Sites inspected within the last 365 days, considered actively monitored.',
          bg: 'bg-[#D1FAE5]', border: 'border-[#065F46]/20',
          textColor: 'text-[#065F46]', labelColor: 'text-[#065F46]',
          tooltipBg: 'bg-[#D1FAE5]', tooltipText: 'text-[#065F46]', tooltipBorder: 'border-[#065F46]/20', arrowColor: 'border-t-[#D1FAE5]',
        },
        {
          icon: <Clock className="w-5 h-5 text-[#B91C1C]" />,
          label: 'Needs Attention',
          value: stats.needsAttention,
          tooltip: 'Sites last inspected over 2 years ago, requires a follow-up visit.',
          bg: 'bg-[#FEE2E2]', border: 'border-[#B91C1C]/20',
          textColor: 'text-[#7F1D1D]', labelColor: 'text-[#B91C1C]',
          tooltipBg: 'bg-[#FEE2E2]', tooltipText: 'text-[#7F1D1D]', tooltipBorder: 'border-[#B91C1C]/20', arrowColor: 'border-t-[#FEE2E2]',
        },
      ].map((card, i) => (
        <div
          key={i}
          className={`stat-card relative group ${card.bg} rounded-xl p-4 sm:p-5 border-2 ${card.border} shadow-sm cursor-pointer`}
          onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
        >
          {/* Tooltip */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 ${card.tooltipBg} ${card.tooltipText} border-2 ${card.tooltipBorder} text-xs rounded-xl px-3 py-2 text-center
            transition-opacity duration-200 pointer-events-none z-10 shadow-lg
            ${activeTooltip === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {card.tooltip}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${card.arrowColor}`} />
          </div>

          <div className="flex items-center gap-2 mb-2">
            {card.icon}
            <div className={`text-xs ${card.labelColor} font-medium uppercase tracking-wide`}>{card.label}</div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold ${card.textColor}`}>{card.value}</div>
        </div>
      ))}
    </div>
    </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search and Sort */}
        <div className="mb-6 space-y-4">
         <div id="tutorial-search" className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8075]" />
            <input
              type="text"
              placeholder="Search by site name or county..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all shadow-sm"            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[#7A8075] font-medium">
              {filteredSites.length} {filteredSites.length === 1 ? 'site' : 'sites'} found
            </p>
             <div id="tutorial-sort" className="relative sort-menu-container">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#254431] font-medium hover:bg-[#F7F2EA] hover:border-[#86A98A] transition-all shadow-sm"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSites.map((item) => {
              const age = daysSince(item.inspectdate ?? '1900-01-01');
              const ageText = formatAgeBadge(age, item.inspectdate);
              const status = getInspectionStatus(age, item.inspectdate);
              const hasDate = item.inspectdate && item.inspectdate !== '1900-01-01';

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(`/detail/${item.namesite}`)}
                  className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#E4EBE4] hover:border-[#86A98A] hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-[#254431] mb-1 group-hover:text-[#356B43] transition-colors leading-snug">
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
    </ProtectedRoute>
  );
}