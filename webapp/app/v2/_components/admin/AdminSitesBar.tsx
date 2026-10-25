'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, EyeOff, FileDown, FileUp, History, Loader2, MoreHorizontal, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { api } from '@/lib/api/v1/client';
import type { SiteSummary } from '@/lib/api/v1/types';
import {
  getSiteDeleteImpact,
  permanentlyDeleteSite,
  restoreSite,
  toggleSiteActive,
  type SiteDeleteImpact,
  type SiteSummary as AdminSite,
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { importProtectedAreasFromStorage, type ImportKmlResult } from '@/utils/kml-import-actions';
import { invalidate, useApi } from '@/app/v2/_lib/useApi';
import { btn, chip, EmptyState, ErrorState, ListSkeleton, Sheet } from '@/app/v2/_components/flows/ui';
import { formatDate } from '@/app/v2/_components/flows/format';
import { Confirm, errMsg, ImpactList, MenuRow, plural, refreshSite, toast, useIsAdmin } from './shared';
import { SiteSheet, useArchivedSites } from './SiteSheet';
import { ExportsSheet, PdfSheet } from './pdf';

type Panel = 'add' | 'inactive' | 'archived' | 'pdf' | 'more' | 'kml' | 'exports';


/**
 * Admin actions for the sites list, under its search bar: add a site, the inactive and archived sites,
 * a PDF of the sites the list shows, KML upload and recent exports. Renders nothing for stewards.
 */
export default function AdminSitesBar({ sites }: { sites?: SiteSummary[] | null }) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [panel, setPanel] = useState<Panel | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const all = useApi(isAdmin ? 'sites:all' : null, () => api.sites({ includeInactive: true }));
  const archived = useArchivedSites(isAdmin);
  if (!isAdmin) return null;

  const inactive = (all.data ?? []).filter((s) => !s.isActive);
  const show = (p: Panel, e: React.MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget;
    setPanel(p);
  };
  const close = () => {
    setPanel(null);
    // The sheets unmount; focus goes back to the chip that opened them.
    requestAnimationFrame(() => opener.current?.focus());
  };
  const shown = sites ?? [];

  return (
    <>
      <div role="toolbar" aria-label="Admin" className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:flex-wrap md:px-0">
        <button
          type="button"
          onClick={(e) => show('add', e)}
          className={chip(true)}
        >
          <Plus size={17} aria-hidden />
          Add site
        </button>
        <button type="button" onClick={(e) => show('inactive', e)} className={`${chip(false)} disabled:opacity-45`} aria-label={`Inactive sites, ${inactive.length}`}>
          <EyeOff size={16} aria-hidden />
          Inactive
          <span className="num text-[var(--ink-2)]">{all.data ? inactive.length : '–'}</span>
        </button>
        <button type="button" onClick={(e) => show('archived', e)} className={`${chip(false)} disabled:opacity-45`} aria-label={`Archived sites, ${archived.data?.length ?? 0}`}>
          <Archive size={16} aria-hidden />
          Archived
          <span className="num text-[var(--ink-2)]">{archived.data ? archived.data.length : '–'}</span>
        </button>
        <button type="button" onClick={(e) => show('pdf', e)} disabled={!shown.length} className={`${chip(false)} disabled:opacity-45`}>
          <FileDown size={16} aria-hidden />
          PDF of <span className="num">{shown.length}</span>
        </button>
        <button type="button" onClick={(e) => show('more', e)} className={`${chip(false)} disabled:opacity-45`} aria-label="More admin tools">
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </div>

      {panel && (
        <>
          <SiteSheet
            open={panel === 'add'}
            onClose={close}
            onSaved={({ name }) => {
              toast(`${name} added. Assign a steward from its page.`);
              refreshSite(null, { site: true });
              setPanel(null);
              router.push(`/v2/sites/${encodeURIComponent(name)}`);
            }}
          />
          <InactiveSheet
            open={panel === 'inactive'}
            onClose={close}
            list={all.data ? inactive : null}
            error={all.error}
            retry={all.refetch}
          />
          <ArchivedSheet
            open={panel === 'archived'}
            onClose={close}
            list={archived.data ?? null}
            error={archived.error}
            retry={archived.refetch}
          />
          <PdfSheet
            open={panel === 'pdf'}
            onClose={close}
            target={{ mode: 'multi-site', siteNames: shown.map((s) => s.name) }}
            subject={`${plural(shown.length, 'site')} from this list, as filtered.`}
          />
          <Sheet open={panel === 'more'} onClose={close} title="More admin tools">
            <MenuRow
              icon={FileUp}
              label="Upload site data"
              hint="Protected area boundaries from a KML or KMZ file"
              onClick={() => setPanel('kml')}
            />
            <MenuRow icon={History} label="Recent exports" hint="Download PDFs you exported" onClick={() => setPanel('exports')} />
          </Sheet>
          <KmlSheet open={panel === 'kml'} onClose={close} />
          <ExportsSheet open={panel === 'exports'} onClose={close} />
        </>
      )}
    </>
  );
}

