import crypto from "crypto";

function clean(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")      // remove spaces
    .replace(/[^a-zA-Z0-9-]/g, "");
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
  const safeWho = clean(photographer);
  const safeIdentifier = clean(identifier);

  const filename =
    `${safeSite}-${date}-${safeWho}-${safeIdentifier}.${extension}`;

  return filename;
}