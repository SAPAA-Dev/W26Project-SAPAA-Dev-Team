import { protomapsStyleUrl, readApiKey } from '@/lib/map/basemap';

const previousKey = process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY;
afterEach(() => {
  if (previousKey === undefined) delete process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY;
  else process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = previousKey;
});

it('refuses missing and placeholder keys', () => {
  for (const key of ['', ' ', 'your_api_key', 'your-protomaps-key', 'your-protomaps-api-key', 'CHANGEME']) {
    process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = key;
    expect(readApiKey()).toBeNull();
    expect(protomapsStyleUrl()).toBeNull();
  }
});

it('uses the main Protomaps style and encodes the trimmed key', () => {
  process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY = ' example&key ';
  expect(protomapsStyleUrl()).toBe('https://api.protomaps.com/styles/v5/light/en.json?key=example%26key');
});
