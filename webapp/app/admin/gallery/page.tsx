"use client";

import { useEffect, useState, useRef } from "react";
import JSZip from "jszip";
import pLimit from "p-limit";
import AdminNavBar from "../AdminNavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import { Loader2, MapPin, ImageIcon, X, Maximize2, Search, ArrowLeft, Calendar, Download } from "lucide-react";
import { useRouter } from "next/navigation";

type GalleryItem = {
  uid: string;
  id: number;
  source_type: "attachment" | "homepage";
  response_id: number | null;
  question_id: number | null;
  caption: string | null;
  identifier: string | null;
  date: string | null;
  photographer: string | null;
  storage_key: string;
  content_type: string;
  file_size_bytes: number | null;
  filename: string;
  site_id: number | null;
  site_name: string | null;
  imageUrl: string;
};

const PAGE_SIZE = 52;

export default function GalleryPage() {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const prevQueryRef = useRef(debouncedQuery);

  useEffect(() => {
    if (selectedImage) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [selectedImage]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debouncedQuery]);

  useEffect(() => {
    const queryChanged = prevQueryRef.current !== debouncedQuery;
    prevQueryRef.current = debouncedQuery;
    const effectivePage = queryChanged ? 1 : page;
    if (queryChanged) setPage(1);

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(effectivePage),
          pageSize: String(PAGE_SIZE),
        });
        if (debouncedQuery) params.set("search", debouncedQuery);
        const res = await fetch(`/api/gallery-combined?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load gallery");
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        console.error("Gallery fetch error:", err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    load();
  }, [page, debouncedQuery]);

  const downloadAllAsZip = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ all: "true" });
      if (debouncedQuery) params.set("search", debouncedQuery);
      const res = await fetch(`/api/gallery-combined?${params}`);
      const data = await res.json();
      const allItems: GalleryItem[] = data.items ?? [];
      setProgress({ done: 0, total: allItems.length });

      const zip = new JSZip();
      const limit = pLimit(8);
      let done = 0;

      await Promise.all(
        allItems.map((item) =>
          limit(async () => {
            try {
              const imgRes = await fetch(item.imageUrl);
              if (imgRes.ok) {
                const blob = await imgRes.blob();
                zip.file(item.filename || `${item.uid}.jpg`, blob);
              }
            } catch {
              // skip
            } finally {
              done++;
              setProgress({ done, total: allItems.length });
            }
          })
        )
      );

      const manifestRows = allItems.map((item) =>
        [item.filename, item.site_name ?? "", item.date ?? "", item.photographer ?? "",
         (item.caption ?? "").replace(/"/g, '""'), item.identifier ?? ""]
          .map((v) => `"${v}"`).join(",")
      );
      zip.file(
        "manifest.csv",
        "filename,site_name,date,photographer,caption,identifier\n" + manifestRows.join("\n")
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAPAA_Images_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    const stack: string[] = JSON.parse(sessionStorage.getItem("navStack") || "[]");
    if (stack.length > 1) {
      stack.pop();
      const previous = stack[stack.length - 1];
      stack.pop();
      sessionStorage.setItem("navStack", JSON.stringify(stack));
      router.push(previous);
    } else {
      stack.pop();
      sessionStorage.setItem("navStack", JSON.stringify(stack));
      router.push("/sites");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-4 sm:px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button onClick={handleBack} className="flex items-center gap-1.5 text-[#86A98A] hover:text-white transition-colors mb-4 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <Image src="/images/sapaa-icon-white.png" alt="SAPAA" width={140} height={140} priority className="h-12 sm:h-16 w-auto flex-shrink-0 mt-1" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-3 leading-tight">Image Gallery</h1>
                  <p className="text-[#E4EBE4] text-sm sm:text-base mt-0.5 max-w-md">View all uploaded inspection images and metadata</p>
                </div>
              </div>
              <div className="w-full sm:w-auto [&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:shadow-none [&>nav]:px-0 [&>nav]:py-0">
                <AdminNavBar />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#7A8075]" />
              </div>
              <input
                type="text"
                placeholder="Search by site, caption, identifier, or filename..."
                data-testid="admin-gallery-search-bar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 sm:py-2.5 border-2 border-[#E4EBE4] rounded-xl bg-white text-sm sm:text-base placeholder-[#7A8075] focus:outline-none focus:border-[#356B43] focus:ring-1 focus:ring-[#356B43] shadow-sm transition-all"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <X className="h-4 w-4 text-[#7A8075] hover:text-red-500 transition-colors" />
                </button>
              )}
            </div>

            {/* Download All button — primary action style */}
            <button
              onClick={downloadAllAsZip}
              disabled={downloading || total === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#254431] text-white font-bold rounded-xl hover:bg-[#1e3828] transition-colors shadow-lg disabled:cursor-not-allowed disabled:bg-[#C9D3C5] disabled:text-[#6B7280] disabled:shadow-none whitespace-nowrap"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progress.total > 0 ? `${progress.done}/${progress.total}` : "Preparing..."}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download All
                </>
              )}
            </button>

          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#356B43]" />
              <p className="text-[#7A8075]">Loading gallery...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-4 bg-white rounded-2xl border-2 border-dashed border-[#E4EBE4]">
              <div className="bg-[#F7F2EA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-[#7A8075]" size={32} />
              </div>
              <p className="text-[#254431] font-semibold text-lg">
                {debouncedQuery ? "No matching images found." : "No images found."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {items.map((item) => (
                  <div key={item.uid} className="bg-white rounded-2xl border-2 border-[#E4EBE4] shadow-sm overflow-hidden hover:shadow-lg transition-all">
                    <button type="button" onClick={() => setSelectedImage(item)} className="group relative block w-full h-56 sm:h-64 bg-[#F7F2EA] overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.identifier || item.caption || item.filename || "Inspection image"}
                        data-testid={`image-${item.identifier}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
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
                        <span>{item.site_name || "Unknown site"}</span>
                      </div>
                      <div className="text-sm text-[#7A8075] flex items-start gap-2">
                        <ImageIcon className="w-4 h-4 mt-0.5" />
                        <p className="font-semibold text-[#254431] break-words leading-snug">
                          {item.identifier || item.caption || "No caption"}
                        </p>
                      </div>
                      <div className="text-sm text-[#7A8075] flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-0.5" />
                        <p className="text-xs text-[#7A8075] mt-0.5">{item.date || "No date"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-8" onClick={() => setSelectedImage(null)}>
            <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-[#254431] rounded-full p-2 shadow-md">
                <X className="w-5 h-5" />
              </button>
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] flex-1 min-h-0">
                <div className="bg-black flex items-center justify-center min-h-[220px] sm:min-h-[300px] lg:min-h-0 max-h-[40vh] sm:max-h-[50vh] lg:max-h-none overflow-auto">
                  <img src={selectedImage.imageUrl} alt={selectedImage.identifier || selectedImage.caption || selectedImage.filename} className="max-w-full max-h-[40vh] sm:max-h-[50vh] lg:max-h-[85vh] object-contain" />
                </div>
                <div className="min-w-0 min-h-0 p-4 sm:p-6 bg-white space-y-4 sm:space-y-5 border-t lg:border-t-0 lg:border-l border-[#E4EBE4] overflow-y-auto">
                  <div><p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Site</p><p className="text-base sm:text-lg font-semibold text-[#254431] break-words">{selectedImage.site_name || "Unknown site"}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Caption</p><p className="text-base font-medium text-[#254431]">{selectedImage.caption || "No caption"}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Identifier</p><p className="text-sm text-[#4B5563] leading-6 break-words">{selectedImage.identifier || "No identifier"}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Date</p><p className="text-sm text-[#4B5563] leading-6 break-words">{selectedImage.date || "No date"}</p></div>
                  {selectedImage.photographer && (
                    <div><p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Photographer</p><p className="text-sm text-[#4B5563]">{selectedImage.photographer}</p></div>
                  )}
                  <div><p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Filename</p><p className="text-sm text-[#4B5563] break-all">{selectedImage.filename}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">Storage Path</p><p className="text-sm text-[#4B5563] break-all">{selectedImage.storage_key}</p></div>
                  <div className="pt-2">
                    <a href={selectedImage.imageUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center rounded-xl bg-[#254431] text-white px-4 py-2.5 font-medium hover:bg-[#356B43] transition-colors">
                      Open full image in new tab
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


    {/* Sticky pagination footer — only renders when there's more than one page */}
    {totalPages >= 1 && !selectedImage && !initialLoading && (
      <footer className="sticky bottom-0 bg-white border-t-2 border-[#E4EBE4] px-4 md:px-8 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-5 py-3 border-2 border-[#E4EBE4] text-[#254431] font-bold rounded-xl hover:bg-[#E4EBE4] transition-colors disabled:cursor-not-allowed disabled:border-[#D9E1D5] disabled:bg-[#EDF2EA] disabled:text-[#9AA49B]"
          >
            ← Previous
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-[#254431]">
              Page {page} of {totalPages}
            </span>
            <span className="text-xs font-medium text-[#7A8075]">
              {total} images total
            </span>
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-5 py-3 bg-[#356B43] text-white font-bold rounded-xl hover:bg-[#254431] transition-colors disabled:cursor-not-allowed disabled:bg-[#C9D3C5] disabled:text-[#6B7280]"
          >
            Next →
          </button>
        </div>
      </footer>
    )}
    </ProtectedRoute>
  );
}