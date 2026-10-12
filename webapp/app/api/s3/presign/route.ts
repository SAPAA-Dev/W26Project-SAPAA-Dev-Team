import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateFilename } from "@/utils/media/generateFilename";
import { isAllowedStorageKey } from "@/utils/media/storageKeys";
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

// allowed file types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient(); // cookie-aware
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //Get request body
    const body = await request.json();

    const filename = body.filename;
    const contentType = body.contentType;
    const fileSize = body.fileSize;
    const responseId = body.responseId;
    const questionId = body.questionId;
    const siteId = body.siteId;

    const date = body.date;
    const photographer = body.photographer;
    const identifier = body.identifier ? body.identifier.trim() : "";
    const siteName = body.siteName;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 });
    }

    if (!siteId || !responseId || !questionId) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }

    if (![siteId, responseId, questionId].every((id) => Number.isSafeInteger(id) && id > 0)) {
      return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
    }

    if (!siteName || !date) {
      return NextResponse.json({ error: "Missing image metadata" }, { status: 400 });
    }

    // Validate file
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 400 }
      );
    }

    //  Create S3 key
    const extension =
    contentType === "image/jpeg"
      ? "jpg"
      : contentType === "image/png"
      ? "png"
      : "webp";

      const who = photographer?.trim()
        ? photographer
        : user.user_metadata?.full_name || "UnknownUser";

      const generatedFilename = generateFilename({
        siteName,
        date,
        photographer: who,
        identifier,
        extension,
      });

      const key =
        `inspections/${siteId}/${responseId}/${questionId}/${generatedFilename}`;

      // The date and names go into the key, so check the result before signing it.
      if (!isAllowedStorageKey(key, "inspections", siteId, responseId, questionId)) {
        return NextResponse.json({ error: "Invalid image metadata" }, { status: 400 });
      }



    //Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 180, // 3 minutes
    });

    // Return URL to client
    return NextResponse.json({
      "uploadUrl": uploadUrl,
      "key": key,
      "generatedFilename": generatedFilename,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}