/* ---------- inactive sites: open one, or make it active again ---------- */

function InactiveSheet({
  open,
  onClose,
  list,
  error,
  retry,
}: {
  open: boolean;
  onClose: () => void;
  list: SiteSummary[] | null;
  error: Error | null;
  retry: () => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const activate = async (s: SiteSummary) => {
    setBusy(s.id);
    try {
      await toggleSiteActive(s.id, true);
      toast(`${s.name} is active. Stewards can see it again.`);
      refreshSite(s.slug, { site: true });
    } catch (e) {
      toast(errMsg(e, 'The site did not change. Try again.'), 'error');
    } finally {
      setBusy(null);
    }
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Inactive sites"
      description="Hidden from stewards. You can still open them, or make them active."
    >
      {error ? (
        <ErrorState title="Inactive sites didn’t load" error={error} onRetry={retry} />
      ) : !list ? (
        <ListSkeleton label="Loading inactive sites" rows={3} />
      ) : list.length === 0 ? (
        <EmptyState title="Every site is active" body="Turn a site off from its page: Manage, then Edit site." />
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {list.map((s) => (
            <li key={s.id} className="flex min-h-16 items-center gap-3 py-2">
              <Link
                href={`/v2/sites/${encodeURIComponent(s.slug)}`}
                onClick={onClose}
                className="min-w-0 flex-1 rounded-[var(--radius-s)] py-1 hover:underline"
              >
                <span className="block truncate font-semibold">{s.name}</span>
                <span className="block truncate text-sm text-[var(--ink-2)]">{s.county ?? 'County unknown'}</span>
              </Link>
              <button
                type="button"
                onClick={() => activate(s)}
                disabled={busy !== null}
                className={`${btn.secondary} min-h-11 px-4 text-[15px]`}
              >
                {busy === s.id && <Loader2 size={16} aria-hidden className="animate-spin" />}
                Make active
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

/* ---------- archived sites: restore, or delete for good after the impact check ---------- */

function ArchivedSheet({
  open,
  onClose,
  list,
  error,
  retry,
}: {
  open: boolean;
  onClose: () => void;
  list: AdminSite[] | null;
  error: Error | null;
  retry: () => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [target, setTarget] = useState<AdminSite | null>(null);

  const restore = async (s: AdminSite) => {
    setBusy(s.id);
    try {
      await restoreSite(s.id);
      toast(`${s.namesite} restored.`);
      refreshSite(s.namesite, { site: true });
    } catch (e) {
      toast(errMsg(e, 'The site was not restored. Try again.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Sheet
        open={open && !target}
        onClose={onClose}
        title="Archived sites"
        description="Hidden everywhere. Restore brings a site back with its reports."
      >
        {error ? (
          <ErrorState title="Archived sites didn’t load" error={error} onRetry={retry} />
        ) : !list ? (
          <ListSkeleton label="Loading archived sites" rows={3} />
        ) : list.length === 0 ? (
          <EmptyState title="No archived sites" body="Archive a site from its page: Manage, then Archive site." />
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {list.map((s) => (
              <li key={s.id} className="py-3">
                <p className="font-semibold">{s.namesite}</p>
                <p className="num text-sm text-[var(--ink-2)]">
                  {s.county ?? 'County unknown'}, archived {formatDate(s.archived_at)}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => restore(s)}
                    disabled={busy !== null}
                    className={`${btn.secondary} min-h-11 flex-1 px-3 text-[15px]`}
                  >
                    {busy === s.id ? <Loader2 size={16} aria-hidden className="animate-spin" /> : <RotateCcw size={16} aria-hidden />}
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget(s)}
                    disabled={busy !== null}
                    className="press flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-m)] px-3 text-[15px] font-semibold text-[var(--clay-ink)] hover:bg-[var(--bg-sunken)]"
                  >
                    <Trash2 size={16} aria-hidden />
                    Delete for good
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
      <DeleteSite
        site={target}
        onClose={() => setTarget(null)}
        onDone={(name) => {
          setTarget(null);
          toast(`${name} deleted for good.`);
          refreshSite(null, { site: true });
        }}
      />
    </>
  );
}

function DeleteSite({ site, onClose, onDone }: { site: AdminSite | null; onClose: () => void; onDone: (name: string) => void }) {
  const [impact, setImpact] = useState<SiteDeleteImpact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = site?.id;

  useEffect(() => {
    if (id === undefined) return;
    let live = true;
    getSiteDeleteImpact(id).then(
      (i) => live && setImpact(i),
      (e) => live && setError(errMsg(e, 'The connected records didn’t load. Close and try again.')),
    );
    return () => {
      live = false;
      setImpact(null);
      setError(null);
    };
  }, [id]);

  const confirm = async () => {
    if (!site) return;
    setBusy(true);
    setError(null);
    try {
      await permanentlyDeleteSite(site.id);
      onDone(site.namesite);
    } catch (e) {
      setError(errMsg(e, 'The site was not deleted. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Confirm
      open={!!site}
      onClose={onClose}
      title={`Delete ${site?.namesite ?? 'site'} for good?`}
      description="Only the site record goes. Its reports, answers and photos stay in the database, linked to no site. This cannot be undone. Map boundaries do not change."
      confirmLabel={busy ? 'Deleting' : 'Delete for good'}
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

/* ---------- KML / KMZ upload: the same stages as KmlImportModal ---------- */

const BUCKET = 'kml-imports'; // 20261006000000_create_kml_imports_bucket.sql
const MAX_BYTES = 50 * 1024 * 1024;
type Stage = 'idle' | 'uploading' | 'importing' | 'done' | 'error';

function KmlSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportKmlResult | null>(null);
  const [over, setOver] = useState(false);
  const busy = stage === 'uploading' || stage === 'importing';

  const reset = () => {
    if (busy) return;
    setStage('idle');
    setError(null);
    setResult(null);
    onClose();
  };
  const fail = (message: string) => {
    setStage('error');
    setError(message);
  };

  const run = async (file: File) => {
    setError(null);
    setResult(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.kml') && !lower.endsWith('.kmz')) return fail('Choose a .kml or .kmz file.');
    if (file.size > MAX_BYTES) return fail('The file is larger than 50 MB.');
    const path = `${BUCKET}/${crypto.randomUUID()}/${file.name.replace(/[^A-Za-z0-9._-]/g, '_')}`;
    try {
      setStage('uploading');
      const { error: up } = await createClient()
        .storage.from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: lower.endsWith('.kmz') ? 'application/vnd.google-earth.kmz' : 'application/vnd.google-earth.kml+xml',
        });
      if (up) return fail(`The upload failed: ${up.message}`);
      setStage('importing');
      const r = await importProtectedAreasFromStorage(path);
      setResult(r);
      if (!r.success) return fail(r.error ?? 'The import failed.');
      setStage('done');
      toast(`Imported ${plural(r.upserted ?? 0, 'protected area')}.`);
      invalidate('boundaries');
      invalidate('admin:areas');
      invalidate('sites'); // the import re-links sites to their boundaries (centre, area type)
    } catch (e) {
      fail(errMsg(e, 'The import failed.'));
    }
  };

  const warnings = result?.warnings ?? [];
  const unlinked = result?.unlinkedSites ?? [];
  return (
    <Sheet
      open={open}
      onClose={reset}
      title="Upload site data"
      description="Protected area boundaries from a KML or KMZ file, up to 50 MB. Matching areas are updated."
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) void run(f);
        }}
        className={`rounded-[var(--radius-m)] border-2 border-dashed px-5 py-7 text-center transition-colors duration-[var(--dur-1)] ${over ? 'border-[var(--forest)] bg-[var(--bg-sunken)]' : 'border-[var(--line)]'}`}
      >
        <FileUp size={28} aria-hidden className="mx-auto text-[var(--ink-2)]" />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={`${btn.primary} mt-3`}>
          Choose a file
        </button>
        <p className="mt-2 hidden text-sm text-[var(--ink-2)] md:block">or drop it here</p>
        <input
          ref={input}
          type="file"
          accept=".kml,.kmz"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void run(f);
          }}
        />
      </div>

      <div aria-live="polite">
        {busy && (
          <p className="mt-4 flex items-start gap-2 text-[15px] font-semibold">
            <Loader2 size={18} aria-hidden className="mt-0.5 shrink-0 animate-spin" />
            {stage === 'uploading' ? 'Uploading the file.' : 'Reading the file and saving the areas. A full data set takes about a minute.'}
          </p>
        )}
        {stage === 'done' && result && (
          <p className="mt-4 text-[15px] font-semibold text-[var(--st-recent-ink)]">
            Imported {plural(result.upserted ?? 0, 'protected area')}.
            {(result.skipped ?? 0) > 0 && ` ${plural(result.skipped ?? 0, 'placemark was', 'placemarks were')} skipped.`}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-[15px] font-semibold text-[var(--clay-ink)]">
          {error}
        </p>
      )}
      {stage === 'done' && unlinked.length > 0 && (
        <details open className="mt-4">
          <summary className="min-h-11 cursor-pointer text-[15px] font-semibold">
            {plural(unlinked.length, 'site has', 'sites have')} no boundary
          </summary>
          <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5 text-sm text-[var(--ink-2)]">
            {unlinked.map((name, i) => (
              <li key={`${name}-${i}`}>{name}</li>
            ))}
          </ul>
        </details>
      )}
      {warnings.length > 0 && (
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer text-[15px] font-semibold">{plural(warnings.length, 'note')}</summary>
          <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5 text-sm text-[var(--ink-2)]">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </Sheet>
  );
}
