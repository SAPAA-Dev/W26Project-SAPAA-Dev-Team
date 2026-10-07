"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export type ImageKind = "attachments" | "homepage_image_uploads";

export default function DeleteImageButton({
  attachmentId,
  imageKind = "attachments",
  onDeleted,
}: {
  attachmentId: string | number;
  imageKind?: ImageKind;
  onDeleted: (attachmentId: string | number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/site-images?id=${attachmentId}&kind=${imageKind}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Delete request failed");
      }
      onDeleted(attachmentId);
    } catch (error) {
      console.error("Delete image error:", error);
      setErrorMessage("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        data-testid={`delete-image-${attachmentId}`}
        onClick={() => setConfirming(true)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white text-[#B91C1C] px-4 py-2.5 font-medium hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete image
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[#7A8075]">
        Delete this image? The file leaves storage for good.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          data-testid={`confirm-delete-image-${attachmentId}`}
          onClick={handleConfirm}
          disabled={deleting}
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#B91C1C] text-white px-4 py-2.5 font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Confirm delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="flex-1 inline-flex items-center justify-center rounded-xl border-2 border-[#E4EBE4] bg-white text-[#254431] px-4 py-2.5 font-medium hover:bg-[#F7F2EA] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {errorMessage && <p className="text-sm text-[#B91C1C]">{errorMessage}</p>}
    </div>
  );
}
