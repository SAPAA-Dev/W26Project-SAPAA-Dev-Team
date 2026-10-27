'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap, PointLike } from 'maplibre-gl';
import { Trash2, X } from 'lucide-react';
import {
  MAX_OFFLINE_ZOOM,
  MAX_TILES_PER_DOWNLOAD,
  MIN_OFFLINE_ZOOM,
  OfflineArea,
  countTiles,
  estimateBytes,
} from '@/lib/map/offline/tileMath';
import {
  DownloadAbortedError,
  DownloadProgress,
  SavedRegion,
  downloadArea,
  removeRegion,
} from '@/lib/map/offline/tileCache';

export interface OfflineSavePanelProps {
  map: MapLibreMap;
  styleUrl: string;
  savedRegions: SavedRegion[];
  onSaved: (region: SavedRegion) => void;
  onRegionRemoved: (id: string) => void;
  onClose: () => void;
}

interface AreaBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

type PanelStatus = 'ready' | 'downloading' | 'success';

const OFFLINE_MESSAGE = 'Go online to download tiles.';
const ZERO_TILES_MESSAGE = 'No tiles in this area.';

const ZOOM_OPTIONS = Array.from(
  { length: MAX_OFFLINE_ZOOM - MIN_OFFLINE_ZOOM + 1 },
  (_, index) => MIN_OFFLINE_ZOOM + index
);

