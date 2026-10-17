'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ClipboardCheck,
  Download,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  Link2,
  Loader2,
  PencilLine,
  Settings2,
  UserRoundCog,
} from 'lucide-react';
import type { SiteSummary } from '@/lib/api/v1/types';
import {
  archiveSite,
  getFormResponsesBySiteAdmin,
  getSiteDeleteImpact,
  getSitePageFields,
  updateSitePageFields,
  type FormResponse,
  type SiteDeleteImpact,
  type SitePageFieldValue,
} from '@/utils/supabase/queries';
import { assignSiteSteward, searchStewards, type StewardOption } from '@/utils/steward-actions';
import { SITE_PAGE_FIELDS } from '@/lib/sitePageFields';
import { useApi } from '@/app/v2/_lib/useApi';
import { btn, ErrorState, inputCls, Sheet } from '@/app/v2/_components/flows/ui';
import { formatDate } from '@/app/v2/_components/flows/format';
import { Confirm, downloadFile, errMsg, ImpactList, MenuRow, MenuRule, plural, refreshSite, toast, Toggle, useIsAdmin } from './shared';
import { SiteSheet } from './SiteSheet';
import { PdfSheet } from './pdf';

type Panel = 'menu' | 'edit' | 'links' | 'steward' | 'pdf' | 'quality' | 'archive';
type AdminResponse = FormResponse & { is_active: boolean };

/** All non-archived reports of a site with their answers and active flag (the classic admin page's read). */
export const useSiteResponses = (slug: string, on: boolean) =>
  useApi(on ? `admin:responses:${slug}` : null, () => getFormResponsesBySiteAdmin(slug));

/**
 * The admin layer of the site page: a Manage button on the hero (and an Inactive tag when the site is
 * hidden from stewards). Everything the classic /admin/sites/[id] page did for the site itself lives here.
 */
