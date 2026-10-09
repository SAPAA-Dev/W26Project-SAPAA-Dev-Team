interface AreaChoice {
  id: number;
}

interface SiteLink {
  id: number;
  protected_area_id?: number | null;
}

// The current site keeps its own protected area. Every other linked area is hidden.
export function availableProtectedAreas<T extends AreaChoice>(
  areas: T[],
  sites: SiteLink[],
  currentSiteId: number | null
): T[] {
  const taken = new Set<number>();
  for (const site of sites) {
    if (site.id === currentSiteId) continue;
    if (site.protected_area_id != null) taken.add(site.protected_area_id);
  }
  return areas.filter((area) => !taken.has(area.id));
}
