import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Strip common suffixes so "Buck Lake (NA)" matches "Buck Lake Natural Area"
const SUFFIXES = [
  /\s*\(na\)\s*$/i, /\s*\(ab\)\s*$/i, /\s*\([^)]*\)\s*$/i,
  /\s+natural\s+area\s*$/i, /\s+provincial\s+recreation\s+area\s*$/i,
  /\s+provincial\s+park\s*$/i, /\s+recreation\s+area\s*$/i,
  /\s+wilderness\s+area\s*$/i, /\s+ecological\s+reserve\s*$/i,
  /\s+heritage\s+rangeland\s*$/i, /\s+provincial\s+forest\s*$/i,
  /\s+wildland\s+provincial\s+park\s*$/i, /\s+of\s+canada\s*$/i,
  /\s+national\s+park\s*$/i,
];
function normName(s: string): string {
  let n = s.toLowerCase().trim();
  let prev = "";
  while (n !== prev) { prev = n; for (const re of SUFFIXES) n = n.replace(re, "").trim(); }
  return n;
}

function extractCentroid(raw: string): [number, number] | null {
  try {
    const geo = typeof raw === "string" ? JSON.parse(raw) : raw;
    const coords: [number, number][] = [];
    const extract = (obj: any) => {
      if (!obj) return;
      if (obj.type === "FeatureCollection") obj.features.forEach(extract);
      else if (obj.type === "Feature") extract(obj.geometry);
      else if (obj.coordinates) {
        const flat = (c: any): void => {
          if (typeof c[0] === "number") coords.push(c as [number, number]);
          else c.forEach(flat);
        };
        flat(obj.coordinates);
      }
    };
    extract(geo);
    if (!coords.length) return null;
    return [
      coords.reduce((s, c) => s + c[1], 0) / coords.length, // lat
      coords.reduce((s, c) => s + c[0], 0) / coords.length, // lon
    ];
  } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) return NextResponse.json({ data: [] });

  try {
    const supabase = await createClient();

    // Search inspection content — notes, naturalness_details, and namesite
    const { data, error } = await supabase
      .from("sites_report_fnr_test")
      .select("namesite, notes, naturalness_details")
      .or(`notes.ilike.%${keyword}%,naturalness_details.ilike.%${keyword}%,namesite.ilike.%${keyword}%`);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data || data.length === 0) return NextResponse.json({ data: [] });

    // Count how many times the keyword appears across all text fields per site
    // (not just whether the report contains it — "fire" mentioned 8 times = weight 8)
    const kwLower = keyword.toLowerCase();
    function countOccurrences(text: string | null): number {
      if (!text) return 0;
      let count = 0;
      let idx = text.toLowerCase().indexOf(kwLower);
      while (idx !== -1) {
        count++;
        idx = text.toLowerCase().indexOf(kwLower, idx + 1);
      }
      return count;
    }

    const weightMap: Record<string, number> = {};
    for (const row of data) {
      if (!row.namesite) continue;
      const occurrences =
        countOccurrences(row.notes) +
        countOccurrences(row.naturalness_details);
      // Always add at least 1 if the row matched (e.g. namesite match)
      weightMap[row.namesite] = (weightMap[row.namesite] ?? 0) + Math.max(1, occurrences);
    }

    // Load geometries and build normalised lookup
    const { data: geoData } = await supabase
      .from("site_geometries")
      .select("namesite, geojson");

    const geoByNorm = new Map<string, { namesite: string; geojson: string }>();
    for (const g of (geoData ?? []) as { namesite: string; geojson: string }[]) {
      geoByNorm.set(normName(g.namesite), g);
    }

    // Resolve coordinates from geometry centroids
    const results: { namesite: string; count: number; latitude: number; longitude: number }[] = [];
    const missing: string[] = [];

    for (const [namesite, count] of Object.entries(weightMap)) {
      const geo = geoByNorm.get(normName(namesite));
      if (geo) {
        const centroid = extractCentroid(geo.geojson);
        if (centroid) {
          results.push({ namesite: geo.namesite, count, latitude: centroid[0], longitude: centroid[1] });
          continue;
        }
      }
      missing.push(namesite);
    }

    // OpenCage fallback for unmatched sites
    if (missing.length > 0) {
      const OPENCAGE_KEY = process.env.OPENCAGE_API_KEY;
      await Promise.all(missing.map(async (namesite) => {
        try {
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(namesite + ", Alberta, Canada")}&key=${OPENCAGE_KEY}&limit=1`
          );
          const json = await res.json();
          if (json.results?.length > 0) {
            const { lat, lng } = json.results[0].geometry;
            results.push({ namesite, count: weightMap[namesite], latitude: lat, longitude: lng });
          }
        } catch {}
      }));
    }

    // Normalise weights 0–1
    const maxW = Math.max(...results.map(r => r.count), 1);
    const minW = Math.min(...results.map(r => r.count), 1);
    const normalised = results.map(r => ({
      ...r,
      weight: maxW === minW ? 0.5 : (r.count - minW) / (maxW - minW),
    }));

    return NextResponse.json({ data: normalised });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}