function clampZoom(value: number): number {
  return Math.min(MAX_OFFLINE_ZOOM, Math.max(MIN_OFFLINE_ZOOM, value));
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatSavedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function OfflineSavePanel({
  map,
  styleUrl,
  savedRegions,
  onSaved,
  onRegionRemoved,
  onClose,
}: OfflineSavePanelProps) {
  const rectangleRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [zoomMin, setZoomMin] = useState(() => clampZoom(Math.floor(map.getZoom()) - 2));
  const [zoomMax, setZoomMax] = useState(() => clampZoom(Math.floor(map.getZoom()) + 2));
  const [bounds, setBounds] = useState<AreaBounds | null>(null);
  const [status, setStatus] = useState<PanelStatus>('ready');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTileCount, setSavedTileCount] = useState(0);
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  const recomputeBounds = useCallback(() => {
    const rectangle = rectangleRef.current;
    if (rectangle === null) return;
    const rect = rectangle.getBoundingClientRect();
    const container = map.getContainer().getBoundingClientRect();

    // A rectangle with no size, as in a hidden view, has no usable corners.
    if (rect.width === 0 || rect.height === 0) {
      setBounds(null);
      return;
    }

    const corners = [
      { x: rect.left - container.left, y: rect.top - container.top },
      { x: rect.right - container.left, y: rect.top - container.top },
      { x: rect.left - container.left, y: rect.bottom - container.top },
      { x: rect.right - container.left, y: rect.bottom - container.top },
    // maplibre accepts an { x, y } object at run time, but its PointLike type
    // only names Point and a tuple.
    ].map((point) => map.unproject(point as unknown as PointLike));

    const longitudes = corners.map((corner) => corner.lng);
    const latitudes = corners.map((corner) => corner.lat);
    setBounds({
      west: Math.min(...longitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      north: Math.max(...latitudes),
    });
  }, [map]);

  useEffect(() => {
    recomputeBounds();
    map.on('moveend', recomputeBounds);
    return () => {
      map.off('moveend', recomputeBounds);
    };
  }, [map, recomputeBounds]);

  // A download that outlives the panel would keep fetching and then record a
  // region the user never confirmed, so unmounting aborts it.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const area: OfflineArea | null = useMemo(
    () => (bounds === null ? null : { ...bounds, zoomMin, zoomMax }),
    [bounds, zoomMin, zoomMax]
  );
  const tileCount = useMemo(() => (area === null ? 0 : countTiles(area)), [area]);
  const bytes = useMemo(() => (area === null ? 0 : estimateBytes(area)), [area]);

  const handleZoomMinChange = (value: number) => {
    const next = clampZoom(value);
    setZoomMin(next);
    setZoomMax((current) => Math.max(next, current));
  };

  const handleZoomMaxChange = (value: number) => {
    const next = clampZoom(value);
    setZoomMax(next);
    setZoomMin((current) => Math.min(next, current));
  };

  const handleSave = async () => {
    if (area === null) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('downloading');
    setProgress(null);
    setError(null);
    try {
      const result = await downloadArea({
        area,
        styleUrl,
        signal: controller.signal,
        onProgress: (value) => setProgress(value),
      });
      onSaved(result.region);
      setSavedTileCount(result.region.tileCount);
      setStatus('success');
    } catch (caught) {
      // An abort is a user action, not a failure, so the panel returns silently.
      if (!(caught instanceof DownloadAbortedError)) {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
      setStatus('ready');
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const handleRemove = async (id: string) => {
    await removeRegion(id);
    onRegionRemoved(id);
  };

  let saveMessage: string | null = null;
  let saveDisabled = false;
  if (!online) {
    saveDisabled = true;
    saveMessage = OFFLINE_MESSAGE;
  } else if (tileCount === 0) {
    saveDisabled = true;
    saveMessage = ZERO_TILES_MESSAGE;
  } else if (tileCount > MAX_TILES_PER_DOWNLOAD) {
    saveDisabled = true;
    saveMessage = `Too many tiles: ${tileCount}. Zoom in or narrow the zoom band.`;
  }

  const downloading = status === 'downloading';
  const progressPercent =
    progress !== null && progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div
        ref={rectangleRef}
        className="pointer-events-none absolute left-[14%] top-[14%] h-[72%] w-[72%] border-2 border-dashed border-[#356B43]"
      >
        <span className="absolute -top-3 left-3 rounded-full bg-[#356B43] px-2.5 py-0.5 text-xs font-medium text-[#F7F2EA]">
          Saved area
        </span>
      </div>

      <div className="absolute left-0 right-0 top-[calc(86%+0.5rem)] flex justify-center">
        {bounds === null ? (
          <span className="rounded-full border border-[#E4EBE4] bg-white/95 px-3 py-1 text-xs text-[#5B655D] shadow-sm">
            Pan or zoom the map to set the area.
          </span>
        ) : (
          <span className="rounded-full border border-[#E4EBE4] bg-white/95 px-3 py-1 text-xs text-[#254431] shadow-sm">
            <span>{tileCount} tiles</span>
            <span className="mx-1.5 text-[#5B655D]">·</span>
            <span>{formatBytes(bytes)}</span>
          </span>
        )}
      </div>

      <section className="pointer-events-auto absolute right-4 top-4 w-80 rounded-xl border border-[#E4EBE4] bg-white/95 p-4 shadow-lg">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#254431]">Save map area</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close panel"
            className="rounded p-1 text-[#5B655D] hover:bg-[#E4EBE4] hover:text-[#254431]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="offline-zoom-min" className="text-xs font-medium text-[#5B655D]">
            From zoom
          </label>
          <select
            id="offline-zoom-min"
            value={zoomMin}
            disabled={downloading}
            onChange={(event) => handleZoomMinChange(Number(event.target.value))}
            className="rounded-lg border border-[#E4EBE4] bg-[#F7F2EA] px-2 py-1 text-xs text-[#254431]"
          >
            {ZOOM_OPTIONS.map((zoom) => (
              <option key={zoom} value={zoom}>
                z{zoom}
              </option>
            ))}
          </select>
          <label htmlFor="offline-zoom-max" className="text-xs font-medium text-[#5B655D]">
            To zoom
          </label>
          <select
            id="offline-zoom-max"
            value={zoomMax}
            disabled={downloading}
            onChange={(event) => handleZoomMaxChange(Number(event.target.value))}
            className="rounded-lg border border-[#E4EBE4] bg-[#F7F2EA] px-2 py-1 text-xs text-[#254431]"
          >
            {ZOOM_OPTIONS.map((zoom) => (
              <option key={zoom} value={zoom}>
                z{zoom}
              </option>
            ))}
          </select>
        </div>

        {status === 'ready' && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveDisabled}
              className="w-full rounded-lg bg-[#356B43] px-3 py-2 text-sm font-semibold text-[#F7F2EA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save area
            </button>
            {saveMessage !== null && <p className="mt-2 text-xs text-[#5B655D]">{saveMessage}</p>}
          </div>
        )}

        {downloading && (
          <div className="mt-3">
            {progress !== null ? (
              <>
                <div className="h-2 w-full rounded-full bg-[#E4EBE4]">
                  <div
                    className="h-2 rounded-full bg-[#356B43]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#254431]">
                  {`${progress.phase}: ${progress.done}/${progress.total}`}
                </p>
                {progress.failed > 0 && (
                  <p className="text-xs text-[#5B655D]">{`${progress.failed} failed`}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-[#254431]">Starting download.</p>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="mt-2 w-full rounded-lg border border-[#356B43] px-3 py-2 text-sm font-semibold text-[#356B43]"
            >
              Cancel
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-3">
            <p className="rounded-lg bg-[#E4EBE4] px-3 py-2 text-xs font-medium text-[#254431]">
              {`Saved ${savedTileCount} tiles. This area works offline now.`}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 w-full rounded-lg border border-[#356B43] px-3 py-2 text-sm font-semibold text-[#356B43]"
            >
              Close
            </button>
          </div>
        )}

        {error !== null && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-[#F7F2EA] px-3 py-2 text-xs text-[#254431]"
          >
            {error}
          </p>
        )}

        {savedRegions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#5B655D]">
              Saved areas
            </h4>
            <ul className="mt-2 space-y-1.5">
              {savedRegions.map((region) => (
                <li
                  key={region.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-[#F7F2EA] px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-[#254431]">
                      {`z${region.zoomMin} to z${region.zoomMax}`}
                    </p>
                    <p className="text-xs text-[#5B655D]">
                      {`${region.tileCount} tiles · ${formatSavedDate(region.savedAt)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete saved area"
                    disabled={downloading}
                    onClick={() => void handleRemove(region.id)}
                    className="rounded p-1 text-[#5B655D] hover:bg-[#E4EBE4] hover:text-[#254431] disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
