'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSitesOnline, SiteSummary } from '@/utils/supabase/queries';
import { Search, MapPin, Calendar, Leaf, ArrowUpDown, AlertCircle, ChevronRight, ClipboardList, TrendingUp, Clock, Settings, Edit, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import AdminNavBar from '../AdminNavBar';
import ProtectedRoute from '@/components/ProtectedRoute';

type UnifiedSite = SiteSummary;

const MSEC_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / MSEC_PER_DAY);
}

export function formatAgeBadge(days: number): string {
  if (!days || days < 0) return 'New';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}yr ago`;
}

export function getInspectionStatus(days: number): { label: string; color: string; bgColor: string } {
  if (days < 180) return { label: 'Recently Visited', color: '#1C7C4D', bgColor: '#E4EBE4' };
  if (days <= 365) return { label: 'Visited This Year', color: '#E0A63A', bgColor: '#FEF3C7' };
  if (days <= 730) return { label: 'Visited Recently', color: '#C76930', bgColor: '#FED7AA' };
  return { label: 'Needs Review', color: '#7A8075', bgColor: '#E4EBE4' };
}

export default function AdminSitesPage() {
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

  // Close sort menu when clicking outside
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
    const needsAttention = sites.filter(s => daysSince(s.inspectdate ?? '1900-01-01') > 730).length;
    
    return { totalSites, totalInspections, activeThisYear, needsAttention };
  }, [sites]);

  // Handle Back Button Navigation
  const handleBack = () => {
    const stack: string[] = JSON.parse(sessionStorage.getItem('navStack') || '[]')

    if (stack.length > 1) {
      stack.pop() // remove current page
      const previous = stack[stack.length - 1]
      stack.pop() // remove previous since we're navigating there
      sessionStorage.setItem('navStack', JSON.stringify(stack))
      router.push(previous)
    } else {
      stack.pop() // clear current page before navigating to fallback
      sessionStorage.setItem('navStack', JSON.stringify(stack))
      router.push('/sites')
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading protected areas...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            {/* Back button */}
            <button
              onClick = {handleBack}
              className="flex items-center gap-1.5 text-[#86A98A] hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center justify-between mb-3">
              {/* Left: icon + title + subtitle */}
              <div className="flex items-cesitesnter gap-4">
                <Image
                  src="/images/sapaa-icon-white.png"
                  alt="SAPAA"
                  width={140}
                  height={140}
                  priority
                  className="h-16 w-auto flex-shrink-0 opacity-100 mt-1"
                />
                <div>
                  <h1 className="text-3xl font-bold mt-3">Admin: Protected Areas</h1>
                  <p className="text-[#E4EBE4] text-base mt-0.5">
                    Manage and monitor site inspections across Alberta
                  </p>
                </div>
              </div>
              {/* Right: navbar — rendered inline, bg overridden to transparent */}
              <div className="[&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:shadow-none [&>nav]:px-0 [&>nav]:py-0">
                <AdminNavBar />
              </div>
            </div>
          </div>
        </div> 

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Total sites */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center">
                  <MapPin className = "w-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Total Sites</div>
                  <div className="text-3xl font-bold text-[#254431]">{stats.totalSites}</div>
                </div>
              </div>  
            </div>

            {/* Total Inspections */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Total Inspections</div>
                  <div className="text-3xl font-bold text-[#254431]">{stats.totalInspections}</div>
                </div>
              </div>  
            </div>

            {/* Active This Year */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Active This Year</div>
                  <div className="text-3xl font-bold text-[#254431]">{stats.activeThisYear}</div>
                </div>
              </div>  
            </div>

            {/* Needs Attention */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Needs Attention</div>
                  <div className="text-3xl font-bold text-[#254431]">{stats.needsAttention}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="mb-6 space-y-4">
            <div className="relative">
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
              <div className="relative sort-menu-container">
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
                const ageText = formatAgeBadge(age);
                const status = getInspectionStatus(age);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] hover:border-[#86A98A] hover:shadow-lg transition-all group relative"
                  >
                    <button
                      onClick={() => router.push(`/admin/sites/${encodeURIComponent(item.namesite)}`)}
                      className="w-full text-left"
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
                            {item.inspectdate
                              ? new Date(item.inspectdate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'No inspection date'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold"
                            style={{ color: status.color, backgroundColor: status.bgColor }}
                          >
                            {status.label}
                          </span>
                          <span className="text-xs font-medium text-[#7A8075]">
                            {ageText}
                          </span>
                        </div>
                      </div>
                    </button>
                    
                    {/* Admin Actions */}
                    <div className="mt-4 pt-4 border-t border-[#E4EBE4] flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/sites/${encodeURIComponent(item.namesite)}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431] rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Admin View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/detail/${item.namesite}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border-2 border-[#E4EBE4] hover:border-[#86A98A] text-[#254431] rounded-lg text-sm font-medium transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                        User View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}