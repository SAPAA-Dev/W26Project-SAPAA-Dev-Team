'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllSites, getCounties, updateSite, toggleSiteActive, getTotalInspectionCount, SiteSummary, County } from '@/utils/supabase/queries';
import { Search, MapPin, Calendar, Leaf, ArrowUpDown, AlertCircle, ChevronRight, ClipboardList, TrendingUp, Clock, Settings, Edit, Pencil, ArrowLeft, Download } from 'lucide-react';
import EditSiteModal from './components/EditSiteModal';
import Image from 'next/image';
import AdminNavBar from '../AdminNavBar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PdfExportModal from '@/components/PdfExportModal';

type UnifiedSite = SiteSummary;

const MSEC_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / MSEC_PER_DAY);
}

export function formatAgeBadge(days: number, inspectDate: string | null): string | null {
  if (!inspectDate || inspectDate === '1900-01-01') return null;
  
  if (days <= 0) return 'New';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}yr${years > 1 ? 's' : ''} ago`;
}

export function getInspectionStatus(days: number, inspectDate: string | null): { label: string; color: string; bgColor: string } {
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
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [showPdfModal, setShowPdfModal] = useState(false);

  useEffect(() => {
    getTotalInspectionCount().then(setTotalResponses).catch(() => {});
  }, []);
  const [editSite, setEditSite] = useState<SiteSummary | null>(null);
  const [counties, setCounties] = useState<County[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSites = async () => {
      setLoading(true);
      try {
        const [allSites, countyList] = await Promise.all([
          getAllSites(),
          getCounties(),
        ]);
        setSites(allSites);
        setCounties(countyList);
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
    const needsAttention = sites.filter(s => 
      s.inspectdate && 
      s.inspectdate !== '1900-01-01' && 
      daysSince(s.inspectdate) > 730
    ).length;
    
    return { totalSites, totalInspections, totalResponses, activeThisYear, needsAttention };
  }, [sites]);

  const handleSaveSite = async (data: { id: number; namesite: string; ab_county: number | null; is_active: boolean }) => {
    setSaving(true);
    try {
      const currentSite = sites.find((s) => s.id === data.id);
      await updateSite(data.id, data.namesite, data.ab_county);
      if (currentSite && currentSite.is_active !== data.is_active) {
        await toggleSiteActive(data.id, data.is_active);
      }
      const countyObj = counties.find((c) => c.id === data.ab_county);
      setSites((prev) =>
        prev.map((s) =>
          s.id === data.id
            ? { ...s, namesite: data.namesite, ab_county: data.ab_county, county: countyObj?.county ?? null, is_active: data.is_active }
            : s
        )
      );
      setEditSite(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update site');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-4 sm:px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            {/* Back button */}
            <button
              onClick = {handleBack}
              className="flex items-center gap-1.5 text-[#86A98A] hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3">
              {/* Left: icon + title + subtitle */}
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
                  <h1 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3 leading-tight">Admin: Protected Areas</h1>
                  <p className="text-[#E4EBE4] text-sm sm:text-base mt-0.5 max-w-md">
                    Manage and monitor site inspections across Alberta
                  </p>
                </div>
              </div>
              {/* Right: navbar — rendered inline, bg overridden to transparent */}
              <div className="w-full sm:w-auto [&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:shadow-none [&>nav]:px-0 [&>nav]:py-0">
                <AdminNavBar />
              </div>
            </div>
          </div>
          </div>
        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 mt-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-[#356B43]" />
                <div className="text-xs text-[#7A8075] font-medium uppercase tracking-wide">Total Sites</div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{stats.totalInspections}</div>
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
              <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{stats.totalResponses}</div>
            </div>

            <div className="bg-[#D1FAE5] rounded-xl p-4 border-2 border-[#065F46]/20 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-[#065F46]" />
                <div className="text-xs text-[#065F46] font-medium uppercase tracking-wide">Active over 365 Days</div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#065F46]">{stats.activeThisYear}</div>
            </div>

            <div className="bg-[#FEE2E2] rounded-xl p-4 border-2 border-[#B91C1C]/20 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#B91C1C]" />
                <div className="text-xs text-[#B91C1C] font-medium uppercase tracking-wide">Needs Attention</div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#7F1D1D]">{stats.needsAttention}</div>
            </div>
          </div>
        </div> 
            
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Search and Sort */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8075]" />
              <input
                type="text"
                placeholder="Search by site name or county..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-[#7A8075] font-medium">
                  {filteredSites.length} {filteredSites.length === 1 ? 'site' : 'sites'} found
                </p>
                {filteredSites.length > 0 && (
                  <button
                    onClick={() => setShowPdfModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#254431] font-medium hover:bg-[#F7F2EA] hover:border-[#86A98A] transition-all shadow-sm"                 
                 >
                    <Download className="w-4 h-4" />
                    Bulk PDF
                  </button>
                )}
              </div>
              <div className="relative sort-menu-container w-full sm:w-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((item) => {
                const age = daysSince(item.inspectdate ?? '1900-01-01');
                const ageText = formatAgeBadge(age, item.inspectdate);
                const status = getInspectionStatus(age, item.inspectdate);

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-4 sm:p-6 border-2 transition-all group relative ${
                      item.is_active
                        ? 'bg-white border-[#E4EBE4] hover:border-[#86A98A] hover:shadow-lg'
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}
                  >
                    {!item.is_active && (
                      <span className="absolute top-3 right-3 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                    <button
                      onClick={() => router.push(`/admin/sites/${encodeURIComponent(item.namesite)}`)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className={`text-base sm:text-lg font-bold mb-1 leading-snug transition-colors ${
                            item.is_active
                              ? 'text-[#254431] group-hover:text-[#356B43]'
                              : 'text-gray-500'
                          }`}>
                            {item.namesite}
                          </h3>
                          {item.county && (
                            <div className="flex items-start sm:items-center gap-1.5 text-[#7A8075]">
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

                        <div className="flex items-start sm:items-center justify-between gap-3">
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
                    <div className="mt-4 pt-4 border-t border-[#E4EBE4] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        data-testid={`edit-site-button-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditSite(item);
                        }}
                        className="flex items-center justify-center p-2 bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431] rounded-lg transition-colors"
                        title="Edit site"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
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

      {/* Bulk PDF Export Modal */}
      <PdfExportModal
        open={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        mode="multi-site"
        siteNames={filteredSites.map(s => s.namesite)}
      />

      <EditSiteModal
        visible={!!editSite}
        site={editSite}
        counties={counties}
        onClose={() => setEditSite(null)}
        onSave={handleSaveSite}
        saving={saving}
      />
    </ProtectedRoute>
  );
}
