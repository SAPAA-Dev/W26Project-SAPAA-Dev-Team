"use client";

import { useState, useEffect, useMemo } from "react";
import { X, MapPin, Save, Pencil, Search } from "lucide-react";
import { County } from "@/utils/supabase/queries";

interface EditSiteModalProps {
  visible: boolean;
  site: { id: number; namesite: string; ab_county: number | null } | null;
  counties: County[];
  onClose: () => void;
  onSave: (data: { id: number; namesite: string; ab_county: number | null }) => void;
  saving: boolean;
}

export default function EditSiteModal({
  visible,
  site,
  counties,
  onClose,
  onSave,
  saving,
}: EditSiteModalProps) {
  const [namesite, setNamesite] = useState("");
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [countySearch, setCountySearch] = useState("");
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false);

  useEffect(() => {
    if (site) {
      setNamesite(site.namesite);
      const match = counties.find((c) => c.id === site.ab_county) ?? null;
      setSelectedCounty(match);
      setCountySearch("");
      setCountyDropdownOpen(false);
    }
  }, [site, counties]);

  const filteredCounties = useMemo(() => {
    const lower = countySearch.toLowerCase();
    return counties.filter((c) => c.county.toLowerCase().includes(lower));
  }, [counties, countySearch]);

  const handleSave = () => {
    if (!namesite.trim()) {
      alert("Site name is required.");
      return;
    }
    if (!site) return;
    onSave({ id: site.id, namesite: namesite.trim(), ab_county: selectedCounty?.id ?? null });
  };

  if (!visible || !site) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div data-testid="edit-site-modal" className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[95vw] border-2 border-[#E4EBE4] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Pencil className="w-6 h-6" />
              Edit Site
            </h2>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#356B43]" />
              Site Name
            </label>
            <input
              data-testid="edit-site-name-input"
              type="text"
              className="w-full px-4 py-3 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-all"
              placeholder="Enter site name"
              value={namesite}
              onChange={(e) => setNamesite(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* County - searchable dropdown */}
          <div>
            <label className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#356B43]" />
              County
            </label>
            {selectedCounty ? (
              <div className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                <span>{selectedCounty.county}</span>
                <button
                  onClick={() => {
                    setSelectedCounty(null);
                    setCountySearch("");
                  }}
                  disabled={saving}
                  className="text-gray-400 hover:text-gray-700 transition-colors ml-2 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  data-testid="edit-site-county-search"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#1e4d2b] focus:bg-white transition-colors placeholder:text-gray-300 text-gray-700"
                  placeholder="Search by county..."
                  value={countySearch}
                  onChange={(e) => {
                    setCountySearch(e.target.value);
                    setCountyDropdownOpen(true);
                  }}
                  onFocus={() => setCountyDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCountyDropdownOpen(false), 150)}
                  disabled={saving}
                />
                {countyDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredCounties.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">No counties found</p>
                    ) : (
                      filteredCounties.map((c) => (
                        <div
                          key={c.id}
                          className="px-3 py-2 cursor-pointer hover:bg-green-50 transition-colors"
                          onMouseDown={() => {
                            setSelectedCounty(c);
                            setCountySearch("");
                            setCountyDropdownOpen(false);
                          }}
                        >
                          <p className="text-sm font-medium text-gray-800">{c.county}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            className="px-6 py-3 bg-[#E4EBE4] text-[#254431] rounded-xl font-semibold hover:bg-[#d4d4d4] transition-all"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            data-testid="edit-site-save-button"
            className="px-6 py-3 bg-gradient-to-r from-[#356B43] to-[#254431] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
