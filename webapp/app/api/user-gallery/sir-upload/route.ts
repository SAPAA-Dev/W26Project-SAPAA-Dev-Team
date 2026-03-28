import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


interface Attachment {
  id: string;
  response_id: string;
  question_id: string;
  caption?: string | null;
  identifier?: string | null;
  date?: string | null;
  storage_key: string;
  content_type: string;
  file_size_bytes?: number | null;
  filename: string;
  site_id: string;

  site?: {
    namesite: string;
  } | null;
}

// AWS configuration
const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function GET() {
  try {
    console.log("=== /api/gallery START ===");

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("user:", user?.id);
    console.log("authError:", authError);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.user_metadata?.role;
    console.log(user.user_metadata);
    
  const { data: attachments, error: attachmentsError } = await supabase
    .from("W26_attachments")
    .select(`
      id,
      response_id,
      question_id,
      caption,
      identifier,
      date,
      storage_key,
      content_type,
      file_size_bytes,
      filename,
      site_id
    `)
    .in("content_type", ALLOWED_IMAGE_TYPES)
    .order("id", { ascending: false });


    console.log("attachmentsError:", attachmentsError);
    console.log("attachments count:", attachments?.length || 0);
    console.log("attachments sample:", attachments?.slice(0, 3));

    if (attachmentsError) {
      console.error("Error fetching attachments:", attachmentsError);
      return NextResponse.json(
        { error: attachmentsError.message },
        { status: 500 }
      );
    }


    const siteIds = [
      ...new Set((attachments || []).map((attachment) => attachment.site_id).filter(Boolean)),
    ];

    console.log("siteIds:", siteIds);

    const { data: sites, error: sitesError } = await supabase
      .from("W26_sites-pa")
      .select("id, namesite")
      .in("id", siteIds);

    if (sitesError) {
      console.error("Error fetching sites:", sitesError);
      return NextResponse.json(
        { error: sitesError.message },
        { status: 500 }
      );
    }

    const siteMap = new Map(
      (sites || []).map((site) => [site.id, site.namesite])
    );

    console.log("siteMap:", Array.from(siteMap.entries()));
    
    const items = await Promise.all(
      (attachments || []).map(async (attachment) => {
        let imageUrl: string | null = null;

        console.log("processing attachment:", {
          id: attachment.id,
          filename: attachment.filename,
          storage_key: attachment.storage_key,
          content_type: attachment.content_type,
        });

        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: attachment.storage_key,
          });

          imageUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600,
          });

          console.log("signed URL generated for:", attachment.storage_key);
        } catch (s3Error) {
          console.error(
            `Failed to generate signed URL for ${attachment.storage_key}:`,
            s3Error
          );
        }

        return {
            id: attachment.id,
            response_id: attachment.response_id,
            question_id: attachment.question_id,
            caption: attachment.caption,
            identifier: attachment.identifier,
            date: attachment.date,
            content_type: attachment.content_type,
            file_size_bytes: attachment.file_size_bytes,
            filename: attachment.filename,
            site_id: attachment.site_id,
            site_name: siteMap.get(attachment.site_id) ?? null,
            imageUrl,
          };
      })
    );

    console.log("items before filtering:", items.length);

    const validItems = items.filter((item) => item.imageUrl);

    console.log("validItems count:", validItems.length);
    console.log("validItems sample:", validItems.slice(0, 3));

    return NextResponse.json({
      items: validItems,
    });
  } catch (err) {
    console.error("Gallery route error:", err);
    return NextResponse.json(
      { error: "Failed to load gallery" },
      { status: 500 }
    );
  }
}

