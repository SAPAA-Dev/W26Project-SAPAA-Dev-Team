"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CheckCircle, X } from "lucide-react";

export function SubmissionToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("submitted") === "true") {
      setVisible(true);
      router.replace(pathname, { scroll: false });
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 bg-[#254431] text-white px-5 py-4 rounded-2xl shadow-xl border border-white/10 min-w-[320px]">
        <div className="w-8 h-8 bg-[#356B43] rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Report Submitted!</p>
          <p className="text-xs text-[#E4EBE4]/80 mt-0.5">Your site inspection has been recorded.</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}