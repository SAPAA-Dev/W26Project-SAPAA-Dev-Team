import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

function getS3Client() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "50"));
    const search = searchParams.get("search")?.trim();
    const siteId = searchParams.get("siteId");

    let query = supabase.from("S26_gallery_combined").select("*", { count: "exact" });

    if (siteId) {
      query = query.eq("site_id", Number(siteId));
    }
    if (search) {
      const q = `%${search}%`;
      query = query.or(
        `site_name.ilike.${q},identifier.ilike.${q},caption.ilike.${q},filename.ilike.${q}`
      );
    }

    query = query.order("date", { ascending: false, nullsFirst: false });

    if (!all) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const s3 = getS3Client();
    const items = await Promise.all(
      (data ?? []).map(async (row: any) => {
        let imageUrl: string | null = null;
        try {
          const command = new GetObjectCommand({ Bucket: BUCKET, Key: row.storage_key });
          imageUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        } catch {
          // signing failed — dropped below
        }
        return { ...row, imageUrl };
      })
    );

    return NextResponse.json({
      items: items.filter((i) => i.imageUrl),
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("gallery-combined GET error:", err);
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}