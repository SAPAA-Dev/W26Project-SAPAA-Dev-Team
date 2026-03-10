import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const numericSiteId = Number(siteId);
    if (!siteId || Number.isNaN(numericSiteId)) {
      return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: uploads, error } = await supabase
      .from("W26_homepage-image-uploads")
      .select("id, site_id, user_id, date, photographer, caption, description, storage_key, filename, content_type, file_size_bytes")
      .eq("site_id", numericSiteId)
      .order("date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: site } = await supabase
      .from("W26_sites-pa")
      .select("namesite")
      .eq("id", numericSiteId)
      .single();

    const items = await Promise.all(
      (uploads ?? []).map(async (upload) => {
        let imageUrl: string | null = null;
        try {
          const command = new GetObjectCommand({ Bucket: BUCKET, Key: upload.storage_key });
          imageUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        } catch (err) {
          console.error("Signed URL error:", err);
        }
        return {
          id: upload.id,
          site_id: upload.site_id,
          site_name: site?.namesite ?? null,
          date: upload.date,
          photographer: upload.photographer,
          caption: upload.caption,
          description: upload.description,
          filename: upload.filename,
          file_size_bytes: upload.file_size_bytes,
          storage_key: upload.storage_key,
          imageUrl,
        };
      })
    );

    return NextResponse.json({ items: items.filter((i) => i.imageUrl) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load images" }, { status: 500 });
  }
}