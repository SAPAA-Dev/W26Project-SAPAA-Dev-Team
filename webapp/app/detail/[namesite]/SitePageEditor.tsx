"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Save, X } from "lucide-react";
import { SITE_PAGE_FIELDS } from "@/lib/sitePageFields";
import { SitePageFieldValue, updateSitePageFields } from "@/utils/supabase/queries";

interface SitePageEditorProps {
  siteId: number;
  fields: SitePageFieldValue[];
  onSaved: () => void;
}

function draftsFrom(fields: SitePageFieldValue[]): SitePageFieldValue[] {
  return SITE_PAGE_FIELDS.map((definition) => {
    const stored = fields.find((field) => field.fieldKey === definition.key);
    return {
      fieldKey: definition.key,
      value: stored?.value ?? "",
      isVisible: stored?.isVisible ?? true,
    };
  });
}

export default function SitePageEditor({ siteId, fields, onSaved }: SitePageEditorProps) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<SitePageFieldValue[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openEditor = () => {
    setDrafts(draftsFrom(fields));
    setErrorMessage(null);
    setEditing(true);
  };

  const changeDraft = (fieldKey: string, change: Partial<SitePageFieldValue>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.fieldKey === fieldKey ? { ...draft, ...change } : draft))
    );
  };

  const save = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      await updateSitePageFields(siteId, drafts);
      setEditing(false);
      onSaved();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save the site page.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setEditing(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editing, saving]);

  if (!editing) {
    return (
      <button
        type="button"
        data-testid="edit-site-page-button"
        onClick={openEditor}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Edit site page
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div
        data-testid="site-page-editor"
        className="bg-white rounded-2xl shadow-2xl w-[560px] max-w-[95vw] border-2 border-[#E4EBE4] overflow-hidden text-[#1E2520]"
      >
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Pencil className="w-6 h-6" />
            Edit site page
          </h2>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            aria-label="Close"
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {SITE_PAGE_FIELDS.map((definition) => {
            const draft = drafts.find((candidate) => candidate.fieldKey === definition.key);
            if (!draft) return null;
            return (
              <div
                key={definition.key}
                data-testid={`site-page-field-${definition.key}`}
                className={`rounded-xl border-2 p-4 ${draft.isVisible ? "border-[#86A98A] bg-[#F7F2EA]" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  {definition.kind === "url" ? (
                    <label htmlFor={`site-page-${definition.key}`} className="font-semibold text-[#254431]">
                      {definition.label}
                    </label>
                  ) : (
                    <span className="font-semibold text-[#254431]">{definition.label}</span>
                  )}
                  <button
                    type="button"
                    data-testid={`site-page-visibility-${definition.key}`}
                    aria-pressed={draft.isVisible}
                    onClick={() => changeDraft(definition.key, { isVisible: !draft.isVisible })}
                    disabled={saving}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                      draft.isVisible ? "bg-[#356B43] text-white" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {draft.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {draft.isVisible ? "Shown" : "Hidden"}
                  </button>
                </div>
                {definition.kind === "url" ? (
                  <input
                    id={`site-page-${definition.key}`}
                    type="url"
                    placeholder="https://"
                    value={draft.value ?? ""}
                    onChange={(event) => changeDraft(definition.key, { value: event.target.value })}
                    disabled={saving}
                    className="mt-2 w-full px-3 py-2 bg-white border-2 border-[#E4EBE4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#356B43]"
                  />
                ) : (
                  <p className="mt-2 text-sm text-[#7A8075]">
                    Assign the steward with the Steward control on the site page. This only shows or hides it.
                  </p>
                )}
              </div>
            );
          })}
          {errorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="px-6 py-3 bg-[#E4EBE4] text-[#254431] rounded-xl font-semibold hover:bg-[#d4d4d4] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="site-page-save-button"
            onClick={save}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#356B43] to-[#254431] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
