"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Link from "next/link";
import { FileText, Calendar, Search, MapPin, BarChart3, ImageIcon, PieChart, Loader2 } from "lucide-react";
import Image from 'next/image';
import { getTotalInspectionCount, getLastInspectionDate, getNaturalnessDistribution, getTopSitesDistribution } from '@/utils/supabase/queries';
import AdminNavBar from "../AdminNavBar";
import ProtectedRoute from "@/components/ProtectedRoute";

ChartJS.register(ArcElement, Tooltip, Legend);
const Map = dynamic(() => import("./components/Map"), { ssr: false });

type HeatPoint = { latitude: number; longitude: number; weight: number; namesite?: string; };
type GalleryItem = { id: string; response_id: string; question_id: string; caption?: string | null; description?: string | null; storage_key: string; content_type: string; file_size_bytes?: number | null; filename: string; site_id: string | null; site_name?: string | null; imageUrl: string; };

export default function Dashboard() {
  const supabaseClient = createClient();
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [stats, setStats] = useState<{ totalInspections: number; lastInspectionDate: string | null; }>({ totalInspections: 0, lastInspectionDate: null });
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [naturalnessData, setNaturalnessData] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [total, lastDate, naturalness, topSites] = await Promise.all([getTotalInspectionCount(), getLastInspectionDate(), getNaturalnessDistribution(), getTopSitesDistribution()]);
      setStats({ totalInspections: total, lastInspectionDate: lastDate });
      setNaturalnessData(naturalness as any);
      setSiteData(topSites as any);
    } catch (error) { console.error('Error loading stats:', error); }
    finally { setLoading(false); }
  };

  // API now returns latitude/longitude directly — no geocoding loop needed
  const handleSearch = async () => {
    if (!keyword.trim()) { alert("Please enter a search keyword"); return; }
    setSearchLoading(true);
    setPoints([]);
    try {
      const response = await fetch(`/api/heatmap?keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const json = await response.json();
      const raw: HeatPoint[] = json.data || [];
      if (raw.length === 0) { alert(`No inspection reports mention "${keyword}"`); return; }
      setPoints(raw);
    } catch (error: any) {
      console.error("Search error:", error);
      alert(`Search failed: ${error.message}`);
      setPoints([]);
    } finally { setSearchLoading(false); }
  };

  const chartOptions = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' as const, labels: { padding: 15, font: { size: 12, family: 'system-ui, -apple-system, sans-serif' }, color: '#254431' } }, tooltip: { backgroundColor: '#254431', padding: 12, titleFont: { size: 14 }, bodyFont: { size: 13 } } } };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load gallery");
        setItems(data.items || []);
      } catch (err) { console.error("Gallery fetch error:", err); }
      finally { setLoading(false); }
    };
    fetchGallery();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
      <p className="text-[#7A8075] font-medium">Loading dashboard...</p>
    </div>
  );

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <Image src="/images/sapaa-icon-white.png" alt="SAPAA" width={140} height={140} priority className="h-16 w-auto flex-shrink-0 opacity-100 mt-1" />
                <div>
                  <h1 className="text-3xl font-bold mt-3">Admin Dashboard</h1>
                  <p className="text-[#E4EBE4] text-base mt-0.5">Monitor and analyze site inspection data</p>
                </div>
              </div>
              <div className="[&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:shadow-none [&>nav]:px-0 [&>nav]:py-0"><AdminNavBar /></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
                <div><div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Total Records</div><div className="text-3xl font-bold text-[#254431]">{stats.totalInspections}</div></div>
              </div>
            </div>
            <Link href="/admin/gallery" className="block">
              <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm hover:border-[#86A98A] hover:shadow-lg transition-all h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center"><ImageIcon className="w-6 h-6 text-white" /></div>
                  <div><div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Image Gallery</div><div className="text-3xl font-bold text-[#254431]">{items.length} images</div></div>
                </div>
              </div>
            </Link>
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div>
                <div><div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Last Record</div><div className="text-3xl font-bold text-[#254431]">{stats.lastInspectionDate ? new Date(stats.lastInspectionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}</div></div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center"><PieChart className="w-5 h-5 text-[#356B43]" /></div><h2 className="text-xl font-bold text-[#254431]">Naturalness Distribution</h2></div>
              <div className="h-[300px] flex items-center justify-center">
                {naturalnessData.length > 0 ? <Pie data={{ labels: naturalnessData.map((i: any) => i.naturalness_score || 'Unknown'), datasets: [{ data: naturalnessData.map((i: any) => i.count), backgroundColor: naturalnessData.map((i: any) => { const s = (i.naturalness_score || '').toLowerCase(); if (s.includes('great') || s.includes('excellent')) return '#1C7C4D'; if (s.includes('good')) return '#4caf50'; if (s.includes('passable') || s.includes('fair')) return '#FFA726'; if (s.includes('cannot answer') || s.includes('n/a')) return '#78909C'; if (s.includes('terrible') || s.includes('poor')) return '#E53935'; return '#999999'; }), borderWidth: 2, borderColor: '#ffffff' }] }} options={chartOptions} /> : <p className="text-[#7A8075]">No data available</p>}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center"><BarChart3 className="w-5 h-5 text-[#356B43]" /></div><h2 className="text-xl font-bold text-[#254431]">Top 5 Sites</h2></div>
              <div className="h-[300px] flex items-center justify-center">
                {siteData.length > 0 ? <Pie data={{ labels: siteData.map((i: any) => i.namesite || 'Unknown'), datasets: [{ data: siteData.map((i: any) => i.count), backgroundColor: ['#ffb74d','#4caf50','#2196f3','#9c27b0','#f44336'], borderWidth: 2, borderColor: '#ffffff' }] }} options={chartOptions} /> : <p className="text-[#7A8075]">No data available</p>}
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center"><MapPin className="w-5 h-5 text-[#356B43]" /></div><h2 className="text-xl font-bold text-[#254431]">Site Heatmap</h2></div>
            <div className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8075]" />
                  <input className="w-full pl-12 pr-4 py-3.5 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-all" placeholder="Search inspection reports by keyword…" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                </div>
                <button className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" onClick={handleSearch} disabled={!keyword.trim() || searchLoading}>
                  {searchLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Searching...</> : <><Search className="w-5 h-5" />Search</>}
                </button>
              </div>
              {points.length > 0 && <p className="text-sm text-[#7A8075] mt-3 flex items-center gap-2"><MapPin className="w-4 h-4" />{points.length} site{points.length !== 1 ? 's' : ''} mention "{keyword}" — colour shows frequency (blue = low, red = high)</p>}
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-[#E4EBE4] h-[500px]">
              <Map points={points} showHeatmap={true} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}