'use client';

import { useState } from 'react';
import type { BoundaryFeature } from '@/lib/map/boundaries';
import { useListbox } from '@/hooks/useListbox';

const MAX_MATCHES = 8;

interface MapSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
  /** The protected areas the search leaves on the map. Null outside the map view. */
  matches: readonly BoundaryFeature[] | null;
  onPick: (area: BoundaryFeature) => void;
}

/**
 * The sites search box. In the map view it also lists the matching protected areas,
 * so the user can pick one and the map centres on it (US 2.0.6 AT3).
 */
export default function MapSearchInput({
  value,
  onChange,
  placeholder,
  className,
  matches,
  onPick,
}: MapSearchInputProps) {
  const [open, setOpen] = useState(false);
  // An empty search matches every area, so the list waits until the user types.
  const options = matches !== null && value.trim() !== '' ? matches.slice(0, MAX_MATCHES) : [];
  const expanded = open && options.length > 0;
  const listbox = useListbox({
    options,
    open: expanded,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onPick: (area) => {
      setOpen(false);
      onPick(area);
    },
  });

  return (
    <>
      <input
        type="text"
        aria-label="Search"
        {...(matches !== null ? listbox.inputProps : {})}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          listbox.resetActive();
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={className}
      />
      {expanded && (
        <ul
          {...listbox.listProps}
          aria-label="Matching protected areas"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border-2 border-[#E4EBE4] bg-white shadow-lg"
        >
          {options.map((area, index) => (
            <li
              key={area.id}
              {...listbox.optionProps(index)}
              className="cursor-pointer px-4 py-2 hover:bg-[#F7F2EA] aria-selected:bg-[#F7F2EA]"
            >
              <span className="block text-sm font-medium text-[#254431]">{area.properties.name}</span>
              {area.properties.oc_name && (
                <span className="block text-xs text-[#5B655D]">{area.properties.oc_name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