export default function AdminSiteTools({ slug, site }: { slug: string; site?: SiteSummary }) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const responses = useSiteResponses(slug, panel !== null);

  if (!isAdmin) return null;

  const close = () => {
    setPanel(null);
    // The sheets unmount; focus goes back to the button that opened them.
    requestAnimationFrame(() => trigger.current?.focus());
  };

  const exportFile = (kind: 'csv' | 'json') => {
    const rows = responses.data;
    if (!rows) return;
    const date = (r: AdminResponse) => r.inspection_date ?? r.created_at?.slice(0, 10) ?? '';
    if (kind === 'csv') {
      // Same columns as the classic export.
      const cells = [
        ['Date', 'Score', 'Steward', 'Naturalness Details', 'Active'],
        ...rows.map((r) => [date(r), r.naturalness_score ?? '', r.steward ?? '', r.naturalness_details ?? '', r.is_active ? 'Yes' : 'No']),
      ];
      downloadFile(
        `${slug}-inspections.csv`,
        cells.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'),
        'text/csv',
      );
    } else {
      downloadFile(`${slug}-inspections.json`, JSON.stringify({ site, inspections: rows }, null, 2), 'application/json');
    }
    toast(`${kind.toUpperCase()} downloaded: ${plural(rows.length, 'report')}.`);
  };

  const quality = (responses.data ?? []).map((r) => ({ r, ...qualityOf(r) }));
  const flagged = quality.filter((q) => q.issues.length).length;
  const loadingRows = !responses.data && !responses.error;

  return (
    <>
      <div className="pointer-events-none -mt-11 flex h-11 items-center justify-end gap-2">
        {site?.isActive === false && (
          <span className="pointer-events-auto flex h-8 items-center gap-1.5 rounded-full bg-[rgba(18,42,28,0.7)] px-3 text-[13px] font-bold text-[var(--honey)]">
            <EyeOff size={14} aria-hidden />
            Inactive
          </span>
        )}
        <button
          ref={trigger}
          type="button"
          onClick={() => setPanel('menu')}
          disabled={!site}
          aria-haspopup="dialog"
          className="press pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-[rgba(18,42,28,0.55)] px-4 text-[15px] font-semibold text-[var(--birch)] hover:bg-[var(--forest)] disabled:opacity-50"
        >
          <Settings2 size={18} aria-hidden />
          Manage
        </button>
      </div>

      {site && panel && (
        <>
          <Sheet
            open={panel === 'menu'}
            onClose={close}
            title="Manage site"
            description={site.isActive ? site.name : `${site.name} is inactive and hidden from stewards.`}
          >
            <MenuRow icon={PencilLine} label="Edit site" hint="Name, county, protected area, active" onClick={() => setPanel('edit')} />
            <MenuRow icon={Link2} label="Links and visibility" hint="What stewards see on this page" onClick={() => setPanel('links')} />
            <MenuRow
              icon={UserRoundCog}
              label="Steward"
              hint={site.steward ? site.steward.name : 'No steward yet'}
              onClick={() => setPanel('steward')}
            />
            <MenuRule />
            <MenuRow icon={Download} label="Export PDF" hint="Every report on this site" onClick={() => setPanel('pdf')} />
            <MenuRow
              icon={FileSpreadsheet}
              label="Download CSV"
              hint="One row per report"
              busy={loadingRows}
              disabled={!responses.data}
              onClick={() => exportFile('csv')}
            />
            <MenuRow
              icon={FileJson}
              label="Download JSON"
              hint="Reports with every answer"
              busy={loadingRows}
              disabled={!responses.data}
              onClick={() => exportFile('json')}
            />
            <MenuRow
              icon={ClipboardCheck}
              label="Data quality"
              hint={
                responses.data
                  ? flagged
                    ? `${plural(flagged, 'report')} missing something`
                    : 'Every report is complete'
                  : 'Checking reports'
              }
              disabled={!responses.data}
              onClick={() => setPanel('quality')}
            />
            {responses.error && (
              <p className="px-3 pt-1 text-sm text-[var(--clay-ink)]">
                Report data didn’t load, so exports are off. Close and reopen to retry.
              </p>
            )}
            <MenuRule />
            <MenuRow
              icon={Archive}
              label="Archive site"
              hint="Hide it everywhere. You can restore it."
              danger
              onClick={() => setPanel('archive')}
            />
          </Sheet>

          <SiteSheet
            open={panel === 'edit'}
            onClose={close}
            siteId={site.id}
            onSaved={({ name }) => {
              toast('Site saved.');
              refreshSite(slug, { site: true });
              close();
              if (name !== site.name) {
                refreshSite(name, { site: true });
                router.replace(`/v2/sites/${encodeURIComponent(name)}`);
              }
            }}
          />
          <LinksSheet open={panel === 'links'} onClose={close} siteId={site.id} slug={slug} />
          <StewardSheet open={panel === 'steward'} onClose={close} site={site} slug={slug} />
          <PdfSheet open={panel === 'pdf'} onClose={close} target={{ mode: 'site', siteName: site.name }} subject={site.name} />
          <Sheet
            open={panel === 'quality'}
            onClose={close}
            title="Data quality"
            description={`${plural(quality.length, 'report')}, newest first. Disabled reports are dimmed.`}
          >
            <ul className="divide-y divide-[var(--line)]">
              {quality.map(({ r, score, issues }) => (
                <li key={r.id} className={`flex gap-3 py-3 ${r.is_active ? '' : 'opacity-60'}`}>
                  <span className="min-w-0 flex-1">
                    <span className="num block font-semibold">
                      {formatDate(r.inspection_date ?? r.created_at)}
                      {r.inspection_no && <span className="font-normal text-[var(--ink-2)]"> · {r.inspection_no}</span>}
                    </span>
                    {!r.is_active && <span className="block text-sm font-semibold text-[var(--st-due-ink)]">Disabled</span>}
                    <span className="block text-sm text-[var(--ink-2)]">{issues.length ? issues.join(', ') : 'All data present'}</span>
                  </span>
                  <span
                    className="num shrink-0 text-[17px] font-bold"
                    style={{
                      color: score >= 80 ? 'var(--st-recent-ink)' : score >= 60 ? 'var(--st-due-ink)' : 'var(--st-overdue-ink)',
                    }}
                  >
                    {score}%
                  </span>
                </li>
              ))}
            </ul>
          </Sheet>
          <ArchiveSite
            open={panel === 'archive'}
            onClose={close}
            site={site}
            onDone={() => {
              setPanel(null);
              toast(`${site.name} archived. Restore it from Archived sites.`);
              refreshSite(slug, { site: true });
              router.push('/v2/sites');
            }}
          />
        </>
      )}
    </>
  );
}

