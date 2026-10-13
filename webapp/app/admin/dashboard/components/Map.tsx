"use client";

import { MapContainer, TileLayer, useMap, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// leaflet.heat attaches heatLayer to L at runtime; @types/leaflet does not declare it.
type LeafletWithHeat = typeof L & {
  heatLayer?: (latlngs: number[][], options: Record<string, unknown>) => L.Layer;
};

interface MapPoint {
  latitude: number;
  longitude: number;
  weight?: number;
  namesite?: string;
}

interface MapProps {
  points: MapPoint[];
  showHeatmap?: boolean;
}

export default function Map({ points, showHeatmap = true }: MapProps) {
  function Heatmap() {
    const map = useMap();
    const heatLayerRef = useRef<L.Layer | null>(null);

    useEffect(() => {
      const initHeatmap = async () => {
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
        if (!points || points.length === 0 || !showHeatmap) return;

        try {
          if (typeof window !== 'undefined' && !(L as LeafletWithHeat).heatLayer) {
            await import('leaflet.heat');
          }
        } catch { return; }

        if (typeof (L as LeafletWithHeat).heatLayer !== 'function') return;

        const heatData = points
          .filter(p => p && typeof p.latitude === 'number' && typeof p.longitude === 'number' &&
            !isNaN(p.latitude) && !isNaN(p.longitude))
          .map(p => [p.latitude, p.longitude, Math.max(0.1, Math.min(1, p.weight || 0.5))]);

        if (heatData.length === 0) return;

        try {
          heatLayerRef.current = (L as LeafletWithHeat).heatLayer!(heatData, {
            radius: 40,
            blur: 25,
            maxZoom: 18,
            max: 1.0,
            minOpacity: 0.6,
            gradient: { 0.0: 'blue', 0.2: 'cyan', 0.4: 'lime', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red' }
          });
          heatLayerRef.current.addTo(map);
          setTimeout(() => map.invalidateSize(), 100);
        } catch {}

        try {
          const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude] as [number, number]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        } catch {}
      };

      initHeatmap();
      return () => { if (heatLayerRef.current) { try { map.removeLayer(heatLayerRef.current); } catch {} } };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- points/showHeatmap are fixed per Heatmap instance (it is redefined each render); kept listed so the effect stays correct if Heatmap is hoisted
    }, [points, map, showHeatmap]);

    return null;
  }

  return (
    <MapContainer
      center={[53.5461, -113.4938]}
      zoom={5}
      style={{ height: "100%", width: "100%", position: "relative", zIndex: 0 }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* eslint-disable-next-line react-hooks/static-components -- Heatmap is redefined each render on purpose so it remounts and rebuilds the heat layer from the latest points */}
      <Heatmap />

      {/* One small green dot per site, on top of the heat blob */}
      {showHeatmap && points.map((point, idx) => (
        <CircleMarker
          key={idx}
          center={[point.latitude, point.longitude]}
          radius={5}
          pathOptions={{
            fillColor: '#2E7D32',
            fillOpacity: 0.9,
            color: '#fff',
            weight: 1.5,
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong className="text-[#254431]">{point.namesite}</strong>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}