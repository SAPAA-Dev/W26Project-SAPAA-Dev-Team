"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { getSitesOnline, getCurrentUserUid, insertHomepageImageUpload } from "@/utils/supabase/queries";
import { Upload, X, Search, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Site {
  id: number;
  name: string;
  county?: string;
}

interface FileEntry {
  id: string;
  file: File;
  preview: string;
  site: Site | null;
  siteSearch: string;
  siteDropdownOpen: boolean;
  date: string;
  who: string;
  created_at: string;
  identifier: string;
  caption: string;
}

function generateFilename(site: Site | null, date: string, who: string, identifier: string): string {
  const parts = [
    site?.name?.replace(/[^a-zA-Z0-9]/g, "") ?? "Site",
    date ?? "",
    who.replace(/\s+/g, "") || "Unknown",
    identifier.replace(/\s+/g, "") || "Image",
  ].filter(Boolean);
  return parts.join("-") + ".jpg";
}

export default function UploadImages() {
  const [modalOpen, setModalOpen] = useState(false);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  const handleOpen = async () => {
    setModalOpen(true);
    const data = await getSitesOnline();
    setAllSites(
      (data ?? []).map((s) => ({
        id: s.id,
        name: s.namesite,
        county: s.county ?? undefined,
      }))
    );
  };

  const handleClose = () => {
    setModalOpen(false);
    setFiles([]);
    setCurrentIndex(0);
    setUploadError(null);
  };

  const makeEntry = (f: File): FileEntry => ({
    id: Math.random().toString(36).slice(2),
    file: f,
    preview: URL.createObjectURL(f),
    site: null,
    siteSearch: "",
    siteDropdownOpen: false,
    date: today,
    who: "",
    created_at: "",
    identifier: "",
    caption: "",
  });

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    const newEntries = imageFiles.map(makeEntry);
    setFiles((prev) => {
      const updated = [...prev, ...newEntries];
      setCurrentIndex(prev.length);
      return updated;
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const updateField = (field: keyof FileEntry, value: unknown) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === currentIndex ? { ...f, [field]: value } : f))
    );
  };

  const removeCurrentFile = () => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== currentIndex);
      setCurrentIndex((ci) => Math.min(ci, Math.max(0, updated.length - 1)));
      return updated;
    });
  };

  const PRESIGN_ROUTE = "/api/s3/presign-homepage-images";

  async function getPresignedUrl(input: {
    filename: string;
    contentType: string;
    fileSize: number;
    siteId: number;
    siteName: string;
    date: string;
    photographer: string;
    identifier: string;
  }) {
    const res = await fetch(PRESIGN_ROUTE, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Failed to get presigned URL");
    }
    return (await res.json()) as { uploadUrl: string; key: string };
  }

  async function uploadFileToS3(uploadUrl: string, file: File) {
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      mode: "cors",
      body: file,
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      throw new Error(`S3 upload failed (${putRes.status}): ${text}`);
    }
  }

  const handleUpload = async () => {
    if (!canUpload) return;
    setUploadError(null);
    setIsSubmitting(true);

    try {
      const userUid = await getCurrentUserUid();
      if (!userUid) throw new Error("User not authenticated");

      const rows: Array<{
        storage_key: string;
        filename: string;
        content_type: string;
        file_size_bytes: number;
        site_id: number;
        user_id: string;
        date: Date;
        photographer: string;
        identifier: string;
        caption: string;
        created_at: string;
      }> = [];

      for (const entry of files) {
        const generatedFilename = generateFilename(entry.site, entry.date, entry.who, entry.identifier);
        const file = entry.file;
        const created_at = new Date().toISOString();

        // 1) Get presigned URL
        const { uploadUrl, key } = await getPresignedUrl({
          // filename: generatedFilename,
          contentType: file.type,
          fileSize: file.size,
          siteId: entry.site!.id,

          siteName: entry.site!.name,
          date: entry.date,
          photographer: entry.who,
          identifier: entry.identifier,
        });

        const filename = key.split("/").pop()!; 

        // 2) Upload to S3
        await uploadFileToS3(uploadUrl, file);

        rows.push({
          storage_key: key,
          filename,
          content_type: file.type,
          file_size_bytes: file.size,
          site_id: entry.site!.id,
          user_id: userUid,
          date: new Date(entry.date),
          photographer: entry.who,
          identifier: entry.identifier,
          caption: entry.caption,
          created_at: created_at,
        });
      }

      // 3) Insert all rows at once
      await insertHomepageImageUpload(rows);

      setModalOpen(false);
      setFiles([]);
      setCurrentIndex(0);
      router.push(`/sites?image-upload=true`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      setUploadError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const current = files[currentIndex];
  const filteredSites = current
    ? allSites.filter(
        (s) =>
          s.name.toLowerCase().includes(current.siteSearch.toLowerCase()) ||
          (s.county ?? "").toLowerCase().includes(current.siteSearch.toLowerCase())
      )
    : [];

  const isComplete = (f: FileEntry) =>
    f.site !== null &&
    f.date.trim() !== "" &&
    f.who.trim() !== "" &&
    f.identifier.trim() !== "" &&
    f.caption.trim() !== "";

  const canUpload = files.length > 0 && files.every(isComplete);

  return (
    <>
      {/* FAB */}
      <button
        onClick={handleOpen}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3.5 bg-[#356B43] hover:bg-[#254431] text-white text-sm font-semibold rounded-full shadow-lg transition-all hover:-translate-y-0.5"
      >
        <Upload size={16} />
        Upload Images
      </button>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Upload Site Images</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {files.length === 0 ? "Select images to upload" : `${files.length} image${files.length !== 1 ? "s" : ""} selected`}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5">

              {/* Drop zone */}
              {files.length === 0 && (
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragging ? "border-[#356B43] bg-green-50" : "border-gray-200 bg-gray-50 hover:border-[#356B43] hover:bg-green-50"}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={32} className={`mx-auto mb-3 ${dragging ? "text-[#356B43]" : "text-gray-300"}`} />
                  <p className="text-sm text-gray-500">
                    Drop images here or{" "}
                    <span className="text-[#356B43] font-semibold underline underline-offset-2">browse files</span>
                  </p>
                  <p className="text-xs text-gray-300 mt-1">JPEG, PNG, HEIC supported</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                </div>
              )}

              {/* Per-image editor */}
              {files.length > 0 && current && (
                <div className="flex flex-col gap-4">

                  {/* Nav bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">
                        Image {currentIndex + 1} of {files.length}
                      </span>
                      <button
                        onClick={() => setCurrentIndex((i) => Math.min(files.length - 1, i + 1))}
                        disabled={currentIndex === files.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-500 text-gray-900 hover:bg-green-50 hover:border-[#356B43] hover:text-[#356B43] transition-colors text-base font-medium"
                      >
                        +
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                      <button
                        onClick={removeCurrentFile}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-500 text-gray-900 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Preview + fields */}
                  <div className="flex gap-5">

                    {/* Left: image preview */}
                    <div className="w-112 flex-shrink-0 flex flex-col items-center gap-2">
                      <img
                        src={current.preview}
                        alt={current.file.name}
                        className="w-full h-90 object-cover rounded-xl border border-gray-100"
                      />

                    </div>

                    {/* Right: metadata fields */}
                    <div className="flex-1 flex flex-col gap-3 min-w-0">

                      {/* Site selector */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">
                          Site <span className="text-red-400">*</span>
                        </label>
                        {current.site ? (
                          <div className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                            <span>{current.site.name}</span>
                            <button
                              onClick={() => { updateField("site", null); updateField("siteSearch", ""); }}
                              className="text-gray-400 hover:text-gray-700 transition-colors ml-2 flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div data-testid="upload-modal" className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#356B43] focus:bg-white transition-colors placeholder:text-gray-300 text-gray-700"
                              placeholder="Search by site name or county..."
                              value={current.siteSearch}
                              onChange={(e) => {
                                updateField("siteSearch", e.target.value);
                                updateField("siteDropdownOpen", true);
                              }}
                              onFocus={() => updateField("siteDropdownOpen", true)}
                              onBlur={() => setTimeout(() => updateField("siteDropdownOpen", false), 150)}
                            />
                            {current.siteDropdownOpen && (
                              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                                {filteredSites.length === 0 ? (
                                  <p className="text-xs text-gray-400 text-center py-3">No sites found</p>
                                ) : (
                                  filteredSites.map((site) => (
                                    <div
                                      key={site.id}
                                      className="px-3 py-2 cursor-pointer hover:bg-green-50 transition-colors"
                                      onMouseDown={() => {
                                        updateField("site", site);
                                        updateField("siteSearch", "");
                                        updateField("siteDropdownOpen", false);
                                      }}
                                    >
                                      <p className="text-sm font-medium text-gray-800">{site.name}</p>
                                      {site.county && <p className="text-xs text-gray-400">{site.county}</p>}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">Date of Visit <span className="text-red-400">*</span></label>
                        <input
                          type="date"
                          value={current.date}
                          max={today}
                          onChange={(e) => updateField("date", e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#356B43] focus:bg-white transition-colors text-gray-700"
                        />
                      </div>

                      {/* Photographer */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">
                          Photographer <span className="text-red-400">*</span>{" "}
                          <span className={`normal-case font-normal ${current.who.replace(/\s/g, "").length >= 25 ? "text-red-400" : "text-gray-500"}`}>
                            ({current.who.replace(/\s/g, "").length}/25)
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Owner of Digital File"
                          value={current.who}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.replace(/\s/g, "").length <= 25) updateField("who", val);
                          }}
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:bg-white transition-colors placeholder:text-gray-300 text-gray-700 ${current.who.replace(/\s/g, "").length >= 25 ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#356B43]"}`}
                        />
                        {current.who.replace(/\s/g, "").length >= 25 && (
                          <p className="text-xs text-red-400 mt-1">Character limit reached</p>
                        )}
                      </div>

                      {/* Identifier */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">
                          Identifier <span className="text-red-400">*</span>{" "}
                          <span className={`normal-case font-normal ${current.identifier.replace(/\s/g, "").length >= 20 ? "text-red-400" : "text-gray-500"}`}>
                            ({current.identifier.replace(/\s/g, "").length}/20)
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Short Description"
                          value={current.identifier}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.replace(/\s/g, "").length <= 20) updateField("identifier", val);
                          }}
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:bg-white transition-colors placeholder:text-gray-300 text-gray-700 ${current.identifier.replace(/\s/g, "").length >= 20 ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#356B43]"}`}
                        />
                        {current.identifier.replace(/\s/g, "").length >= 20 && (
                          <p className="text-xs text-red-400 mt-1">Character limit reached</p>
                        )}
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">Caption <span className="text-red-400">*</span></label>
                        <textarea
                          placeholder="Longer Description. What is it, why is it important?"
                          rows={2}
                          value={current.caption}
                          onChange={(e) => updateField("caption", e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#356B43] focus:bg-white transition-colors placeholder:text-gray-300 text-gray-700 resize-none"
                        />
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-400">
                {files.length > 0
                  ? <><strong className="text-gray-600">{files.filter(isComplete).length} / {files.length} complete </strong></>
                  : "No files selected"}
              </span>
              <div className="flex flex-col items-end gap-2">
                {uploadError && (
                  <p className="text-xs text-red-500">{uploadError}</p>
                )}
                <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  data-testid="upload-submit-btn"
                  onClick={handleUpload}
                  disabled={!canUpload || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#356B43] hover:bg-[#254431] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Upload size={14} />
                  {isSubmitting ? "Uploading..." : "Upload"}
                </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}