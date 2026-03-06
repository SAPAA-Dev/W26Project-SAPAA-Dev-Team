"use client";

import { useEffect, useState } from "react";
import AdminNavBar from "../AdminNavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2, MapPin, Calendar, FileText } from "lucide-react";

type GalleryItem = {
  id: string;
  response_id: string;
  question_id: string;
  caption?: string | null;
  description?: string | null;
  storage_key: string;
  content_type: string;
  file_size_bytes?: number | null;
  filename: string;
  site_id: string;
  imageUrl: string;
  namesite?: string | null;
  inspectdate?: string | null;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        console.log("Fetching gallery from /api/gallery...");

        const res = await fetch("/api/gallery");
        console.log("Response status:", res.status);

        const data = await res.json();
        console.log("Full API response:", data);

        if (!res.ok) {
          console.error("API returned error:", data.error);
          throw new Error(data.error || "Failed to load gallery");
        }

        console.log("Gallery items count:", data.items?.length);

        if (data.items) {
          data.items.forEach((item: GalleryItem, index: number) => {
            console.log(`Item ${index}`, {
              id: item.id,
              filename: item.filename,
              site_id: item.site_id,
              imageUrl: item.imageUrl,
            });
          });
        }

        setItems(data.items || []);
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
        <AdminNavBar />

        {/* Header */}
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold">Image Gallery</h1>
            <p className="text-[#E4EBE4] text-lg">
              View all uploaded inspection images and metadata
            </p>
          </div>
        </div>

        {/* Main Content */}
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
              {items.map((item) => {
                console.log("Rendering item:", item.filename);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border-2 border-[#E4EBE4] shadow-sm overflow-hidden"
                  >
                    {/* Image */}
                    <div className="w-full h-64 bg-[#F7F2EA]">
                      <img
                        src={item.imageUrl}
                        alt={item.filename || "Inspection image"}
                        className="w-full h-full object-cover"
                        onLoad={() =>
                          console.log("Image loaded:", item.filename)
                        }
                        onError={() =>
                          console.error("Image failed to load:", item.imageUrl)
                        }
                      />
                    </div>

                    {/* Metadata */}
                    <div className="p-4 space-y-2">
                      <div className="font-semibold text-[#254431] truncate">
                        {item.filename}
                      </div>

                      <div className="text-sm text-[#7A8075] flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {item.namesite || item.site_id || "Unknown site"}
                        </span>
                      </div>

                      <div className="text-sm text-[#7A8075] flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {item.inspectdate
                            ? new Date(
                                item.inspectdate
                              ).toLocaleDateString()
                            : "No inspection date"}
                        </span>
                      </div>

                      <div className="text-sm text-[#7A8075] flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5" />
                        <span>
                          {item.description ||
                            item.caption ||
                            "No description"}
                        </span>
                      </div>
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