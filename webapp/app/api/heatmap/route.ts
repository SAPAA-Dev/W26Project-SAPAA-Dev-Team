import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ data: [] });
  }

  try {
    // Use server-side client which respects auth
    const supabase = await createClient();
    
    const { data, error, count } = await supabase
      .from("sites_report_fnr_test")
      .select("namesite", { count: "exact" })
      .ilike("namesite", `%${keyword}%`);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ data: [], message: "No sites found" });
    }

    // Count occurrences of each site
    const siteCounts: { [key: string]: number } = {};
    
    data.forEach((item: any) => {
      if (item.namesite) {
        siteCounts[item.namesite] = (siteCounts[item.namesite] || 0) + 1;
      }
    });

    // Convert to array format
    const results = Object.entries(siteCounts).map(([namesite, count]) => ({
      namesite,
      count,
    }));

    // Sort by count descending
    results.sort((a, b) => b.count - a.count);
    return NextResponse.json({ data: results });

  } catch (err: any) {
    console.error("❌ Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}