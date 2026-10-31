"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Link from "next/link";
import {
  FileText,
  Calendar,
  BarChart3,
  ImageIcon,
  PieChart,
  ArrowLeft
} from "lucide-react";
import Image from 'next/image';
import { getTotalInspectionCount, getLastInspectionDate, getNaturalnessDistribution, getTopSitesDistribution } from '@/utils/supabase/queries';
import AdminNavBar from "../AdminNavBar";
import ExportAllFilesButton from "@/components/ExportAllFilesButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from 'next/navigation';

ChartJS.register(ArcElement, Tooltip, Legend);

type GalleryItem = {
  id: string;
  response_id?: string | null;
  question_id?: string | null;
  caption?: string | null;
  identifier?: string | null;
  date?: string | null;
  storage_key: string;
  file_size_bytes?: number | null;
  imageUrl: string;
  content_type?: string | null;
  photographer?: string | null;
  filename?: string | null;
  site_name?: string | null;
  site_id?: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalInspections: number;
    lastInspectionDate: string | null;
  }>({
    totalInspections: 0,
    lastInspectionDate: null,
  });
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [naturalnessData, setNaturalnessData] = useState<Awaited<ReturnType<typeof getNaturalnessDistribution>>>([]);
  const [siteData, setSiteData] = useState<Awaited<ReturnType<typeof getTopSitesDistribution>>>([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [total, lastDate, naturalness, topSites] = await Promise.all([
        getTotalInspectionCount(),
        getLastInspectionDate(),
        getNaturalnessDistribution(),
        getTopSitesDistribution(),
      ]);
      setStats({ totalInspections: total, lastInspectionDate: lastDate });
      setNaturalnessData(naturalness);
      setSiteData(topSites);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart options for better appearance
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
            family: 'system-ui, -apple-system, sans-serif'
          },
          color: '#254431'
        }
      },
      tooltip: {
        backgroundColor: '#254431',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    }
  };


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial stats fetch on mount; fetchStats sets the loading flag before awaiting
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();
        
        const res1 = await fetch("/api/homepage-images");
        const data1 = await res1.json();

        if ((!res.ok)) {
          throw new Error(data.error || "Failed to load gallery");
        }

        if ((!res1.ok)) {
          throw new Error(data1.error || "Failed to load homepage-images");
        }

        const allItems = [
          ...(data.items || []).map((item: GalleryItem & { created_at?: string | null }) => ({
            ...item,
            _sortDate: item.created_at ?? item.date ?? "",
          })),
          ...(data1.items || []).map((item: GalleryItem & { created_at?: string | null }) => ({
            ...item,
            _sortDate: item.date ?? item.created_at ?? "",
          })),
        ].sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime());
        
        setItems(allItems || []);
      } catch (err) {
        console.error("Gallery fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#5B655D] font-medium">Loading dashboard...</p>
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
                  <h1 className="text-2xl sm:text-3xl font-bold mt-3">Admin Dashboard</h1>
                  <p className="text-[#E4EBE4] text-sm sm:text-base mt-0.5 max-w-md">
                    Monitor and analyze site inspection data
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
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <ExportAllFilesButton />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Records */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#5B655D] uppercase tracking-wide">Total Records</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{stats.totalInspections}</div>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <Link href="/admin/gallery" className="block">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#E4EBE4] shadow-sm hover:border-[#86A98A] hover:shadow-lg transition-all h-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-sm font-semibold text-[#5B655D] uppercase tracking-wide">Image Gallery</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#254431]">{items.length} images</div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Last Record */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white"/>
                </div>
                <div>
                  <div className="text-sm sm:text-sm font-semibold text-[#5B655D] uppercase tracking-wide">Last Record</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#254431]">
                    {stats.lastInspectionDate
                      ? new Date(stats.lastInspectionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Naturalness Distribution */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-[#356B43]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#254431] leading-snug">Naturalness Distribution</h2>
            </div>
            {naturalnessData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
                  <Pie
                    data={{
                      labels: naturalnessData.map((i) => i.naturalness_score || 'Unknown'),
                      datasets: [{
                        data: naturalnessData.map((i) => i.count),
                        backgroundColor: naturalnessData.map((i) => {
                          const score = (i.naturalness_score || '').toLowerCase();
                          if (score.includes('great') || score.includes('excellent')) return '#1C7C4D';
                          if (score.includes('good')) return '#4caf50';
                          if (score.includes('passable') || score.includes('fair')) return '#FFA726';
                          if (score.includes('cannot answer') || score.includes('n/a')) return '#78909C';
                          if (score.includes('terrible') || score.includes('poor')) return '#E53935';
                          return '#999999';
                        }),
                        borderWidth: 2,
                        borderColor: '#ffffff'
                      }],
                    }}
                    options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }}
                  />
                </div>
                <ul className="flex flex-col gap-2 min-w-[180px]">
                  {naturalnessData.map((i) => {
                    const score = (i.naturalness_score || '').toLowerCase();
                    const color =
                      score.includes('great') || score.includes('excellent') ? '#1C7C4D' :
                      score.includes('good') ? '#4caf50' :
                      score.includes('passable') || score.includes('fair') ? '#FFA726' :
                      score.includes('cannot answer') || score.includes('n/a') ? '#78909C' :
                      score.includes('terrible') || score.includes('poor') ? '#E53935' :
                      '#999999';
                    return (
                      <li key={i.naturalness_score} className="flex items-center gap-2 text-sm text-[#254431]">
                        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                        {i.naturalness_score || 'Unknown'}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-[#5B655D]">No data available</p>
            )}
          </div>

          {/* Top 5 Sites */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-[#356B43]" />
              </div>
              <h2 className="text-xl font-bold text-[#254431]">Top 5 Sites</h2>
            </div>
            {siteData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0">
                  <Pie
                    data={{
                      labels: siteData.map((i) => i.namesite || 'Unknown'),
                      datasets: [{
                        data: siteData.map((i) => i.count),
                        backgroundColor: ['#ffb74d', '#4caf50', '#2196f3', '#9c27b0', '#f44336'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                      }],
                    }}
                    options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }}
                  />
                </div>
                <ul className="flex flex-col gap-2 min-w-[180px]">
                  {siteData.map((i, index: number) => (
                    <li key={i.namesite} className="flex items-center gap-2 text-sm text-[#254431]">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: ['#ffb74d', '#4caf50', '#2196f3', '#9c27b0', '#f44336'][index] }}
                      />
                      {i.namesite || 'Unknown'}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-[#5B655D]">No data available</p>
            )}
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}