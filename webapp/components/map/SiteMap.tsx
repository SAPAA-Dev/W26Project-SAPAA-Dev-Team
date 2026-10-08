'use client';

import { useEffect, useRef } from 'react';
import { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/components/map/enableMapLibreWorker';
import { KeyRound } from 'lucide-react';

const STYLE_URL = 'https://api.protomaps.com/styles/v5/light/en.json';
const CENTER: [number, number] = [-114.5, 54.5];
const ZOOM = 5.5;
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-122.0, 48.0],
  [-108.0, 60.5],
];

// Values a developer leaves in .env.local before the real key arrives.
const PLACEHOLDER_KEYS = new Set([
  'your_api_key',
  'your-protomaps-key',
  'your-protomaps-api-key',
  'changeme',
]);

const BOX_CLASSES =
  'h-[70vh] min-h-[420px] w-full rounded-2xl border-2 border-[#E4EBE4] overflow-hidden bg-white';

function readApiKey(): string | null {
  const value = process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY?.trim();
  if (!value || PLACEHOLDER_KEYS.has(value.toLowerCase())) return null;
  return value;
}

export default function SiteMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiKey = readApiKey();

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: `${STYLE_URL}?key=${encodeURIComponent(apiKey)}`,
      center: CENTER,
      zoom: ZOOM,
      maxBounds: MAX_BOUNDS,
      renderWorldCopies: false,
    });

    // The canvas keeps the size it had when the toggle revealed the map, so a
    // later layout change (a window resize, a wrapped toolbar) needs a resize call.
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className={`${BOX_CLASSES} flex items-center justify-center p-6`}>
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E4EBE4]">
            <KeyRound className="h-8 w-8 text-[#356B43]" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-[#254431]">Map key not set</h3>
          <p className="mb-4 text-sm leading-relaxed text-[#7A8075]">
            Add{' '}
            <code className="rounded bg-[#F7F2EA] px-1.5 py-0.5 font-mono text-[#254431]">
              NEXT_PUBLIC_PROTOMAPS_API_KEY
            </code>{' '}
            to{' '}
            <code className="rounded bg-[#F7F2EA] px-1.5 py-0.5 font-mono text-[#254431]">
              webapp/.env.local
            </code>
            , then restart{' '}
            <code className="rounded bg-[#F7F2EA] px-1.5 py-0.5 font-mono text-[#254431]">
              npm run dev
            </code>
            . The server inlines the value at start, so a restart is necessary.
          </p>
          <p className="text-xs text-[#7A8075]">
            Get a key at{' '}
            <a
              href="https://maps.protomaps.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#356B43] underline"
            >
              maps.protomaps.com
            </a>
            . The variable is documented in <span className="font-mono">webapp/.env.example</span>.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={BOX_CLASSES} />;
}
