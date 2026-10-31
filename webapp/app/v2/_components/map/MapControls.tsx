'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import { Download, LoaderCircle, Locate, LocateFixed, Minus, Plus } from 'lucide-react';
import type { InspectionStatus } from '@/lib/api/v1/types';
import { STATUS_COLOR, STATUS_INK } from '../../_lib/siteQuery';
import { MAX_BOUNDS, SRC, TRACK_COLOR } from './mapStyle';
import type { Inset } from './MapCanvas';

/** Dark instrument chrome floating over the light map. */
export const CHROME =
  'bg-[var(--canopy)] text-[var(--birch)] shadow-[0_4px_14px_rgba(18,42,28,0.22)] ring-1 ring-black/5';
const BTN = 'press grid size-11 place-items-center hover:bg-[var(--forest-2)] active:bg-[var(--forest)]';

// ---------------------------------------------------------------- zoom + locate

type Locating = 'idle' | 'busy' | 'on' | 'error';

export function MapButtons({
  map,
  inset,
  className = '',
  onSaveOffline,
}: {
  map: MlMap | null;
  inset: Inset;
  className?: string;
  /** Opens the save-for-offline panel. */
  onSaveOffline?: () => void;
}) {
  const [loc, setLoc] = useState<Locating>('idle');
  const [note, setNote] = useState('');

  // Errors stay on screen long enough to read, then clear.
  useEffect(() => {
    if (loc !== 'error') return;
    const t = window.setTimeout(() => setLoc('idle'), 6000);
    return () => window.clearTimeout(t);
  }, [loc]);

  const locate = () => {
    if (!map) return;
    if (!('geolocation' in navigator)) {
      setLoc('error');
      setNote('This browser cannot share your location.');
      return;
    }
    setLoc('busy');
    setNote('Finding your location');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const c: [number, number] = [coords.longitude, coords.latitude];
        (map.getSource(SRC.me) as GeoJSONSource | undefined)?.setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} }],
        });
        const [[w, s], [e, n]] = MAX_BOUNDS;
        if (c[0] < w || c[0] > e || c[1] < s || c[1] > n) {
          setLoc('error');
          setNote('You are outside Alberta, so the map stays where it is.');
          return;
        }
        setLoc('on');
        setNote('Showing your location');
        const camera = {
          center: c,
          zoom: Math.max(map.getZoom(), 10),
          offset: [(inset.left - inset.right) / 2, (inset.top - inset.bottom) / 2] as [number, number],
        };
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.jumpTo(camera);
        else map.flyTo({ ...camera, duration: 1000 });
      },
      (err) => {
        setLoc('error');
        setNote(
          err.code === err.PERMISSION_DENIED
            ? 'Location is blocked. Allow it in your browser settings to see where you are.'
            : 'Your location is not available right now. Try again in a moment.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const LocIcon = loc === 'busy' ? LoaderCircle : loc === 'on' ? LocateFixed : Locate;

  return (
    <div className={`flex flex-col items-end gap-2 ${className}`}>
      <div className={`flex flex-col overflow-hidden rounded-[var(--radius-m)] ${CHROME}`}>
        <button type="button" className={BTN} aria-label="Zoom in" onClick={() => map?.zoomIn()}>
          <Plus size={20} aria-hidden />
        </button>
        <span className="mx-2 h-px bg-[var(--forest-2)]" aria-hidden />
        <button type="button" className={BTN} aria-label="Zoom out" onClick={() => map?.zoomOut()}>
          <Minus size={20} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        className={`${BTN} rounded-[var(--radius-m)] ${CHROME}`}
        aria-label={loc === 'on' ? 'Show my location again' : 'Show my location'}
        aria-pressed={loc === 'on'}
        onClick={locate}
        disabled={loc === 'busy'}
      >
        <LocIcon
          size={20}
          aria-hidden
          className={loc === 'busy' ? 'animate-spin' : ''}
          style={{ color: loc === 'on' ? 'var(--honey)' : undefined }}
        />
      </button>
      {onSaveOffline && (
        <button type="button" className={`${BTN} rounded-[var(--radius-m)] ${CHROME}`} aria-label="Save this area for offline use" onClick={onSaveOffline}>
          <Download size={20} aria-hidden />
        </button>
      )}
      {loc === 'error' && (
        <p className={`max-w-56 rounded-[var(--radius-s)] px-3 py-2 text-[13px] leading-snug ${CHROME}`}>{note}</p>
      )}
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- key

const KEY: { status: InspectionStatus; label: string; detail: string }[] = [
  { status: 'overdue', label: 'Overdue', detail: 'Over 2 years since a visit' },
  { status: 'never', label: 'Never inspected', detail: 'No report on record' },
  { status: 'due', label: 'Due', detail: '1 to 2 years since a visit' },
  { status: 'recent', label: 'Up to date', detail: 'Visited in the last year' },
];
const DOT: Record<InspectionStatus, number> = { overdue: 16, never: 14, due: 12, recent: 8 };

/** The pin itself, as drawn on the map: size and the hollow ring repeat what colour says. */
export function PinGlyph({ status, scale = 1 }: { status: InspectionStatus; scale?: number }) {
  const size = DOT[status] * scale;
  const never = status === 'never';
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: never ? 'var(--birch)' : STATUS_COLOR[status],
        border: never ? `${2.5 * scale}px solid ${STATUS_INK.never}` : `${1.5 * scale}px solid var(--birch)`,
        boxShadow: never ? undefined : '0 0 0 1px rgba(18,42,28,0.18)',
      }}
    />
  );
}

