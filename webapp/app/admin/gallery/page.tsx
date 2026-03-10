"use client";


//Generate by ChatGPT based on the code in /api/gallery/route.ts and /api/s3/presign/route.ts, and the existing code in this file. Adjusted to fit the admin gallery page context.
import { useEffect, useState } from "react";
import AdminNavBar from "../AdminNavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import { Loader2, MapPin, FileText, ImageIcon, X, Maximize2 } from "lucide-react";

type GalleryItem = {
  id: string;
  site_id: string;
  site_name?: string | null;
  filename: string;
  storage_key: string;
  file_size_bytes?: number | null;
  imageUrl: string;
  caption?: string | null;
  description?: string | null;
  
  // Inspection attachment fields
  response_id?: string | null;
  question_id?: string | null;
  content_type?: string | null;

  // Homepage upload fields
  date?: string | null;
  photographer?: string | null;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

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
          ...(data.items || []).map((item: any) => ({
            ...item,
            _sortDate: item.created_at ?? item.date ?? "",
          })),
          ...(data1.items || []).map((item: any) => ({
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
                  <h1 className="text-3xl font-bold mt-3">Image Gallery</h1>
                  <p className="text-[#E4EBE4] text-base mt-0.5">
                  View all uploaded inspection images and metadata
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

        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#356B43]" />
              <p className="text-[#7A8075]">Loading gallery...</p>
            </div>
          ) : items.length === 0 ? (
            <p className="text-[#7A8075]">No images found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border-2 border-[#E4EBE4] shadow-sm overflow-hidden hover:shadow-lg transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedImage(item)}
                    className="group relative block w-full h-64 bg-[#F7F2EA] overflow-hidden"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.caption || item.filename || "Inspection image"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-md">
                        <Maximize2 className="w-5 h-5 text-[#254431]" />
                      </div>
                    </div>
                  </button>

                  <div className="p-4 space-y-3">
                    <div className="text-sm text-[#7A8075] flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{item.site_name || "Unknown site"}</span>
                    </div>

                    <div className="text-sm text-[#7A8075] flex items-start gap-2">
                      <ImageIcon className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#254431]">
                          {item.caption || "No caption"}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-[#7A8075] flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5" />
                      <span>{item.description || "No description"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-[#254431] rounded-full p-2 shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="bg-black flex items-center justify-center min-h-[300px] max-h-[85vh] overflow-auto">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.caption || selectedImage.filename || "Inspection image"}
                    className="max-w-full max-h-[85vh] object-contain"
                  />
                </div>

                <div className="p-6 bg-white space-y-5 border-l border-[#E4EBE4]">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Site
                    </p>
                    <p className="text-lg font-semibold text-[#254431]">
                      {selectedImage.site_name || "Unknown site"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Caption
                    </p>
                    <p className="text-base font-medium text-[#254431]">
                      {selectedImage.caption || "No caption"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Description
                    </p>
                    <p className="text-sm text-[#4B5563] leading-6">
                      {selectedImage.description || "No description"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Filename
                    </p>
                    <p className="text-sm text-[#4B5563] break-all">
                      {selectedImage.filename}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7A8075] mb-1">
                      Storage Path
                    </p>
                    <p className="text-sm text-[#4B5563] break-all">
                      {selectedImage.storage_key}
                    </p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={selectedImage.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-[#254431] text-white px-4 py-2.5 font-medium hover:bg-[#356B43] transition-colors"
                    >
                      Open full image in new tab
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}