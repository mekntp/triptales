import React, { useEffect, useRef, useState } from 'react';
import type { Place, RouteSummary } from '../types';
import { MapPin, Navigation, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { formatDurationThai, generateGoogleMapsDirectionsUrl } from '../lib/route';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  places: Place[];
  routeSummary: RouteSummary;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  places,
  routeSummary,
  selectedPlaceId,
  onSelectPlace,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);

  const activePlaces = places.filter(
    (p) => p.status !== 'skipped' && p.latitude !== undefined && p.longitude !== undefined
  );

  // Initialize or update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        // Initial center: first place or default Phichit coordinates
        const initialLat = activePlaces[0]?.latitude || 16.4422;
        const initialLng = activePlaces[0]?.longitude || 100.3495;

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 13,
          zoomControl: false,
          attributionControl: false,
        });

        // Add OSM tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      const latLngs: L.LatLngExpression[] = [];

      // Add numbered markers
      activePlaces.forEach((place, index) => {
        if (place.latitude === undefined || place.longitude === undefined) return;
        const latLng: [number, number] = [place.latitude, place.longitude];
        latLngs.push(latLng);

        const isVisited = place.status === 'visited';
        const isSelected = selectedPlaceId === place.id;

        // Custom HTML Marker with number and icon
        const iconHtml = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            background: ${isVisited ? '#10b981' : isSelected ? '#f59e0b' : '#3b82f6'};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            color: #ffffff;
            font-weight: 800;
            font-size: 13px;
            font-family: inherit;
            cursor: pointer;
            position: relative;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.2s;
          ">
            <span>${index + 1}</span>
            <span style="position: absolute; -top: 6px; -right: 6px; font-size: 11px;">${place.icon}</span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-map-pin',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(latLng, { icon: customIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 140px; padding: 2px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b;">จุดที่ ${index + 1}</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 1px;">${place.name}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">${place.subtitle || ''}</div>
            <a href="${place.googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              margin-top: 6px;
              font-size: 11px;
              font-weight: 700;
              color: #2563eb;
              text-decoration: none;
            ">
              เปิด Google Maps ↗
            </a>
          </div>
        `);

        if (onSelectPlace) {
          marker.on('click', () => onSelectPlace(place.id));
        }

        markersRef.current.push(marker);
      });

      // Draw polyline connecting stops
      if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
        }).addTo(map);
        polylineRef.current = polyline;

        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 14);
      }

      // Handle map resize
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } catch (err) {
      console.warn('Leaflet map error, switching to fallback UI:', err);
      setHasMapError(true);
    }
  }, [places, selectedPlaceId, isExpanded, onSelectPlace]);

  // Clean up
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const fullDirectionsUrl = generateGoogleMapsDirectionsUrl(places);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Map Header Toolbar */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            🗺️
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 leading-tight">แผนที่เส้นทางขับรถ</h4>
            <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
              <span>{activePlaces.length} จุด</span>
              <span>•</span>
              <span>{routeSummary.totalDistanceKm} กม.</span>
              <span>•</span>
              <span>{formatDurationThai(routeSummary.totalDurationMinutes)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={fullDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="เปิดใน Google Maps ทั้งเส้นทาง"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] hidden sm:inline">Google Maps</span>
          </a>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer transition-all active:scale-95"
            title={isExpanded ? 'ย่อแผนที่' : 'ขยายแผนที่'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Body or Fallback */}
      {!hasMapError ? (
        <div
          ref={mapContainerRef}
          className={`w-full transition-all duration-300 relative z-0 ${
            isExpanded ? 'h-80' : 'h-48'
          }`}
        />
      ) : (
        /* Graceful Fallback if map tiles cannot be loaded */
        <div className="p-4 bg-slate-50 text-center">
          <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-700">เส้นทางพร้อมนำทาง {activePlaces.length} จุด</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            รวมระยะทาง {routeSummary.totalDistanceKm} กม. (~{formatDurationThai(routeSummary.totalDurationMinutes)})
          </p>
          <a
            href={fullDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิด Google Maps นำทาง</span>
          </a>
        </div>
      )}
    </div>
  );
};