/** The classic admin page's score: date 20, naturalness 25, answers 15, naturalness details 10. */
function qualityOf(r: AdminResponse) {
  const checks: [boolean, string, number][] = [
    [!(r.inspection_date ?? r.created_at), 'Missing date', 20],
    [!r.naturalness_score?.trim(), 'Missing naturalness score', 25],
    [!r.answers.length, 'No answers recorded', 15],
    [!r.naturalness_details?.trim(), 'Missing naturalness details', 10],
  ];
  const failed = checks.filter(([bad]) => bad);
  return {
    score: Math.max(0, 100 - failed.reduce((n, [, , cost]) => n + cost, 0)),
    issues: failed.map(([, label]) => label),
  };
}

/* ---------- archive the site, with its impact counts ---------- */

function ArchiveSite({ open, onClose, site, onDone }: { open: boolean; onClose: () => void; site: SiteSummary; onDone: () => void }) {
  const [impact, setImpact] = useState<SiteDeleteImpact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    getSiteDeleteImpact(site.id).then(
      (i) => live && setImpact(i),
      (e) => live && setError(errMsg(e, 'The connected records didn’t load. Close and try again.')),
    );
    return () => {
      live = false;
      setImpact(null);
      setError(null);
    };
  }, [open, site.id]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await archiveSite(site.id);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'The site was not archived. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Confirm
      open={open}
      onClose={onClose}
      title={`Archive ${site.name}?`}
      description="The site disappears from every list, map and export. Nothing is deleted: reports, photos and the steward stay with it until you restore it."
      confirmLabel={busy ? 'Archiving' : 'Archive site'}
      busy={busy}
      ready={!!impact}
      error={error}
      onConfirm={confirm}
    >
      <ImpactList
        loading={!impact && !error}
        rows={
          impact && [
            ['Inspection reports', impact.inspectionCount],
            ['Answers', impact.answerCount],
            ['Photos', impact.attachmentCount + impact.homepageImageCount],
            ['Steward assignments', impact.siteStewardCount],
          ]
        }
      />
    </Confirm>
  );
}

/* ---------- links and visibility (SitePageEditor) ---------- */

function LinksSheet({ open, onClose, siteId, slug }: { open: boolean; onClose: () => void; siteId: number; slug: string }) {
  const fields = useApi(open ? `admin:page-fields:${siteId}` : null, () => getSitePageFields(siteId));
  return (
    <Sheet open={open} onClose={onClose} title="Links and visibility" description="Hidden items stay saved. Admins always see the steward.">
      {fields.error ? (
        <ErrorState title="These settings didn’t load" error={fields.error} onRetry={fields.refetch} />
      ) : !fields.data ? (
        <div aria-busy="true" className="flex flex-col gap-3 py-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-24 animate-pulse rounded-[var(--radius-m)] bg-[var(--bg-sunken)]" />
          ))}
        </div>
      ) : (
        <LinksForm key={siteId} siteId={siteId} slug={slug} stored={fields.data} onDone={onClose} />
      )}
    </Sheet>
  );
}

