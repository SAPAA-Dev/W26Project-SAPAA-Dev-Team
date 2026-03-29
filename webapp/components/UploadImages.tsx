"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { getSitesOnline, getCurrentUserUid, insertHomepageImageUpload } from "@/utils/supabase/queries";
import { Upload, X, Search, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

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
    id: crypto.randomUUID(),
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
    caption: string;
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

        const { uploadUrl, key } = await getPresignedUrl({
          filename: generatedFilename,
          contentType: file.type,
          fileSize: file.size,
          siteId: entry.site!.id,
          caption: entry.caption,
          siteName: entry.site!.name,
          date: entry.date,
          photographer: entry.who,
          identifier: entry.identifier,
        });

        const filename = key.split("/").pop()!;

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
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#356B43] to-[#254431] hover:from-[#254431] hover:to-[#356B43] text-white text-sm font-semibold rounded-full shadow-lg transition-all hover:-translate-y-0.5"
      >
        <Upload size={16} />
        Upload Images
      </button>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#254431]/60 backdrop-blur-md p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#254431] to-[#356B43] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Upload Site Images</h2>
                  <p className="text-xs sm:text-sm text-[#86A98A]">
                    {files.length === 0
                      ? "Select images to upload"
                      : `${files.length} image${files.length !== 1 ? "s" : ""} selected · ${files.filter(isComplete).length} complete`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="p-4 space-y-3 overflow-y-auto">

              {/* Drop zone */}
              {files.length === 0 && (
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${
                    dragging
                      ? "border-[#356B43] bg-[#F7F2EA]"
                      : "border-[#E4EBE4] bg-[#F7F2EA] hover:border-[#356B43]"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon
                    size={32}
                    className={`mx-auto mb-3 ${dragging ? "text-[#356B43]" : "text-[#86A98A]"}`}
                  />
                  <p className="text-sm text-[#7A8075]">
                    Drop images here or{" "}
                    <span className="text-[#356B43] font-semibold underline underline-offset-2">
                      browse files
                    </span>
                  </p>
                  <p className="text-xs text-[#7A8075]/60 mt-1">JPEG, PNG, HEIC supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </div>
              )}

              {/* Per-image editor */}
              {files.length > 0 && current && (
                <div className="flex flex-col gap-3">

                  {/* Nav bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-[#E4EBE4] text-[#254431] hover:bg-[#E4EBE4] disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-bold uppercase tracking-wide text-[#254431]">
                        Image {currentIndex + 1} of {files.length}
                      </span>
                      <button
                        onClick={() => setCurrentIndex((i) => Math.min(files.length - 1, i + 1))}
                        disabled={currentIndex === files.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-[#E4EBE4] text-[#254431] hover:bg-[#E4EBE4] disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-[#E4EBE4] text-[#254431] hover:bg-[#E4EBE4] hover:border-[#356B43] hover:text-[#356B43] transition-colors text-base font-medium"
                      >
                        +
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addFiles(e.target.files)}
                      />
                      <button
                        onClick={removeCurrentFile}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border-2 border-[#E4EBE4] text-[#254431] hover:text-[#B91C1C] hover:border-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Preview + fields - stacks on mobile, side by side on desktop */}
                  <div className="flex flex-col lg:flex-row gap-4">

                    {/* Image preview */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                      <img
                        src={current.preview}
                        alt={current.file.name}
                        className="w-full object-cover rounded-2xl border-2 border-[#E4EBE4]"
                        style={{ maxHeight: '360px' }}
                      />
                    </div>

                    {/* Metadata fields */}
                    <div className="flex-1 min-w-0 bg-[#F7F2EA] rounded-2xl border-2 border-[#E4EBE4] p-4 flex flex-col gap-2.5">

                      {/* Site selector */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A8075] mb-1">
                          Site <span className="text-[#B91C1C]">*</span>
                        </label>
                        {current.site ? (
                          <div className="flex items-center justify-between w-full px-3 py-2 text-sm border-2 border-[#356B43] rounded-xl bg-white text-[#254431]">
                            <span className="font-medium">{current.site.name}</span>
                            <button
                              onClick={() => { updateField("site", null); updateField("siteSearch", ""); }}
                              className="text-[#7A8075] hover:text-[#254431] transition-colors ml-2 flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div data-testid="upload-modal" className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8075] pointer-events-none" />
                            <input
                              className="w-full pl-8 pr-3 py-2 text-sm border-2 border-[#E4EBE4] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-colors placeholder:text-[#7A8075]/60 text-[#1E2520]"
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
                              <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-[#E4EBE4] rounded-xl shadow-lg z-10 max-h-36 overflow-y-auto">
                                {filteredSites.length === 0 ? (
                                  <p className="text-xs text-[#7A8075] text-center py-3">No sites found</p>
                                ) : (
                                  filteredSites.map((site) => (
                                    <div
                                      key={site.id}
                                      className="px-3 py-2 cursor-pointer hover:bg-[#F7F2EA] transition-colors"
                                      onMouseDown={() => {
                                        updateField("site", site);
                                        updateField("siteSearch", "");
                                        updateField("siteDropdownOpen", false);
                                      }}
                                    >
                                      <p className="text-sm font-medium text-[#254431]">{site.name}</p>
                                      {site.county && <p className="text-xs text-[#7A8075]">{site.county}</p>}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date + Photographer - stacks on mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A8075] mb-1">
                            Date of Visit <span className="text-[#B91C1C]">*</span>
                          </label>
                          <input
                            type="date"
                            value={current.date}
                            max={today}
                            onChange={(e) => updateField("date", e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-[#E4EBE4] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-colors text-[#1E2520]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A8075] mb-1">
                            Photographer <span className="text-[#B91C1C]">*</span>{" "}
                            <span className={`normal-case font-normal ${current.who.replace(/\s/g, "").length >= 25 ? "text-[#B91C1C]" : "text-[#7A8075]"}`}>
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
                            className={`w-full px-3 py-2 text-sm border-2 rounded-xl bg-white focus:outline-none focus:ring-2 transition-colors placeholder:text-[#7A8075]/60 text-[#1E2520] ${
                              current.who.replace(/\s/g, "").length >= 25
                                ? "border-[#B91C1C] focus:ring-[#B91C1C] focus:border-[#B91C1C]"
                                : "border-[#E4EBE4] focus:ring-[#356B43] focus:border-[#356B43]"
                            }`}
                          />
                          {current.who.replace(/\s/g, "").length >= 25 && (
                            <p className="text-xs text-[#B91C1C] mt-1">Character limit reached</p>
                          )}
                        </div>
                      </div>

                      {/* Identifier */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A8075] mb-1">
                          Identifier <span className="text-[#B91C1C]">*</span>{" "}
                          <span className={`normal-case font-normal ${current.identifier.replace(/\s/g, "").length >= 20 ? "text-[#B91C1C]" : "text-[#7A8075]"}`}>
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
                          className={`w-full px-3 py-2 text-sm border-2 rounded-xl bg-white focus:outline-none focus:ring-2 transition-colors placeholder:text-[#7A8075]/60 text-[#1E2520] ${
                            current.identifier.replace(/\s/g, "").length >= 20
                              ? "border-[#B91C1C] focus:ring-[#B91C1C] focus:border-[#B91C1C]"
                              : "border-[#E4EBE4] focus:ring-[#356B43] focus:border-[#356B43]"
                          }`}
                        />
                        {current.identifier.replace(/\s/g, "").length >= 20 && (
                          <p className="text-xs text-[#B91C1C] mt-1">Character limit reached</p>
                        )}
                      </div>

                      {/* Caption */}
                      <div className="flex-1 flex flex-col">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-[#7A8075] mb-1">
                          Caption <span className="text-[#B91C1C]">*</span>
                        </label>
                        <textarea
                          placeholder="Longer Description. What is it, why is it important?"
                          rows={3}
                          value={current.caption}
                          onChange={(e) => updateField("caption", e.target.value)}
                          className="flex-1 w-full px-3 py-2 text-sm border-2 border-[#E4EBE4] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-colors placeholder:text-[#7A8075]/60 text-[#1E2520] resize-none"
                        />
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-[#E4EBE4] px-4 sm:px-6 py-4 flex-shrink-0">
              {uploadError && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FEE2E2] rounded-xl">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] flex-shrink-0" />
                  <p className="text-sm text-[#B91C1C]">{uploadError}</p>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#7A8075] shrink-0">
                  {files.length > 0 ? (
                    <><strong className="text-[#254431]">{files.filter(isComplete).length} / {files.length}</strong> complete</>
                  ) : (
                    "No files selected"
                  )}
                </p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border-2 border-[#E4EBE4] text-[#7A8075] hover:bg-[#F7F2EA] font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="upload-submit-btn"
                    onClick={handleUpload}
                    disabled={!canUpload || isSubmitting}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#356B43] to-[#254431] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
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