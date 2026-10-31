'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getArchivedSites,
  restoreSite,
  permanentlyDeleteSite,
  getSiteDeleteImpact,
  SiteSummary,
  SiteDeleteImpact,
} from '@/utils/supabase/queries';
import {
  Search,
  MapPin,
  Calendar,
  Archive,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import AdminNavBar from '../../AdminNavBar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PermanentDeleteSiteModal from '../components/PermanentDeleteSiteModal';

export default function ArchivedSitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  //Permanent deletion states
  const [deleteTarget, setDeleteTarget] = useState<SiteSummary | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<SiteDeleteImpact | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadingDeleteImpact, setLoadingDeleteImpact] = useState(false);
  const [deletingSite, setDeletingSite] = useState(false);

  useEffect(() => {
    const loadSites = async () => {
      setLoading(true);
      try {
        setSites(await getArchivedSites());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading archived sites';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadSites();
  }, []);

  const filteredSites = useMemo(() => {
    const lower = search.toLowerCase();
    return sites.filter(
      (s) =>
        s.namesite.toLowerCase().includes(lower) ||
        (s.county && s.county.toLowerCase().includes(lower))
    );
  }, [sites, search]);

  const handleRestore = async (site: SiteSummary) => {
    setRestoringId(site.id);
    setActionError(null);

    try {
      await restoreSite(site.id);
      setSites((currentSites) =>
        currentSites.filter((currentSite) => currentSite.id !== site.id)
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to restore site'
      );
    } finally {
      setRestoringId(null);
    }
  };

  const handleOpenDelete = async (site: SiteSummary) => {
    setDeleteTarget(site);
    setDeleteImpact(null);
    setDeleteError(null);
    setLoadingDeleteImpact(true);

    try {
      const impact = await getSiteDeleteImpact(site.id);
      setDeleteImpact(impact);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Failed to load site details'
      );
    } finally {
      setLoadingDeleteImpact(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingSite(true);
    setDeleteError(null);

    try {
      await permanentlyDeleteSite(deleteTarget.id);

      setSites((currentSites) =>
        currentSites.filter((site) => site.id !== deleteTarget.id)
      );

      setDeleteTarget(null);
      setDeleteImpact(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Failed to permanently delete site'
      );
    } finally {
      setDeletingSite(false);
    }
  };

  const handleCloseDelete = () => {
    if (deletingSite) return;

    setDeleteTarget(null);
    setDeleteImpact(null);
    setDeleteError(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#B91C1C]" />
          </div>
          <h2 className="text-2xl font-bold text-[#254431] mb-2">Unable to Load Archived Sites</h2>
          <p className="text-[#5B655D] mb-6">{error}</p>
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
        <p className="text-[#5B655D] font-medium">Loading archived sites...</p>
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
              onClick={() => router.push('/admin/sites')}
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
                  <h1 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3 leading-tight">Admin: Archived Sites</h1>
                  <p className="text-[#E4EBE4] text-sm sm:text-base mt-0.5 max-w-md">
                    Restore archived sites or permanently delete them
                  </p>
                </div>
              </div>
              {/* Right: navbar - rendered inline, bg overridden to transparent */}
              <div className="w-full sm:w-auto [&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:shadow-none [&>nav]:px-0 [&>nav]:py-0">
                <AdminNavBar />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Search */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5B655D]" />
              <input
                type="text"
                placeholder="Search by site name or county..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#1E2520] placeholder:text-[#5B655D] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <p className="text-[#5B655D] font-medium">
              {filteredSites.length} {filteredSites.length === 1 ? 'site' : 'sites'} archived
            </p>
          </div>

          {actionError && (
            <p role="alert" className="mb-4 text-sm text-red-700">
              {actionError}
            </p>
          )}

          {/* Archived Sites Grid */}
          {filteredSites.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#E4EBE4] rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="w-10 h-10 text-[#5B655D]" />
              </div>
              <h3 className="text-xl font-bold text-[#254431] mb-2">No archived sites</h3>
              <p className="text-[#5B655D]">Archived sites will show up here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 sm:p-6 border-2 bg-white border-[#E4EBE4] transition-all group relative"
                >
                  <span className="absolute top-3 right-3 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Archived
                  </span>
                  <div className="mb-4">
                    <h3 className="text-base sm:text-lg font-bold mb-1 leading-snug text-[#254431]">
                      {item.namesite}
                    </h3>
                    {item.county && (
                      <div className="flex items-start sm:items-center gap-1.5 text-[#5B655D]">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{item.county}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[#5B655D]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Archived{' '}
                        {item.archived_at
                          ? new Date(item.archived_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'unknown date'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#5B655D]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {item.inspectdate
                          ? `Last inspection ${new Date(item.inspectdate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}`
                          : 'No inspection date'}
                      </span>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="mt-4 pt-4 border-t border-[#E4EBE4] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      data-testid={`restore-site-button-${item.id}`}
                      onClick={() => void handleRestore(item)}
                      disabled={restoringId === item.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {restoringId === item.id ? 'Restoring...' : 'Restore'}
                    </button>
                    <button
                      type="button"
                      data-testid={`permanent-delete-site-button-${item.id}`}
                      onClick={() => void handleOpenDelete(item)}
                      className="flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100"
                      title="Permanently delete site"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PermanentDeleteSiteModal
        site={deleteTarget}
        impact={deleteImpact}
        loading={loadingDeleteImpact}
        deleting={deletingSite}
        error={deleteError}
        onCancel={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </ProtectedRoute>
  );
}
