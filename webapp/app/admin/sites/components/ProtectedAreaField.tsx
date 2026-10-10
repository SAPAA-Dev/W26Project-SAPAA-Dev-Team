"use client";

import { useMemo, useState } from "react";
import { Search, Trees, X } from "lucide-react";
import type { ProtectedAreaChoice } from "@/utils/supabase/queries";
import { useListbox } from "@/hooks/useListbox";

interface ProtectedAreaFieldProps {
  areas: ProtectedAreaChoice[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
  disabled: boolean;
  testIdPrefix: string;
}

function detailLine(area: ProtectedAreaChoice): string {
  return `${area.fid} | ${area.area_type}`;
}

function matchesQuery(area: ProtectedAreaChoice, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    area.name.toLowerCase().includes(needle) ||
    String(area.fid).includes(needle) ||
    area.area_type.toLowerCase().includes(needle)
  );
}

export default function ProtectedAreaField({
  areas,
  selectedId,
  onChange,
  disabled,
  testIdPrefix,
}: ProtectedAreaFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = areas.find((area) => area.id === selectedId) ?? null;
  const matches = useMemo(
    () => areas.filter((area) => matchesQuery(area, query)),
    [areas, query]
  );
  const listbox = useListbox({
    options: matches,
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onPick: (area) => {
      onChange(area.id);
      setQuery("");
      setOpen(false);
    },
  });

  return (
    <div>
      <label className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
        <Trees className="w-4 h-4 text-[#356B43]" />
        Protected Area
      </label>

      {selectedId !== null ? (
        <div className="flex items-center justify-between w-full px-4 py-3 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl">
          <div>
            <p data-testid={`${testIdPrefix}-selected-name`} className="text-sm font-medium text-[#1E2520]">
              {selected?.name ?? "Unknown protected area"}
            </p>
            <p data-testid={`${testIdPrefix}-selected-detail`} className="text-xs text-[#7A8075]">
              {selected ? detailLine(selected) : `Id ${selectedId}`}
            </p>
          </div>
          <button
            type="button"
            data-testid={`${testIdPrefix}-clear`}
            aria-label="Remove protected area"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            disabled={disabled}
            className="text-[#7A8075] hover:text-[#254431] transition-colors ml-2 flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8075] pointer-events-none" />
          <input
            data-testid={`${testIdPrefix}-search`}
            {...listbox.inputProps}
            type="text"
            aria-label="Search protected areas"
            autoComplete="off"
            className="w-full pl-8 pr-3 py-3 text-sm bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] transition-all"
            placeholder="Search by name, FID, or type"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              listbox.resetActive();
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            disabled={disabled}
          />
          {open && (
            <div className="mt-1 bg-white border-2 border-[#E4EBE4] rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
              {matches.length === 0 ? (
                <p className="text-xs text-[#7A8075] text-center py-3">No protected areas found</p>
              ) : (
                <ul {...listbox.listProps} aria-label="Protected areas">
                  {matches.map((area, index) => (
                    <li
                      key={area.id}
                      {...listbox.optionProps(index)}
                      data-testid={`${testIdPrefix}-option-${area.id}`}
                      className="w-full text-left px-3 py-2 cursor-pointer hover:bg-green-50 aria-selected:bg-green-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-[#1E2520]">{area.name}</p>
                      <p className="text-xs text-[#7A8075]">{detailLine(area)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
