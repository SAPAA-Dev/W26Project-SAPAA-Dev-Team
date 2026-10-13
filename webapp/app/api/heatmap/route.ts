import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// The dashboard geocodes each site one second apart, so a long list keeps the admin waiting.
const MAX_SITES = 50;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // PostgREST reads "*" as "%" in ilike and has no escape for it, so drop it.
  const keyword = (searchParams.get("keyword") ?? "").replace(/\*/g, "").trim();

  if (!keyword) {
    return NextResponse.json({ data: [] });
  }

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.app_metadata?.role !== "admin" || user.app_metadata?.authenticated !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Escape the LIKE wildcards so a search for "_" or "%" matches those characters, not every site.
    const escaped = keyword.replace(/[\\%_]/g, "\\$&");
    const { data, error } = await supabase
      .from("sites_report_fnr_test")
      .select("namesite")
      .ilike("namesite", `%${escaped}%`);

    if (error) {
      console.error("Heatmap query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ data: [], message: "No sites found" });
    }

    const siteCounts: Record<string, number> = {};
    for (const item of data as { namesite: string | null }[]) {
      if (item.namesite) {
        siteCounts[item.namesite] = (siteCounts[item.namesite] || 0) + 1;
      }
    }

    const results = Object.entries(siteCounts)
      .map(([namesite, count]) => ({ namesite, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_SITES);
    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("Heatmap request failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Heatmap request failed" },
      { status: 500 }
    );
  }
}
