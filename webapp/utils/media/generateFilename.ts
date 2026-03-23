import crypto from "crypto";

function clean(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")      // remove spaces
    .replace(/[^a-zA-Z0-9-]/g, "");
}

function camelCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "");
}

export function generateFilename({
  siteName,
  date,
  photographer,
  identifier,
  extension,
}: {
  siteName: string;
  date: string;
  photographer: string;
  identifier: string;
  extension: string;
}) {

  const safeSite = clean(siteName);
  const safeWho = camelCase(photographer);
  const safeIdentifier = camelCase(identifier);
  const uuid = crypto.randomUUID();   // full UUID for better uniqueness
  const filename =
    `${safeSite}-${date}-${safeWho}-${safeIdentifier}-${uuid}.${extension}`;

  return filename;
}