import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Info, 
  RotateCcw, 
  Compass, 
  ZoomIn, 
  ZoomOut,
  Crosshair
} from 'lucide-react';

interface LocationMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
  readonly?: boolean;
}

// New Damietta Default Center Coordinates
const DEFAULT_CENTER = { lat: 31.4357, lng: 31.6708 };

// Popular New Damietta District Presets for Instant Snapping
const DISTRICT_PRESETS = [
  { name: 'الحي المتميز', lat: 31.4420, lng: 31.6850 },
  { name: 'الحي الأول', lat: 31.4300, lng: 31.6620 },
  { name: 'الحي الثاني', lat: 31.4320, lng: 31.6710 },
  { name: 'الحي الثالث', lat: 31.4360, lng: 31.6650 },
  { name: 'الحي الرابع', lat: 31.4400, lng: 31.6750 },
  { name: 'الحي الخامس', lat: 31.4450, lng: 31.6800 },
  { name: 'منطقة الشاليهات', lat: 31.4550, lng: 31.6900 },
  { name: 'سكن مصر / دار مصر', lat: 31.4280, lng: 31.6800 },
  { name: 'المنطقة المركزية', lat: 31.4380, lng: 31.6700 },
];

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  onChange,
  height = '360px',
  readonly = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(() => {
    return (latitude !== undefined && latitude !== null && !isNaN(Number(latitude)))
      ? Number(latitude)
      : DEFAULT_CENTER.lat;
  });

  const [currentLng, setCurrentLng] = useState<number>(() => {
    return (longitude !== undefined && longitude !== null && !isNaN(Number(longitude)))
      ? Number(longitude)
      : DEFAULT_CENTER.lng;
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Sync state if parent props change
  useEffect(() => {
    if (
      latitude !== undefined && 
      latitude !== null && 
      !isNaN(Number(latitude)) && 
      longitude !== undefined && 
      longitude !== null && 
      !isNaN(Number(longitude))
    ) {
      const numLat = Number(latitude);
      const numLng = Number(longitude);
      setCurrentLat(numLat);
      setCurrentLng(numLng);

      if (markerRef.current) {
        markerRef.current.setLatLng([numLat, numLng]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([numLat, numLng]);
      }
    }
  }, [latitude, longitude]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
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

    // Custom Draggable Gold Sakani Pin Marker
    const customIcon = L.divIcon({
      className: 'sakani-picker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: ${readonly ? 'default' : 'grab'};">
          <div style="width: 42px; height: 42px; background: #8D6A28; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 6px 18px rgba(141, 106, 40, 0.5); border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center;">
            <svg style="transform: rotate(45deg); width: 20px; height: 20px; color: #ffffff;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </div>
          <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1.5px); margin-top: 2px;"></div>
        </div>
      `,
      iconSize: [42, 48],
      iconAnchor: [21, 46],
    });

    const marker = L.marker([currentLat, currentLng], {
      icon: customIcon,
      draggable: !readonly,
    }).addTo(map);

    markerRef.current = marker;

    if (!readonly) {
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        updatePosition(position.lat, position.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        updatePosition(e.latlng.lat, e.latlng.lng);
      });
    }

    setMapReady(true);

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updatePosition = (lat: number, lng: number) => {
    const fixedLat = Number(lat.toFixed(6));
    const fixedLng = Number(lng.toFixed(6));
    setCurrentLat(fixedLat);
    setCurrentLng(fixedLng);
    onChange({ lat: fixedLat, lng: fixedLng });
    setLocError(null);
  };

  const handleSelectPreset = (lat: number, lng: number) => {
    if (readonly) return;
    updatePosition(lat, lng);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
    }
  };

  const handleGetLiveLocation = () => {
    if (readonly) return;
    if (!navigator.geolocation) {
      setLocError('خاصية تحديد الموقع غير مدعومة في متصفحك');
      return;
    }

    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude: lat, longitude: lng } = position.coords;
        updatePosition(lat, lng);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1 });
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        setLocError('تعذر تحديد موقعك الحالي، يرجى النقر يدوياً على الخريطة');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleResetToCenter = () => {
    handleSelectPreset(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
  };

  return (
    <div className="space-y-3 font-['Cairo']" dir="rtl">
      
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#8D6A28]" />
            <span>تحديد موقع العقار على الخريطة التفاعلية:</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            (اسحب الدبوس الذهبي أو انقر على موقع العقار)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGetLiveLocation}
            disabled={isLocating || readonly}
            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8D6A28] border border-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
            title="تحديد موقعي الحالي بدقة GPS"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'جاري التحديد...' : 'موقعي الآن'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToCenter}
            disabled={readonly}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs transition cursor-pointer"
            title="إعادة التوسيط إلى دمياط الجديدة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick District Presets Buttons */}
      {!readonly && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 ml-1">
            أحياء سريعة:
          </span>
          {DISTRICT_PRESETS.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => handleSelectPreset(d.lat, d.lng)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-amber-50 hover:text-[#8D6A28] hover:border-amber-300 border border-slate-200 text-[11px] font-medium text-slate-600 transition shrink-0 cursor-pointer shadow-2xs"
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {/* Error Message if GPS fails */}
      {locError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{locError}</span>
        </div>
      )}

      {/* Interactive Map Container */}
      <div 
        className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-100 w-full"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Coordinates Status Card on Top Left */}
        <div className="absolute top-3 left-3 z-[500] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-right text-xs pointer-events-none">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
            <Crosshair className="w-3 h-3 text-[#8D6A28]" />
            <span>الإحداثيات المختارة:</span>
          </div>
          <div className="font-mono font-bold text-slate-800 text-[11px] pt-0.5" dir="ltr">
            {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          </div>
        </div>

        {/* Bottom Helper Hint Banner */}
        <div className="absolute bottom-2.5 right-2.5 left-2.5 sm:left-auto z-[500] bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-medium flex items-center justify-between sm:justify-start gap-2 shadow-lg border border-white/10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>انقر في أي مكان لوضع الدبوس</span>
          </div>
        </div>
      </div>

      {/* Hidden Lat and Lng inputs for form serialization */}
      <input type="hidden" name="latitude" value={currentLat} />
      <input type="hidden" name="longitude" value={currentLng} />
    </div>
  );
};
