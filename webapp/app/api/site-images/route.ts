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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteid");
    const responseId = searchParams.get("responseid");

    // At least one filter is required
    if (!siteId && !responseId) {
      return NextResponse.json(
        { error: "Provide at least one of: siteid, responseid" },
        { status: 400 }
      );
    }

    // Build Supabase query - filter by whichever params were provided
    let query = supabase
      .from("W26_attachments")
      .select(
        "id, response_id, question_id, storage_key, filename, content_type, file_size_bytes, caption, identifier, site_id"
      );

    if (siteId)     query = query.eq("site_id", Number(siteId));
    if (responseId) query = query.eq("response_id", Number(responseId));

    const { data: attachments, error: dbError } = await query;

    if (dbError) {
      throw new Error(dbError.message || "Failed to fetch attachments");
    }

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Generate a presigned GET URL for each attachment (1 hour expiry)
    const items = await Promise.all(
      attachments.map(async (row) => {
        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: row.storage_key,
        });
        const imageUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return {
          id:              row.id,
          response_id:     row.response_id,
          question_id:     row.question_id,
          storage_key:     row.storage_key,
          filename:        row.filename,
          content_type:    row.content_type,
          file_size_bytes: row.file_size_bytes,
          caption:         row.caption,
          identifier:      row.identifier,
          site_id:         row.site_id,
          imageUrl,
        };
      })
    );

    return NextResponse.json({ items });
  } catch (err) {
    console.error("site-images error:", err);
    return NextResponse.json(
      { error: "Failed to fetch site images" },
      { status: 500 }
    );
  }
}