function LinksForm({ siteId, slug, stored, onDone }: { siteId: number; slug: string; stored: SitePageFieldValue[]; onDone: () => void }) {
  // With no saved row the page shows the default link, so the form starts from it too.
  const [drafts, setDrafts] = useState<SitePageFieldValue[]>(() =>
    SITE_PAGE_FIELDS.map((d) => {
      const s = stored.find((f) => f.fieldKey === d.key);
      return {
        fieldKey: d.key,
        value: s ? (s.value ?? '') : (d.defaultValue ?? ''),
        isVisible: s?.isVisible ?? true,
      };
    }),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = (key: string, patch: Partial<SitePageFieldValue>) =>
    setDrafts((cur) => cur.map((d) => (d.fieldKey === key ? { ...d, ...patch } : d)));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await updateSitePageFields(siteId, drafts);
      if (!result.ok) throw new Error(result.error);
      toast('Site page saved.');
      refreshSite(slug);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'The site page was not saved. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-2"
    >
      {SITE_PAGE_FIELDS.map((def) => {
        const d = drafts.find((x) => x.fieldKey === def.key)!;
        const id = `admin-field-${def.key}`;
        return (
          <fieldset key={def.key} className="border-b border-[var(--line)] pb-3 last:border-0">
            <legend className="sr-only">{def.label}</legend>
            <Toggle
              label={def.label}
              hint={d.isVisible ? 'Shown on the site page' : 'Hidden from stewards'}
              checked={d.isVisible}
              onChange={(v) => change(def.key, { isVisible: v })}
              disabled={busy}
            />
            {def.kind === 'url' ? (
              <>
                <label htmlFor={id} className="sr-only">
                  {def.label} link
                </label>
                <input
                  id={id}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={d.value ?? ''}
                  onChange={(e) => change(def.key, { value: e.target.value })}
                  disabled={busy}
                  className={`${inputCls} h-12`}
                />
              </>
            ) : (
              <p className="text-sm text-[var(--ink-2)]">Choose the person under Steward. This only shows or hides them.</p>
            )}
          </fieldset>
        );
      })}
      {error && (
        <p role="alert" className="text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${btn.primary} mt-2 w-full`}>
        {busy && <Loader2 size={18} aria-hidden className="animate-spin" />}
        Save site page
      </button>
    </form>
  );
}

/* ---------- steward (SiteSteward): search people, tap one to assign ---------- */

function StewardSheet({ open, onClose, site, slug }: { open: boolean; onClose: () => void; site: SiteSummary; slug: string }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StewardOption[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const term = q.trim();

  // Search as the admin types, 250 ms after the last key.
  useEffect(() => {
    if (!term) return;
    let live = true;
    const t = setTimeout(() => {
      setSearching(true);
      searchStewards(term)
        .then((r) => {
          if (!live) return;
          setResults(r);
          setError(null);
        })
        .catch(() => live && setError('The search failed. Try again.'))
        .finally(() => live && setSearching(false));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [term]);

  const shown = term ? results : null;

  const assign = async (p: StewardOption) => {
    setBusyId(p.id);
    setError(null);
    try {
      const r = await assignSiteSteward(site.id, p.id);
      if (!r.success) throw new Error(r.error);
      toast(`${p.displayName} is now the steward.`);
      refreshSite(slug, { site: true });
      setQ('');
      setResults(null);
      onClose();
    } catch (e) {
      setError(errMsg(e, 'The steward was not assigned. Try again.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Steward"
      description={site.steward ? `Now: ${site.steward.name}. Picking someone else replaces them.` : 'No steward yet.'}
    >
      <label htmlFor="admin-steward-q" className="text-[15px] font-semibold">
        Search people by name
      </label>
      <div className="relative mt-1.5">
        <input
          id="admin-steward-q"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${inputCls} h-12 pr-10`}
        />
        {searching && <Loader2 size={18} aria-hidden className="absolute top-[15px] right-3 animate-spin text-[var(--ink-2)]" />}
      </div>
      <div aria-live="polite">
        {shown && shown.length === 0 && !searching && <p className="py-4 text-[15px] text-[var(--ink-2)]">No one matches “{term}”.</p>}
        {shown && shown.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--line)] rounded-[var(--radius-m)] border border-[var(--line)]">
            {shown.map((p) => {
              const current = p.id === site.steward?.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => assign(p)}
                    disabled={busyId !== null || current}
                    className="press flex min-h-12 w-full items-center gap-3 px-4 text-left hover:bg-[var(--bg-sunken)] disabled:cursor-default"
                  >
                    <span className="flex-1 font-semibold">{p.displayName}</span>
                    {current ? (
                      <span className="text-sm text-[var(--ink-2)]">Current</span>
                    ) : busyId === p.id ? (
                      <Loader2 size={18} aria-hidden className="animate-spin" />
                    ) : (
                      <span className="text-sm font-semibold text-[var(--forest)]">Assign</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
    </Sheet>
  );
}
