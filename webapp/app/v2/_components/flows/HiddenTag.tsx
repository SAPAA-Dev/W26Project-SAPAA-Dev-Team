import { EyeOff } from 'lucide-react';

/** Marks an answer the report's owner hid from other stewards. Only the owner and admins are sent such answers. */
export function HiddenTag() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--honey)_28%,transparent)] px-2 py-0.5 align-middle text-[12px] font-bold text-[var(--ink)]">
      <EyeOff size={12} aria-hidden />
      Hidden from other stewards
    </span>
  );
}