export function MapKey({
  placement = 'below',
  align = 'left',
  className = '',
}: {
  placement?: 'below' | 'above';
  align?: 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="map-key"
        onClick={() => setOpen((o) => !o)}
        className={`press flex h-11 items-center gap-2 rounded-full pr-4 pl-3 text-[13px] font-bold ${CHROME}`}
      >
        <span className="flex items-center gap-1" aria-hidden>
          {KEY.map((k) => (
            <PinGlyph key={k.status} status={k.status} scale={0.75} />
          ))}
        </span>
        Map key
      </button>
      {open && (
        <div
          id="map-key"
          role="group"
          aria-label="Map key"
          className={`absolute z-10 w-72 ${align === 'right' ? 'right-0' : 'left-0'} rounded-[var(--radius-m)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-[0_10px_30px_rgba(18,42,28,0.22)] ring-1 ring-[var(--line)] ${
            placement === 'below' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <ul className="space-y-3">
            {KEY.map((k) => (
              <li key={k.status} className="flex items-center gap-3">
                <span className="grid w-5 place-items-center">
                  <PinGlyph status={k.status} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[14px] font-bold">{k.label}</span>
                  <span className="block text-[13px] text-[var(--ink-2)]">{k.detail}</span>
                </span>
              </li>
            ))}
            <li className="flex items-center gap-3 border-t border-[var(--line)] pt-3">
              <span className="grid w-5 place-items-center">
                <span aria-hidden className="size-4 rounded-[3px] border border-[#a7a08b] bg-[#8f8c78]/20" />
              </span>
              <span className="text-[13px] leading-tight text-[var(--ink-2)]">
                Protected area with no SAPAA site. Tinted areas take their site&apos;s colour.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="grid w-5 place-items-center">
                <span aria-hidden className="h-0 w-5 border-t-[3px] border-dashed" style={{ borderColor: TRACK_COLOR }} />
              </span>
              <span className="text-[13px] leading-tight text-[var(--ink-2)]">GPX track from a site visit</span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-[var(--ink-2)]">
            Basemap ©{' '}
            <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              OpenStreetMap
            </a>{' '}
            contributors, served by{' '}
            <a className="underline" href="https://protomaps.com" target="_blank" rel="noreferrer">
              Protomaps
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
