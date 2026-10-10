'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toggleAllCategoryValues, toggleCategoryValue } from '@/lib/map/boundaryFilters';

interface FilterSectionProps {
  label: string;
  options: readonly string[];
  selected: ReadonlySet<string> | null;
  onChange: (next: ReadonlySet<string> | null) => void;
}

function FilterSection({ label, options, selected, onChange }: FilterSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const allSelected = selected === null;
  // Count only the values shown here. A shared selection can hold values from the other view.
  const selectedCount = allSelected ? options.length : options.filter((option) => selected.has(option)).length;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  const searchLabel = searchLabelFor(label);

  return (
    <section className="border-b border-[#E4EBE4] last:border-b-0" aria-label={label}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold text-[#254431]"
        >
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
          <span>{label}</span>
          <span className="font-medium text-[#7A8075]">
            {options.length === 0 ? 'None' : allSelected ? 'All' : `${selectedCount} selected`}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={allSelected}
          disabled={options.length === 0}
          onClick={() => onChange(toggleAllCategoryValues(selected))}
          className="shrink-0 text-xs font-semibold text-[#356B43] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select all
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3">
          {label !== 'Status' &&<input
            type="text"
            value={query}
            aria-label={searchLabel}
            placeholder={searchLabel}
            onChange={(event) => setQuery(event.target.value)}
            className="mb-2 w-full rounded-lg border border-[#E4EBE4] px-3 py-2 text-sm text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43]"
          />}
          <div className="max-h-40 overflow-y-auto rounded-lg border border-[#E4EBE4]">
            {visibleOptions.length === 0 ? (
              <p className="px-1 py-2 text-sm text-[#7A8075]">No matches</p>
            ) : (
              visibleOptions.map((option) => {
                const checked = selected === null || selected.has(option);
                return (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-[#1E2520] hover:bg-[#F7F2EA]"
                  >
                    <input
                      type="checkbox"
                      className="accent-[#356B43]"
                      checked={checked}
                      onChange={() => onChange(toggleCategoryValue(selected, options, option))}
                    />
                    {option}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function searchLabelFor(label: string): string {
  if (label === 'County') return 'Search counties';
  if (label === 'Status') return 'Search statuses';
  return `Search ${label.toLowerCase()}s`;
}

interface MapAreaFiltersProps {
  types?: readonly string[];
  subtypes?: readonly string[];
  counties?: readonly string[];
  statuses?: readonly string[];
  selectedTypes?: ReadonlySet<string> | null;
  selectedSubtypes?: ReadonlySet<string> | null;
  selectedCounties?: ReadonlySet<string> | null;
  selectedStatuses?: ReadonlySet<string> | null;
  onTypesChange?: (next: ReadonlySet<string> | null) => void;
  onSubtypesChange?: (next: ReadonlySet<string> | null) => void;
  onCountiesChange?: (next: ReadonlySet<string> | null) => void;
  onStatusesChange?: (next: ReadonlySet<string> | null) => void;
}

export default function MapAreaFilters({
  types = [],
  subtypes = [],
  counties = [],
  statuses = [],
  selectedTypes = null,
  selectedSubtypes = null,
  selectedCounties = null,
  selectedStatuses = null,
  onTypesChange = () => {},
  onSubtypesChange = () => {},
  onCountiesChange = () => {},
  onStatusesChange = () => {},
}: MapAreaFiltersProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const disabled = types.length === 0 && subtypes.length === 0 && counties.length === 0 && statuses.length === 0;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-[#E4EBE4] rounded-xl text-[#254431] font-medium hover:bg-[#F7F2EA] hover:border-[#86A98A] transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        Filter
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-h-[calc(80vh-8rem)] overflow-y-auto rounded-xl border-2 border-[#E4EBE4] bg-white shadow-xl">
          {types.length > 0 && (
            <FilterSection label="Type" options={types} selected={selectedTypes} onChange={onTypesChange} />
          )}
          {subtypes.length > 0 && (
            <FilterSection
              label="Subtype"
              options={subtypes}
              selected={selectedSubtypes}
              onChange={onSubtypesChange}
            />
          )}
          {counties.length > 0 && (
            <FilterSection
              label="County"
              options={counties}
              selected={selectedCounties}
              onChange={onCountiesChange}
            />
          )}
          {statuses.length > 0 && (
            <FilterSection
              label="Status"
              options={statuses}
              selected={selectedStatuses}
              onChange={onStatusesChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
