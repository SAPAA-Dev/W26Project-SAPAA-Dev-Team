import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3/client";
import { isAllowedStorageKey } from "./storageKeys";

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

const DELETE_LIMIT = 1000;

export async function deleteObjectsByKeys(keys: Array<string | null>): Promise<void> {
  const targets = keys.filter((key): key is string => !!key);
  if (targets.length === 0) {
    return;
  }
  // Refuse the whole batch before deleting anything outside the image folders.
  const refused = targets.filter((key) => !isAllowedStorageKey(key));
  if (refused.length > 0) {
    throw new Error(`Refusing to delete storage keys outside the image folders: ${refused.join(", ")}`);
  }
  for (let index = 0; index < targets.length; index += DELETE_LIMIT) {
    const chunk = targets.slice(index, index + DELETE_LIMIT);
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: chunk.map((Key) => ({ Key })) },
    });
    const result = await s3Client.send(command);
    if (result.Errors && result.Errors.length > 0) {
      throw new Error(
        result.Errors.map((entry) => entry.Message || entry.Key).join("; ") ||
          "Failed to delete objects from S3"
      );
    }
  }
}
