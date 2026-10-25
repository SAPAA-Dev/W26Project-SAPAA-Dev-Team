import { toBoundaryFeatureCollection, type ProtectedAreaBoundaryRow } from '@/lib/map/boundaries';
import { setSiteBoundaryColor, setSiteTypeBoundaryColor } from '@/utils/supabase/queries';
import type { BoundaryCollection, BoundaryColorInput } from '../types';
import { HttpError, type Caller } from './auth';
import { db, fetchAll } from './db';
import { loadSites } from './sites';

/** Protected-area boundaries, simplified like getProtectedAreaBoundaries, with the linked site's status. */
export async function getBoundaries(caller: Caller): Promise<BoundaryCollection> {
  const [areas, { sites, areaBySite }, hidden] = await Promise.all([
    fetchAll<ProtectedAreaBoundaryRow>((from, to) =>
      db()
        .from('protected_areas')
        // Only what the response carries; the other boundary columns were read and dropped.
        .select('id, name, area_type, geometry, boundary_color')
        .order('id')
        .range(from, to)
    ),
    // Admins see inactive sites' areas too, so those keep their site link and status for them.
    loadSites(undefined, caller.isAdmin, { geometry: false }),
    // Areas of deactivated sites are hidden from non-admins, as in getProtectedAreaBoundaries.
    caller.isAdmin
      ? Promise.resolve([])
      : fetchAll<{ protected_area_id: number }>((from, to) =>
          db()
            .from('sites_pa')
            .select('protected_area_id')
            .eq('is_active', false)
            .is('archived_at', null)
            .not('protected_area_id', 'is', null)
            .order('id')
            .range(from, to)
        ),
  ]);

  const hiddenIds = new Set(hidden.map((row) => row.protected_area_id));
  const siteByArea = new Map(sites.filter((s) => areaBySite.has(s.id)).map((s) => [areaBySite.get(s.id)!, s]));
  const collection = toBoundaryFeatureCollection(areas.filter((area) => !hiddenIds.has(area.id)));

  return {
    type: 'FeatureCollection',
    canEditColors: caller.isAdmin,
    features: collection.features.map((feature) => {
      const site = siteByArea.get(feature.id);
      return {
        type: 'Feature',
        id: feature.id,
        properties: {
          areaId: feature.id,
          name: feature.properties.name,
          areaType: feature.properties.area_type ?? null,
          siteId: site?.id ?? null,
          siteSlug: site?.slug ?? null,
          status: site?.status ?? null,
          color: feature.properties.boundary_color,
        },
        geometry: feature.geometry,
      };
    }),
  };
}

/**
 * Admin-only colour change, through the same server actions as the classic admin map: they re-check the
 * admin role, validate the id, type and #rrggbb colour, and refuse an id that no longer exists.
 */
export async function setBoundaryColor(caller: Caller, body: unknown): Promise<{ ok: true }> {
  if (!caller.isAdmin) throw new HttpError(403, 'Only admins can change boundary colors.');
  const input = body as (Partial<BoundaryColorInput> & { areaId?: unknown; areaType?: unknown }) | null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Invalid colour change.');
  if (typeof input.color !== 'string') throw new HttpError(400, 'color is required.');

  let result;
  if (input.scope === 'site') {
    if (typeof input.areaId !== 'number') throw new HttpError(400, 'areaId must be a number.');
    result = await setSiteBoundaryColor(input.areaId, input.color);
  } else if (input.scope === 'type') {
    if (typeof input.areaType !== 'string') throw new HttpError(400, 'areaType must be text.');
    result = await setSiteTypeBoundaryColor(input.areaType, input.color);
  } else {
    throw new HttpError(400, "scope must be 'site' or 'type'.");
  }
  if (!result.ok) throw new HttpError(400, result.error);
  return { ok: true };
}
