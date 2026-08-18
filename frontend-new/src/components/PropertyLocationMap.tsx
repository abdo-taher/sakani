import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ExternalLink, Map as MapIcon } from 'lucide-react';

interface PropertyLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string;
  propertyTitle?: string;
  height?: string;
  compact?: boolean;
}

export const PropertyLocationMap: React.FC<PropertyLocationMapProps> = ({
  latitude,
  longitude,
  locationName = 'دمياط الجديدة',
  propertyTitle = 'العقار',
  height = '340px',
  compact = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Default to New Damietta center if coordinates not explicitly saved
  const lat = (latitude !== undefined && latitude !== null && !isNaN(Number(latitude))) ? Number(latitude) : 31.4357;
  const lng = (longitude !== undefined && longitude !== null && !isNaN(Number(longitude))) ? Number(longitude) : 31.6708;

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Custom Gold Sakani Pin Marker
    const customIcon = L.divIcon({
      className: 'sakani-leaflet-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <div style="width: 36px; height: 36px; background: #8D6A28; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 14px rgba(141, 106, 40, 0.45); border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center;">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: #ffffff;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </div>
          <div style="position: absolute; bottom: -4px; width: 10px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px);"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 38],
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: 'Cairo', sans-serif; text-align: right; direction: rtl; padding: 4px;">
        <strong style="color: #0F172A; font-size: 13px; display: block; margin-bottom: 2px;">${propertyTitle}</strong>
        <span style="color: #8D6A28; font-size: 11px;">📍 ${locationName}</span>
      </div>
    `);

    // Invalidate size to ensure container fits accurately
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, locationName, propertyTitle]);

  if (compact) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute bottom-2.5 right-2.5 z-[500] px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md border border-white/10 pointer-events-none">
          <MapPin className="w-3 h-3 text-[#D6A94E]" />
          <span>{locationName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4 font-['Cairo']" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8D6A28] border border-amber-200/60 flex items-center justify-center font-bold">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">موقع العقار على الخريطة التفاعلية</h3>
            <p className="text-xs text-slate-500 font-normal">{locationName}</p>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer border border-slate-200"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#8D6A28]" />
          <span>فتح في خرائط Google</span>
        </a>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Floating badge */}
        <div className="absolute bottom-3 right-3 z-[500] px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-2 shadow-lg border border-white/10 pointer-events-none">
          <MapPin className="w-4 h-4 text-[#D6A94E]" />
          <span>{locationName}</span>
        </div>
      </div>
    </div>
  );
};
