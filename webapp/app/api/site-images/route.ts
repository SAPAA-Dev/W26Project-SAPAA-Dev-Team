import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { deleteObjectsByKeys } from "@/utils/media/s3Delete";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const IMAGE_TABLES = ["attachments", "homepage_image_uploads"] as const;
type ImageTable = (typeof IMAGE_TABLES)[number];

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

    // Archived reports keep their images for restore, but normal image lists must hide them.
    let query = supabase
      .from("attachments")
      .select(
        "id, response_id, question_id, storage_key, filename, content_type, file_size_bytes, caption, identifier, site_id, form_responses!inner(archived_at)"
      )
      .is("form_responses.archived_at", null);

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

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.app_metadata?.role !== "admin" || user.app_metadata?.authenticated !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = Number(searchParams.get("id"));
    const kind = searchParams.get("kind") ?? "attachments";

    if (!(IMAGE_TABLES as readonly string[]).includes(kind)) {
      return NextResponse.json(
        { error: "Provide a valid image kind" },
        { status: 400 }
      );
    }
    const table: ImageTable = kind as ImageTable;

    if (!searchParams.get("id") || Number.isNaN(imageId)) {
      return NextResponse.json(
        { error: "Provide a numeric attachment id" },
        { status: 400 }
      );
    }

    const { data: imageRow, error: readError } = await supabase
      .from(table)
      .select("id, storage_key")
      .eq("id", imageId)
      .single();

    if (readError || !imageRow) {
      return NextResponse.json(
        { error: table === "attachments" ? "Attachment not found" : "Homepage image not found" },
        { status: 404 }
      );
    }

    const { data: deletedRows, error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", imageId)
      .select("id");

    if (deleteError) {
      throw new Error(deleteError.message || "Failed to delete image");
    }

    if (!deletedRows || deletedRows.length === 0) {
      throw new Error("Image row was not deleted");
    }

    let storageCleanupComplete = true;

    try {
      await deleteObjectsByKeys([imageRow.storage_key]);
    } catch (storageError) {
      // The row is already gone, so a retry would get 404. Report the cleanup problem separately.
      storageCleanupComplete = false;
      console.error("Image S3 cleanup failed after database deletion.", {
        table,
        imageId,
        storageKey: imageRow.storage_key,
        error: storageError,
      });
    }

    return NextResponse.json({ deleted: true, storageCleanupComplete });
  } catch (err) {
    console.error("site-images delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete site image" },
      { status: 500 }
    );
  }
}
