'use client';

import { useMemo, useSyncExternalStore } from 'react';

/** localStorage key prefix. The Sites home lists these for its "Resume draft" banner. */
export const DRAFT_PREFIX = 'boreal-draft:';

export type DraftAnswer = string | string[] | boolean;

/** Keep siteName, sectionIndex, sectionCount and updatedAt: the Sites home reads them. */
export interface Draft {
  siteName: string;
  /** 0-based section the steward was on (never the review step). */
  sectionIndex: number;
  sectionCount: number;
  /** Question id -> answer. "<id>_other" keys hold the free text for an "Other" choice. */
  answers: Record<string, DraftAnswer>;
  /** The steward agreed to the "Before you go" safety card. */
  accepted: boolean;
  /** Epoch milliseconds. */
  updatedAt: number;
}

export interface DraftEntry extends Draft {
  slug: string;
}

const isDraft = (d: unknown): d is Draft =>
  !!d && typeof d === 'object' && typeof (d as Draft).siteName === 'string' && typeof (d as Draft).answers === 'object';

export function readDraft(slug: string, userId: string): Draft | null {
  try {
    const d: unknown = JSON.parse(localStorage.getItem(DRAFT_PREFIX + userId + ':' + slug) ?? 'null');
    return isDraft(d) ? d : null;
  } catch {
    return null; // no storage (server render, private mode) or an unreadable draft
  }
}

/** False when storage is blocked or full, so the form can say the draft is not saved. */
export function writeDraft(slug: string, draft: Draft, userId: string): boolean {
  try {
    localStorage.setItem(DRAFT_PREFIX + userId + ':' + slug, JSON.stringify(draft));
    emit();
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(slug: string, userId: string) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + userId + ':' + slug);
    emit();
  } catch {
    // nothing stored, nothing to clear
  }
}

// Writes in this tab do not fire 'storage', so subscribers are told directly.
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

// A string snapshot compares by value, so React only re-renders when a draft changes.
function snapshot(userId?: string): string {
  if (!userId) return '[]';
  const prefix = DRAFT_PREFIX + userId + ':';
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    return JSON.stringify(keys.map((k) => [k.slice(prefix.length), localStorage.getItem(k)]));
  } catch {
    return '[]';
  }
}

/** Drafts owned by this account, newest first. Empty during the server render. */
export function useDrafts(userId?: string): DraftEntry[] {
  const raw = useSyncExternalStore(subscribe, () => snapshot(userId), () => '[]');
  return useMemo(() => {
    const out: DraftEntry[] = [];
    for (const [slug, json] of JSON.parse(raw) as [string, string | null][]) {
      try {
        const d: unknown = JSON.parse(json ?? 'null');
        if (isDraft(d)) out.push({ ...d, slug });
      } catch {
        // skip a draft that cannot be read
      }
    }
    return out.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [raw]);
}
