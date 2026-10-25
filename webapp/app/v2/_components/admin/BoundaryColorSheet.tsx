'use client';

import { useState } from 'react';
import { api } from '@/lib/api/v1/client';
import type { BoundaryColorInput, SiteSummary } from '@/lib/api/v1/types';
import { invalidate, useApi } from '@/app/v2/_lib/useApi';
import { btn, ErrorState, Sheet } from '@/app/v2/_components/flows/ui';
import { STATUS_FILL } from '@/app/v2/_components/map/mapStyle';
import { errMsg, toast } from './shared';

/**
 * Outline colour of the site's protected area on the map: for this site, or for every area of its type
 * (which replaces their individual colours). Admin only, and only here in the admin tools, never on the
 * map itself. The server checks the role and the colour again.
 */
export function BoundaryColorSheet({ open, onClose, site }: { open: boolean; onClose: () => void; site: SiteSummary }) {
  const areas = useApi(open ? 'boundaries' : null, api.boundaries);
  const area = areas.data?.features.find((f) => f.properties.siteSlug === site.slug);
  const canEdit = areas.data?.canEditColors === true;

  return (
    <Sheet open={open} onClose={onClose} title="Boundary colour" description={`How ${site.name} is outlined on the map.`}>
      {areas.error ? (
        <ErrorState title="The map areas didn’t load" error={areas.error} onRetry={areas.refetch} />
      ) : !areas.data ? (
        <span aria-busy="true" className="block h-24 animate-pulse rounded-[var(--radius-m)] bg-[var(--bg-sunken)]" />
      ) : !area ? (
        <p className="text-[15px] text-[var(--ink-2)]">This site has no protected area linked, so it has no boundary to colour.</p>
      ) : !canEdit ? (
        <p className="text-[15px] text-[var(--ink-2)]">Only admins can change boundary colours.</p>
      ) : (
        <ColorForm
          key={area.id}
          areaId={area.properties.areaId}
          areaType={area.properties.areaType}
          initial={area.properties.color ?? STATUS_FILL[site.status]}
          onDone={onClose}
        />
      )}
    </Sheet>
  );
}

function ColorForm({ areaId, areaType, initial, onDone }: { areaId: number; areaType: string | null; initial: string; onDone: () => void }) {
  const [color, setColor] = useState(initial);
  const [busy, setBusy] = useState<'site' | 'type' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (input: BoundaryColorInput, done: string) => {
    setBusy(input.scope);
    setError(null);
    try {
      await api.setBoundaryColor(input);
      invalidate('boundaries');
      toast(done);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'The colour was not saved. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-4 text-[16px] font-semibold">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={busy !== null}
          className="h-12 w-16 shrink-0 cursor-pointer rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--surface)] p-1"
        />
        Outline colour
      </label>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void save({ scope: 'site', areaId, color }, 'Boundary colour saved.')}
        className={btn.primary}
      >
        {busy === 'site' ? 'Saving' : 'Set for this site'}
      </button>
      {areaType && (
        <>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void save({ scope: 'type', areaType, color }, `Colour set for every ${areaType}.`)}
            className={btn.secondary}
          >
            {busy === 'type' ? 'Saving' : `Set for every ${areaType}`}
          </button>
          <p className="text-sm text-[var(--ink-2)]">A type colour replaces the individual colours of that type.</p>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-[var(--clay-ink)]">
          {error}
        </p>
      )}
    </div>
  );
}
