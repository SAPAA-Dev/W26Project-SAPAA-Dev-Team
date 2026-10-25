import { NextResponse } from "next/server";
import { createClient, createServerSupabase } from "@/utils/supabase/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3/client";


const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ReportVisibility = {
  answers?: Array<{ question_id: number; is_hidden: boolean | null }> | null;
};

function getReportVisibility(value: ReportVisibility | ReportVisibility[] | null): ReportVisibility | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    const approved = user.app_metadata?.authenticated === true;

    if (role !== "admin" || !approved) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

  const admin = createServerSupabase();
  // Archived reports keep their images for restore, but galleries must hide them.
  const { data: attachments, error: attachmentsError } = await admin
    .from("attachments")
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
      site_id,
      form_responses!inner (archived_at, answers(question_id, is_hidden))
    `)
    .is("form_responses.archived_at", null)
    .in("content_type", ALLOWED_IMAGE_TYPES)
    .order("id", { ascending: false });

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

    const { data: sites, error: sitesError } = await admin
      .from("sites_pa")
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
    
    const items = await Promise.all(
      (attachments || []).map(async (attachment) => {
        const report = getReportVisibility(attachment.form_responses);
        const isHidden = report?.answers?.some(
          (answer) => answer.question_id === attachment.question_id && answer.is_hidden === true
        ) ?? false;
        let imageUrl: string | null = null;

        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: attachment.storage_key,
          });

          imageUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });

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
            storage_key: attachment.storage_key,
            content_type: attachment.content_type,
            file_size_bytes: attachment.file_size_bytes,
            filename: attachment.filename,
            site_id: attachment.site_id,
            site_name: siteMap.get(attachment.site_id) ?? null,
            ...(isHidden ? { is_hidden: true } : {}),
            imageUrl,
          };
      })
    );

    const validItems = items.filter((item) => item.imageUrl);

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

