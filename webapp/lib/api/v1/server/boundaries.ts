import { toBoundaryFeatureCollection, type ProtectedAreaBoundaryRow } from '@/lib/map/boundaries';
import type { BoundaryCollection } from '../types';
import type { Caller } from './auth';
import { db, fetchAll } from './db';
import { loadSites } from './sites';

/** Protected-area boundaries, simplified like getProtectedAreaBoundaries, with the linked site's status. */
export async function getBoundaries(caller: Caller): Promise<BoundaryCollection> {
  const [areas, { sites, areaBySite }, hidden] = await Promise.all([
    fetchAll<ProtectedAreaBoundaryRow>((from, to) =>
      db()
        .from('protected_areas')
        // Only what the response carries; the other boundary columns were read and dropped.
        .select('id, name, area_type, geometry')
        .order('id')
        .range(from, to)
    ),
    loadSites(undefined, false, { geometry: false }),
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
        },
        geometry: feature.geometry,
      };
    }),
  };
}
