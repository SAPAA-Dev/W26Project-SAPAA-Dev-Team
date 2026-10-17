'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Search, X } from 'lucide-react';
import {
  createSite,
  findSitesWithName,
  getAllSites,
  getArchivedSites,
  getCounties,
  getProtectedAreaChoices,
  getSiteSuggestions,
  toggleSiteActive,
  updateSite,
  type SiteSummary as AdminSite,
} from '@/utils/supabase/queries';
import { availableProtectedAreas } from '@/lib/sites/availableProtectedAreas';
import { useListbox } from '@/hooks/useListbox';
import { useApi } from '@/app/v2/_lib/useApi';
import { btn, ErrorState, Field, fieldAria, inputCls, Sheet } from '@/app/v2/_components/flows/ui';
import { errMsg, Toggle } from './shared';

/** Admin reads shared by the site sheets. Keys start with "admin:" so invalidate('admin:') refreshes them all. */
export const useAllSites = (on: boolean) => useApi(on ? 'admin:all-sites' : null, getAllSites);
export const useArchivedSites = (on: boolean) => useApi(on ? 'admin:archived-sites' : null, getArchivedSites);

interface Saved {
  name: string;
}

/**
 * Add site (AddSiteModal) and Edit site (EditSiteModal) in one sheet: name, county typeahead,
 * protected area combobox and, when editing, the active switch. Same server actions as the classic modals.
 */
export function SiteSheet({
  open,
  onClose,
  siteId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** Omit to add a site. */
  siteId?: number;
  onSaved: (s: Saved) => void;
}) {
  const sites = useAllSites(open);
  const archived = useArchivedSites(open);
  const counties = useApi(open ? 'admin:counties' : null, getCounties);
  const areas = useApi(open ? 'admin:areas' : null, getProtectedAreaChoices);
  const error = sites.error ?? archived.error ?? counties.error ?? areas.error;
  const ready = sites.data && archived.data && counties.data && areas.data;
  const current = siteId === undefined ? null : sites.data?.find((s) => s.id === siteId);
  const editing = siteId !== undefined;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit site' : 'Add a site'}
      description={editing ? current?.namesite : 'New sites start active, with no steward.'}
    >
      {error ? (
        <ErrorState
          title="The site details didn’t load"
          error={error}
          onRetry={() => {
            for (const r of [sites, archived, counties, areas]) if (r.error) r.refetch();
          }}
        />
      ) : !ready || (editing && !current) ? (
        <div aria-busy="true" className="flex flex-col gap-4 py-2">
          <span className="sr-only" role="status">
            Loading site details
          </span>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[76px] animate-pulse rounded-[var(--radius-m)] bg-[var(--bg-sunken)]" />
          ))}
        </div>
      ) : (
        <SiteForm
          key={siteId ?? 'new'}
          site={current ?? null}
          areas={availableProtectedAreas(areas.data!, [...sites.data!, ...archived.data!], siteId ?? null)}
          counties={counties.data!}
          onCancel={onClose}
          onSaved={onSaved}
        />
      )}
    </Sheet>
  );
}

