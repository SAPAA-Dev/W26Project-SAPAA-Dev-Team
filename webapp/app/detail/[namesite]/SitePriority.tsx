"use client";

import React, { useEffect, useState } from "react";
import { Gauge, TriangleAlert } from "lucide-react";
import {
  getSitePriority,
  saveSitePriorityScores,
  SitePriority as SitePriorityData,
} from "@/utils/site-priority-actions";
import {
  PRIORITY_MAX,
  PRIORITY_SCORE_LABELS,
  PRIORITY_SCORE_MAX,
  PRIORITY_SCORE_MIN,
  PriorityScores,
} from "@/lib/sitePriority";

const SCORE_KEYS = Object.keys(PRIORITY_SCORE_LABELS) as Array<keyof PriorityScores>;

export default function SitePriority({ siteId, isAdmin }: { siteId: number; isAdmin: boolean }) {
  const [data, setData] = useState<SitePriorityData | null>(null);
  // A failed lookup is not the same as a site with no scores, so it gets its own message.
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<keyof PriorityScores, string>>({ abuses: "", biological: "", time: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // One request at a time, so a double click does not save twice.
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSitePriority(siteId)
      .then((found) => { setData(found); setLoadFailed(found === null); })
      .catch(() => { setData(null); setLoadFailed(true); });
  }, [siteId]);

  function startEditing() {
    const scores = data?.scores;
    setDraft({
      abuses: scores ? String(scores.abuses) : "",
      biological: scores ? String(scores.biological) : "",
      time: scores ? String(scores.time) : "",
    });
    setMessage(null);
    setSaved(false);
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await saveSitePriorityScores(siteId, {
        abuses: draft.abuses === "" ? null : Number(draft.abuses),
        biological: draft.biological === "" ? null : Number(draft.biological),
        time: draft.time === "" ? null : Number(draft.time),
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setData(result.priority);
      setLoadFailed(false);
      setEditing(false);
      setSaved(true);
    } catch {
      setMessage("The scores were not saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1 text-[#E4EBE4]" data-testid="site-priority">
      <div className="flex items-center gap-2 text-base">
        <Gauge className="w-5 h-5" />
        {data?.priority != null ? (
          <span>
            To-visit priority:{" "}
            <span className="font-semibold" data-testid="site-priority-value">{data.priority}</span> of {PRIORITY_MAX}
          </span>
        ) : loadFailed ? (
          <span>The to-visit priority could not be loaded.</span>
        ) : (
          <span>To-visit priority not scored yet</span>
        )}
        {isAdmin && !editing && !loadFailed && (
          <button
            type="button"
            onClick={startEditing}
            className="ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm underline"
            data-testid="site-priority-edit"
          >
            {data?.scores ? "Edit scores" : "Score site"}
          </button>
        )}
      </div>

      {saved && (
        <p role="status" className="ml-7 text-sm font-medium" data-testid="site-priority-saved">
          Saved.
        </p>
      )}

      {data?.needsReassessment && (
        <p className="ml-7 flex items-center gap-1 text-sm font-semibold text-[#FFE9A8]" data-testid="site-priority-reminder">
          <TriangleAlert className="w-4 h-4" />
          These points were saved more than a year ago. Reassess them.
        </p>
      )}

      {data?.scores && (
        <ul className="ml-7 text-sm" data-testid="site-priority-scores">
          {SCORE_KEYS.map((key) => (
            <li key={key}>{PRIORITY_SCORE_LABELS[key]}: {data.scores![key]}</li>
          ))}
        </ul>
      )}

      {isAdmin && editing && (
        <form onSubmit={save} className="mt-2 bg-white text-[#254431] rounded-xl p-3 shadow-lg max-w-sm space-y-2">
          {SCORE_KEYS.map((key) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              {PRIORITY_SCORE_LABELS[key]}
              <input
                type="number"
                inputMode="numeric"
                min={PRIORITY_SCORE_MIN}
                max={PRIORITY_SCORE_MAX}
                step={1}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                className="w-16 border border-[#E4EBE4] rounded-lg px-2 py-1 text-sm"
                data-testid={`site-priority-input-${key}`}
              />
            </label>
          ))}
          <p className="text-xs">Each score is a whole number from {PRIORITY_SCORE_MIN} to {PRIORITY_SCORE_MAX}.</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold disabled:opacity-60"
              data-testid="site-priority-save"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm"
            >
              Cancel
            </button>
          </div>
          {message && <p className="text-sm text-red-700" role="alert">{message}</p>}
        </form>
      )}
    </div>
  );
}
