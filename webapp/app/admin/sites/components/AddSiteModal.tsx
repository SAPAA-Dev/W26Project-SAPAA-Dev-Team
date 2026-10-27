"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Plus, Pencil, AlertTriangle } from "lucide-react";
import { County, ProtectedAreaChoice, SiteSuggestion, findSitesWithName, getSiteSuggestions } from "@/utils/supabase/queries";
import ProtectedAreaField from "./ProtectedAreaField";
import { useListbox } from "@/hooks/useListbox";

const MAX_SHOWN_SUGGESTIONS = 8;

interface AddSiteModalProps {
  visible: boolean;
  counties: County[];
  protectedAreas: ProtectedAreaChoice[];
  onClose: () => void;
  onSave: (data: { namesite: string; ab_county: number | null; protected_area_id: number | null }) => Promise<boolean>;
  saving: boolean;
}

export default function AddSiteModal({
  visible,
  counties,
  protectedAreas,
  onClose,
  onSave,
  saving,
}: AddSiteModalProps) {
  const [namesite, setNamesite] = useState("");
  const [countyId, setCountyId] = useState("");
  const [protectedAreaId, setProtectedAreaId] = useState<number | null>(null);
  const [nameMissing, setNameMissing] = useState(false);
  const [duplicateNames, setDuplicateNames] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SiteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getSiteSuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [visible]);

  const typedName = namesite.trim().toLowerCase();
  const matchingSuggestions = typedName
    ? suggestions
        .filter((suggestion) => suggestion.name.toLowerCase().includes(typedName))
        .slice(0, MAX_SHOWN_SUGGESTIONS)
    : [];
  const listbox = useListbox({
    options: matchingSuggestions,
    open: showSuggestions && matchingSuggestions.length > 0,
    onOpen: () => setShowSuggestions(true),
    onClose: () => setShowSuggestions(false),
    onPick: (suggestion) => chooseSuggestion(suggestion.name),
  });

  if (!visible) return null;

  const resetForm = () => {
    setNamesite("");
    setCountyId("");
    setProtectedAreaId(null);
    setNameMissing(false);
    setDuplicateNames([]);
    setShowSuggestions(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const checkForDuplicates = async (name: string = namesite) => {
    try {
      setDuplicateNames(await findSitesWithName(name));
    } catch {
      // The warning only helps the admin. If the check fails, the database still refuses an exact duplicate.
      setDuplicateNames([]);
    }
  };

  const handleSave = async () => {
    if (!namesite.trim()) {
      setNameMissing(true);
      return;
    }
    const saved = await onSave({
      namesite: namesite.trim(),
      ab_county: countyId ? Number(countyId) : null,
      protected_area_id: protectedAreaId,
    });
    if (saved) resetForm();
  };

  const chooseSuggestion = (name: string) => {
    setNamesite(name);
    setNameMissing(false);
    setShowSuggestions(false);
    checkForDuplicates(name);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div data-testid="add-site-modal" className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto border-2 border-[#E4EBE4] animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Plus className="w-6 h-6" />
              Add Site
            </h2>
            <button
              onClick={handleClose}
              disabled={saving}
              aria-label="Close"
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label htmlFor="add-site-name" className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#356B43]" />
              Site Name <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="add-site-name"
                data-testid="add-site-name-input"
                {...listbox.inputProps}
                type="text"
                autoComplete="off"
                aria-invalid={nameMissing}
                className={`w-full px-4 py-3 bg-[#F7F2EA] border-2 rounded-xl text-[#1E2520] placeholder:text-[#5B655D] focus:outline-none focus:ring-2 focus:ring-[#356B43] transition-all ${
                  nameMissing ? "border-red-500" : "border-[#86A98A]"
                }`}
                placeholder="Enter site name"
                value={namesite}
                onChange={(e) => {
                  setNamesite(e.target.value);
                  setNameMissing(false);
                  setDuplicateNames([]);
                  setShowSuggestions(true);
                  listbox.resetActive();
                }}
                onBlur={() => {
                  setShowSuggestions(false);
                  checkForDuplicates();
                }}
                disabled={saving}
              />
              {showSuggestions && matchingSuggestions.length > 0 && (
                <ul
                  {...listbox.listProps}
                  aria-label="Suggestions from the SAPAA map"
                  data-testid="add-site-suggestions"
                  className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto"
                >
                  <li role="presentation" className="px-3 pt-2 pb-1 text-xs text-[#5B655D]">Suggestions from the SAPAA map</li>
                  {matchingSuggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.name}
                      {...listbox.optionProps(index)}
                      className="w-full text-left px-3 py-2 cursor-pointer hover:bg-green-50 aria-selected:bg-green-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-800">{suggestion.name}</span>
                      <span className="ml-2 text-xs text-[#5B655D]">{suggestion.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {nameMissing && (
              <p className="mt-1 text-sm text-red-600">Site name is required.</p>
            )}
            {duplicateNames.length > 0 && (
              <div data-testid="add-site-duplicate-warning" className="mt-2 flex items-start gap-2 rounded-xl border-2 border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  A site named &quot;{duplicateNames.join('", "')}&quot; already exists. Check that this is not a duplicate before you save.
                </span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="add-site-county" className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#356B43]" />
              County
            </label>
            <select
              id="add-site-county"
              data-testid="add-site-county-select"
              className="w-full px-4 py-3 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] focus:outline-none focus:ring-2 focus:ring-[#356B43] transition-all"
              value={countyId}
              onChange={(e) => setCountyId(e.target.value)}
              disabled={saving}
            >
              <option value="">No county</option>
              {counties.map((county) => (
                <option key={county.id} value={county.id}>
                  {county.county}
                </option>
              ))}
            </select>
          </div>

          <ProtectedAreaField
            areas={protectedAreas}
            selectedId={protectedAreaId}
            onChange={setProtectedAreaId}
            disabled={saving}
            testIdPrefix="add-site-protected-area"
          />
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            className="px-6 py-3 bg-[#E4EBE4] text-[#254431] rounded-xl font-semibold hover:bg-[#d4d4d4] transition-all"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            data-testid="add-site-save-button"
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
                <Plus className="w-4 h-4" />
                Add Site
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