function SiteForm({
  site,
  areas,
  counties,
  onCancel,
  onSaved,
}: {
  site: AdminSite | null;
  areas: { id: number; name: string; fid: number; area_type: string }[];
  counties: { id: number; county: string }[];
  onCancel: () => void;
  onSaved: (s: Saved) => void;
}) {
  const [name, setName] = useState(site?.namesite ?? '');
  const [countyId, setCountyId] = useState<number | null>(site?.ab_county ?? null);
  const [areaId, setAreaId] = useState<number | null>(site?.protected_area_id ?? null);
  const [active, setActive] = useState(site?.is_active ?? true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [dupes, setDupes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestions = useApi(site ? null : 'admin:site-suggestions', getSiteSuggestions);

  const checkDupes = async (value: string) => {
    if (site || !value.trim()) return;
    // The warning only helps; the database still refuses an exact duplicate.
    setDupes(await findSitesWithName(value).catch(() => []));
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Enter the site’s name.');
      document.getElementById('admin-site-name')?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = site ? await updateSite(site.id, trimmed, countyId, areaId) : await createSite(trimmed, countyId, areaId);
      if (!result.ok) throw new Error(result.error);
      if (site && site.is_active !== active) await toggleSiteActive(site.id, active);
      onSaved({ name: trimmed });
    } catch (e) {
      setError(errMsg(e, 'The site was not saved. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const nameMatches = (suggestions.data ?? [])
    .filter((s) => name.trim() && s.name.toLowerCase().includes(name.trim().toLowerCase()))
    .slice(0, 8);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-5 pt-1"
    >
      <Combo
        id="admin-site-name"
        label="Site name"
        required
        value={name}
        onText={(v) => {
          setName(v);
          setNameError(null);
          setDupes([]);
        }}
        onBlurText={checkDupes}
        options={nameMatches}
        optionLabel={(s) => s.name}
        optionDetail={(s) => s.category}
        listLabel="Suggestions from the SAPAA map"
        onPick={(s) => {
          setName(s.name);
          void checkDupes(s.name);
        }}
        error={nameError}
        hint={site ? 'The name is also the site’s web address, so links to the old name stop working.' : undefined}
        disabled={busy}
      />
      {dupes.length > 0 && (
        <p className="-mt-3 flex items-start gap-2 rounded-[var(--radius-m)] bg-[color-mix(in_srgb,var(--honey)_18%,transparent)] px-3 py-2.5 text-sm text-[var(--st-due-ink)]">
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>A site named “{dupes.join('”, “')}” already exists. Check this is not a duplicate before you save.</span>
        </p>
      )}

      <Picker
        id="admin-site-county"
        label="County"
        options={counties}
        selected={counties.find((c) => c.id === countyId) ?? null}
        optionLabel={(c) => c.county}
        onChange={(c) => setCountyId(c?.id ?? null)}
        placeholder="Search counties"
        empty="No county matches."
        disabled={busy}
      />

      <Picker
        id="admin-site-area"
        label="Protected area"
        options={areas}
        selected={areas.find((a) => a.id === areaId) ?? null}
        optionLabel={(a) => a.name}
        optionDetail={(a) => `FID ${a.fid} · ${a.area_type}`}
        match={(a, q) => a.name.toLowerCase().includes(q) || String(a.fid).includes(q) || a.area_type.toLowerCase().includes(q)}
        onChange={(a) => setAreaId(a?.id ?? null)}
        placeholder="Search by name, FID or type"
        empty="No free protected area matches. Areas linked to other sites are not listed."
        hint="Links the site to its boundary on the map."
        disabled={busy}
      />

      {site && (
        <div className="border-t border-[var(--line)] pt-2">
          <Toggle
            label="Active"
            hint={active ? 'Stewards can see and inspect this site.' : 'Hidden from stewards. Admins still see it.'}
            checked={active}
            onChange={setActive}
            disabled={busy}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={busy} className={`${btn.secondary} flex-1`}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={`${btn.primary} flex-1`}>
          {busy && <Loader2 size={18} aria-hidden className="animate-spin" />}
          {site ? 'Save site' : 'Add site'}
        </button>
      </div>
    </form>
  );
}

/* ---------- comboboxes on the shared useListbox pattern ---------- */

/** Free text with suggestions (the site name). */
function Combo<T>({
  id,
  label,
  required,
  value,
  onText,
  onBlurText,
  options,
  optionLabel,
  optionDetail,
  listLabel,
  onPick,
  error,
  hint,
  disabled,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onText: (v: string) => void;
  onBlurText: (v: string) => void;
  options: T[];
  optionLabel: (o: T) => string;
  optionDetail?: (o: T) => string;
  listLabel: string;
  onPick: (o: T) => void;
  error: string | null;
  hint?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const shown = open && options.length > 0;
  const lb = useListbox({
    options,
    open: shown,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onPick: (o) => {
      onPick(o);
      setOpen(false);
    },
  });
  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <input
          {...fieldAria(id, error, hint)}
          {...lb.inputProps}
          type="text"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onText(e.target.value);
            setOpen(true);
            lb.resetActive();
          }}
          onBlur={() => {
            setOpen(false);
            onBlurText(value);
          }}
          className={`${inputCls} h-12`}
        />
        {shown && <Options lb={lb} options={options} optionLabel={optionLabel} optionDetail={optionDetail} listLabel={listLabel} />}
      </div>
    </Field>
  );
}

/** Pick one from a long list (county, protected area): a chip when chosen, a search box when not. */
function Picker<T extends { id: number }>({
  id,
  label,
  options,
  selected,
  optionLabel,
  optionDetail,
  match,
  onChange,
  placeholder,
  empty,
  hint,
  disabled,
}: {
  id: string;
  label: string;
  options: T[];
  selected: T | null;
  optionLabel: (o: T) => string;
  optionDetail?: (o: T) => string;
  match?: (o: T, q: string) => boolean;
  onChange: (o: T | null) => void;
  placeholder: string;
  empty: string;
  hint?: string;
  disabled?: boolean;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return options.filter((o) => !t || (match ? match(o, t) : optionLabel(o).toLowerCase().includes(t))).slice(0, 50);
  }, [options, q, match, optionLabel]);
  const lb = useListbox({
    options: matches,
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onPick: (o) => {
      onChange(o);
      setQ('');
      setOpen(false);
    },
  });

  return (
    <Field id={id} label={label} hint={hint}>
      {selected ? (
        <div className="flex min-h-12 items-center gap-2 rounded-[var(--radius-m)] border border-[var(--forest)] bg-[var(--surface)] py-1.5 pr-1 pl-3">
          <span className="min-w-0 flex-1">
            <span id={id} className="block truncate text-[16px] font-semibold">
              {optionLabel(selected)}
            </span>
            {optionDetail && <span className="block truncate text-sm text-[var(--ink-2)]">{optionDetail(selected)}</span>}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="grid size-11 shrink-0 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--bg-sunken)]"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={17} aria-hidden className="pointer-events-none absolute top-[15px] left-3 z-10 text-[var(--ink-2)]" />
          <input
            {...fieldAria(id, null, hint)}
            {...lb.inputProps}
            type="text"
            autoComplete="off"
            placeholder={placeholder}
            value={q}
            disabled={disabled}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              lb.resetActive();
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className={`${inputCls} h-12 pl-9`}
          />
          {open &&
            (matches.length ? (
              <Options lb={lb} options={matches} optionLabel={optionLabel} optionDetail={optionDetail} listLabel={label} />
            ) : (
              <p className="absolute inset-x-0 top-full z-20 mt-1 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--ink-2)] shadow-[0_8px_24px_rgba(18,42,28,0.14)]">
                {empty}
              </p>
            ))}
        </div>
      )}
    </Field>
  );
}

function Options<T>({
  lb,
  options,
  optionLabel,
  optionDetail,
  listLabel,
}: {
  lb: ReturnType<typeof useListbox<T>>;
  options: T[];
  optionLabel: (o: T) => string;
  optionDetail?: (o: T) => string;
  listLabel: string;
}) {
  return (
    <ul
      {...lb.listProps}
      aria-label={listLabel}
      className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(18,42,28,0.14)]"
    >
      {options.map((o, i) => (
        <li
          key={i}
          {...lb.optionProps(i)}
          className="flex min-h-11 cursor-pointer flex-col justify-center px-3 py-1.5 hover:bg-[var(--bg-sunken)] aria-selected:bg-[var(--bg-sunken)]"
        >
          <span className="text-[15px] font-semibold">{optionLabel(o)}</span>
          {optionDetail && <span className="text-sm text-[var(--ink-2)]">{optionDetail(o)}</span>}
        </li>
      ))}
    </ul>
  );
}
