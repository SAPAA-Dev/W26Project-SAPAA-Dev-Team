"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Link from "next/link";
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Calendar,
  Search,
  MapPin,
  BarChart3,
  PieChart,
  Loader2
} from "lucide-react";
import Image from 'next/image';

import AdminNavBar from "../AdminNavBar";
import ProtectedRoute from "@/components/ProtectedRoute";

ChartJS.register(ArcElement, Tooltip, Legend);

// dynamically import Leaflet 
const Map = dynamic(() => import("./components/Map"), { ssr: false });

type HeatPoint = {
  latitude: number;
  longitude: number;
  weight: number;
  namesite?: string;
};

export default function Dashboard() {
  const supabaseClient = createClient();
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [stats, setStats] = useState({
    totalInspections: 0,
    lastInspectionDate: null,
  });

  const [naturalnessData, setNaturalnessData] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchStats = async () => {
    console.log("=== DASHBOARD STATS DEBUG ===");
    console.log("ENV URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("ENV KEY:", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    setLoading(true);
  
    try {
      // Test 1: Count records
      console.log("1️⃣ Fetching total count...");
      const { count, error: countError } = await supabaseClient
        .from("sites_report_fnr_test")
        .select("namesite", { count: "exact", head: true });
  
      console.log("Count result:", count);
      console.log("Count error:", countError);
  
      // Test 2: Last inspection date
      console.log("2️⃣ Fetching last inspection...");
      const { data: lastRows, error: lastError } = await supabaseClient
        .from("sites_report_fnr_test")
        .select("inspectdate")
        .order("inspectdate", { ascending: false })
        .limit(1);
  
      console.log("Last rows:", lastRows);
      console.log("Last error:", lastError);
  
      // Test 3: Naturalness distribution
      console.log("3️⃣ Calling get_naturalness_distribution...");
      const { data: naturalness, error: natError } = await supabaseClient.rpc(
        "get_naturalness_distribution"
      );
  
      console.log("Naturalness data:", naturalness);
      console.log("Naturalness error:", natError);
  
      // Test 4: Top sites
      console.log("4️⃣ Calling get_top_sites_distribution...");
      const { data: topSites, error: topError } = await supabaseClient.rpc(
        "get_top_sites_distribution"
      );
 
      console.log("Top sites data:", topSites);
      console.log("Top sites error:", topError);
  
      setStats({
        totalInspections: count || 0,
        lastInspectionDate: lastRows?.[0]?.inspectdate || null,
      });
  
      setNaturalnessData(naturalness || []);
      setSiteData(topSites || []);
  
      console.log("✅ Stats loaded successfully");
    } catch (error) {
      console.error("❌ Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert("Please enter a search keyword");
      return;
    }

    setSearchLoading(true);
    setPoints([]); // Clear map immediately

    try {
      console.log(`🔍 Searching for: "${keyword}"`);
      
      const response = await fetch(`/api/heatmap?keyword=${encodeURIComponent(keyword)}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      const raw = data.data || [];
      
      console.log(`📊 Found ${raw.length} sites`);

      if (raw.length === 0) {
        alert(`No sites found matching "${keyword}"`);
        setSearchLoading(false);
        return;
      }

      // Geocode each site with delay
      const coords = [];
      
      for (let i = 0; i < raw.length; i++) {
        const site = raw[i];
        
        try {
          console.log(`📍 Geocoding ${i + 1}/${raw.length}: ${site.namesite}`);
          
          const geoResponse = await fetch(`/api/geocode?q=${encodeURIComponent(site.namesite)}`);
          
          if (!geoResponse.ok) {
            console.warn(`⚠️ Geocoding failed for ${site.namesite}`);
            continue;
          }
          
          const geo = await geoResponse.json();

          if (geo?.latitude && geo?.longitude) {
            coords.push({
              latitude: geo.latitude,
              longitude: geo.longitude,
              weight: site.count,
              namesite: site.namesite,
            });
            console.log(`✅ Geocoded: ${site.namesite}`);
          }
          
          // Small delay to avoid rate limiting
          if (i < raw.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ Error geocoding ${site.namesite}:`, error);
        }
      }

      console.log(`✅ Successfully geocoded ${coords.length}/${raw.length} sites`);
      
      if (coords.length === 0) {
        alert(`Found ${raw.length} sites, but couldn't determine their locations.`);
      }
      
      setPoints(coords);
      
    } catch (error: any) {
      console.error("❌ Search error:", error);
      alert(`Search failed: ${error.message}`);
      setPoints([]); // Clear map on error
    } finally {
      setSearchLoading(false);
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

  // THIS IS THE MISSING useEffect - CRITICAL!
  useEffect(() => {
    console.log("⚡ useEffect running - about to call fetchStats");
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
        <p className="text-[#7A8075] font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
      
        
      <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
  <div className="max-w-7xl mx-auto">
    <div className="flex items-center justify-between mb-3">
      {/* Left: icon + title + subtitle */}
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
          <h1 className="text-3xl font-bold mt-3">Admin Dashboard</h1>
          <p className="text-[#E4EBE4] text-base mt-0.5">
            Monitor and analyze site inspection data
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
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Total Records Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Total Records</div>
                  <div className="text-4xl font-bold text-[#254431] mt-1">{stats.totalInspections.toLocaleString()}</div>
                </div>
              </div>
            <div className="pt-4 border-t-2 border-[#E4EBE4]">
                <div className="flex items-center gap-2 text-sm text-[#7A8075]">
                  <TrendingUp className="w-4 h-4 text-[#1C7C4D]" />
                  <span>All inspection records in database</span>
                </div>
              </div>
            </div>
        <Link href="/admin/gallery" className="block">
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Image Gallery</div>
                  <div className="text-4xl font-bold text-[#254431] mt-1">{stats.totalInspections.toLocaleString()}</div>
                </div>
              </div>
            <div className="pt-4 border-t-2 border-[#E4EBE4]">
                <div className="flex items-center gap-2 text-sm text-[#7A8075]">
                  <TrendingUp className="w-4 h-4 text-[#1C7C4D]" />
                  <span>All inspection images from sites</span>
                </div>
              </div>
            </div>
        </Link>
            

            {/* Last Record Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Last Record</div>
                  <div className="text-2xl font-bold text-[#254431] mt-1">
                    {stats.lastInspectionDate
                      ? new Date(stats.lastInspectionDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t-2 border-[#E4EBE4]">
                <div className="flex items-center gap-2 text-sm text-[#7A8075]">
                  <Calendar className="w-4 h-4 text-[#356B43]" />
                  <span>Most recent inspection date</span>
                </div>
              </div>
            </div>
          </div>

          

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Naturalness Distribution */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-[#356B43]" />
                </div>
                <h2 className="text-xl font-bold text-[#254431]">Naturalness Distribution</h2>
              </div>
              <div className="h-[300px] flex items-center justify-center">
                {naturalnessData.length > 0 ? (
                  <Pie
                    data={{
                      labels: naturalnessData.map((i: any) => i.naturalness_score || 'Unknown'),
                      datasets: [
                        {
                          data: naturalnessData.map((i: any) => i.count),
                          backgroundColor: naturalnessData.map((i: any) => {
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
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <p className="text-[#7A8075]">No data available</p>
                )}
              </div>
            </div>

            {/* Top 5 Sites */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#356B43]" />
                </div>
                <h2 className="text-xl font-bold text-[#254431]">Top 5 Sites</h2>
              </div>
              <div className="h-[300px] flex items-center justify-center">
                {siteData.length > 0 ? (
                  <Pie
                    data={{
                      labels: siteData.map((i: any) => i.namesite || 'Unknown'),
                      datasets: [
                        {
                          data: siteData.map((i: any) => i.count),
                          backgroundColor: [
                            '#ffb74d',
                            '#4caf50',
                            '#2196f3',
                            '#9c27b0',
                            '#f44336'
                          ],
                          borderWidth: 2,
                          borderColor: '#ffffff'
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <p className="text-[#7A8075]">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Heatmap Section */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E4EBE4] rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#356B43]" />
              </div>
              <h2 className="text-xl font-bold text-[#254431]">Site Heatmap</h2>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8075]" />
                  <input
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-all"
                    placeholder="Enter keyword to search sites..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  className="bg-gradient-to-r from-[#356B43] to-[#254431] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={handleSearch}
                  disabled={!keyword.trim() || searchLoading}
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search
                    </>
                  )}
                </button>
              </div>
              {points.length > 0 && (
                <p className="text-sm text-[#7A8075] mt-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Found {points.length} location{points.length !== 1 ? 's' : ''} for "{keyword}"
                </p>
              )}
            </div>

            {/* Map Container */}
            <div className="rounded-xl overflow-hidden border-2 border-[#E4EBE4] h-[500px]">
              <Map points={points} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}