import axios from "axios";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const GEOCODE_TIMEOUT_MS = 8000;

/**
 * Returns { latitude, longitude } for a place name. Both are null when OpenCage finds no match.
 * Only the admin dashboard heat map calls it, and each call uses the paid OpenCage quota.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("q");

  if (!name) return NextResponse.json({ error: "Missing q param" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.app_metadata?.role !== "admin" || user.app_metadata?.authenticated !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENCAGE_API_KEY;
  if (!apiKey) {
    console.error("OPENCAGE_API_KEY is not set.");
    return NextResponse.json({ error: "Geocoding is not configured" }, { status: 500 });
  }

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      name
    )}&key=${encodeURIComponent(apiKey)}`;

    const { data } = await axios.get(url, { timeout: GEOCODE_TIMEOUT_MS });

    if (!data.results?.length) {
      return NextResponse.json({ latitude: null, longitude: null });
    }

    const { lat, lng } = data.results[0].geometry;
    return NextResponse.json({ latitude: lat, longitude: lng });
  } catch (err) {
    console.error("Geocoding failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geocoding failed" },
      { status: 500 }
    );
  }
}
