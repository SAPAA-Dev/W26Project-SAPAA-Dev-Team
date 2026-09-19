import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateFilename } from "@/utils/media/generateFilename";

import crypto from "crypto";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      contentType,
      fileSize,
      siteId,
      siteName,
      date,
      photographer,
      identifier,
    } = body;

    if (!contentType) {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 });
    }
    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }
    if (!siteName || !date || !photographer || !identifier) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (fileSize > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // const uuid = crypto.randomUUID();
    // const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp";
    // const baseName = filename.replace(/\.[^.]+$/, "");
    // const key = `homepage-image-uploads/${siteId}/${user.id}/${baseName}-${uuid}.${extension}`;

    const extension =
      contentType === "image/jpeg" ? "jpg" :
      contentType === "image/png" ? "png" :
      "webp";

    const generatedName = generateFilename({
      siteName,
      date,
      photographer,
      identifier,
      extension,
    });

    const key = `homepage-image-uploads/${siteId}/${user.id}/${generatedName}`;



    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 180 });

    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}