const PLACEHOLDER_KEYS = new Set([
  'your_api_key',
  'your-protomaps-key',
  'your-protomaps-api-key',
  'changeme',
]);

export function readApiKey(): string | null {
  const value = process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY?.trim();
  if (!value || PLACEHOLDER_KEYS.has(value.toLowerCase())) return null;
  return value;
}

export function protomapsStyleUrl(): string | null {
  const key = readApiKey();
  return key ? `https://api.protomaps.com/styles/v5/light/en.json?key=${encodeURIComponent(key)}` : null;
}
