import { useState } from "react";
import { X, MapPin, Layers, Ruler, BedDouble, Bath, ArrowUpDown, Paintbrush, Sofa, Building2, ImageIcon, Video, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { COFFEE } from "../../constants/constants";

const STATUS_MAP = {
  available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
  reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
  sold: { label: "تم البيع", color: "#DC2626", bg: "#FEE2E2" },
  rented: { label: "تم التأجير", color: "#2563EB", bg: "#DBEAFE" },
};

const FINISHING_MAP = {
  super_lux: "سوبر لوكس",
  lux: "لوكس",
  semi_finished: "نصف تشطيب",
  red_brick: "طوب أحمر",
};

const FURNISHING_MAP = {
  furnished: "مفروش",
  unfurnished: "غير مفروش",
};

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div
      className="rounded-2xl p-4 border flex items-start gap-3"
      style={{ borderColor: COFFEE.line, background: "white" }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: COFFEE.cream }}
      >
        <Icon size={18} color={COFFEE.gold} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold mb-1" style={{ color: COFFEE.stone }}>
          {label}
        </p>
        <p className="font-bold truncate" style={{ color: COFFEE.dark }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function PropertyPreviewModal({ property, onClose }) {
  const [mediaIndex, setMediaIndex] = useState(0);
  if (!property) return null;

  const statusInfo = STATUS_MAP[property.status] || {
    label: property.status,
    color: COFFEE.stone,
    bg: COFFEE.cream,
  };

  const images = (property.images || []).filter(img => (img.media_type || 'image') === 'image');
  const videos = (property.images || []).filter(img => img.media_type === 'video');

  if (videos.length === 0 && property.video_url) {
    videos.push({ image_url: property.video_url });
  }
  const amenities = property.amenities || [];

  const media = [
    ...images.map(img => ({ type: 'image', url: img.image_url, id: img.id })),
    ...videos.map(img => ({ type: 'video', url: img.image_url, id: img.id })),
  ];

  const totalMedia = media.length;
  const currentMedia = totalMedia > 0 ? media[mediaIndex] : null;

  return (
    <div
      className="fixed inset-0 bg-black/55 z-[500] flex items-center justify-center p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF6F0] rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div
          className="shrink-0 flex justify-between items-center px-8 py-6"
          style={{ background: COFFEE.dark }}
        >
          <div>
            <h2 className="text-2xl font-bold text-white">{property.title}</h2>
            <p className="text-sm mt-1" style={{ color: COFFEE.goldLight }}>
              {property.price?.toLocaleString()} ج.م
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span
              className="px-4 py-2 rounded-full text-sm font-bold"
              style={{ background: statusInfo.bg, color: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition"
            >
              <X color="white" size={22} />
            </button>
          </div>
        </div>

        {/* Media Slider */}
        {totalMedia > 0 && (
          <div className="relative w-full h-64 sm:h-80 shrink-0 bg-black overflow-hidden">
            {currentMedia.type === 'video' ? (
              <video
                key={mediaIndex}
                src={currentMedia.url}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                key={mediaIndex}
                src={currentMedia.url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}

            {totalMedia > 1 && (
              <>
                <button
                  onClick={() => setMediaIndex((i) => (i + 1) % totalMedia)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <ChevronRight className="w-5 h-5" style={{ color: COFFEE.dark }} />
                </button>
                <button
                  onClick={() => setMediaIndex((i) => (i - 1 + totalMedia) % totalMedia)}
                  className="absolute top-1/2 -translate-y-1/2 left-3 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: COFFEE.dark }} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {media.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMediaIndex(i)}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: i === mediaIndex ? "20px" : "6px", backgroundColor: i === mediaIndex ? COFFEE.gold : "rgba(255,255,255,0.7)" }}
                    />
                  ))}
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-black/50">
                  {mediaIndex + 1} / {totalMedia}
                </div>
              </>
            )}
          </div>
        )}

        {/* Thumbnail Strip */}
        {totalMedia > 1 && (
          <div className="flex gap-2 overflow-x-auto px-8 py-3 shrink-0 bg-white border-b" style={{ borderColor: COFFEE.line }}>
            {media.map((m, idx) => (
              <button
                key={m.id || idx}
                onClick={() => setMediaIndex(idx)}
                className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === mediaIndex ? 'border-amber-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {m.type === 'video' ? (
                  <div className="w-16 h-12 bg-gray-900 flex items-center justify-center">
                    <Video size={14} color="white" />
                  </div>
                ) : (
                  <img src={m.url} alt="" className="w-16 h-12 object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="overflow-y-auto p-8">
          {/* البيانات الأساسية */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <InfoCard icon={Layers} label="النوع" value={property.category?.name} />
            <InfoCard icon={Building2} label="القسم" value={property.propertyType?.name} />
            <InfoCard icon={MapPin} label="المكان" value={property.location?.name} />
            <InfoCard icon={Ruler} label="المساحة" value={property.area ? `${property.area} م²` : null} />
            <InfoCard icon={BedDouble} label="الغرف" value={property.rooms} />
            <InfoCard icon={Bath} label="الحمامات" value={property.bathrooms} />
            <InfoCard icon={ArrowUpDown} label="الدور" value={property.floor} />
            <InfoCard
              icon={Paintbrush}
              label="التشطيب"
              value={FINISHING_MAP[property.finishing] || property.finishing}
            />
            <InfoCard
              icon={Sofa}
              label="الفرش"
              value={FURNISHING_MAP[property.furnishing] || property.furnishing}
            />
            {property.balconies > 0 && (
              <InfoCard icon={Layers} label="البلكونات" value={property.balconies} />
            )}
          </div>

          {/* المميزات */}
          {amenities.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} color={COFFEE.gold} />
                <h3 className="font-bold" style={{ color: COFFEE.dark }}>
                  المميزات
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span
                    key={a.id}
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: "rgba(204,154,58,0.15)", color: COFFEE.dark }}
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* الوصف */}
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ color: COFFEE.dark }}>
              الوصف
            </h3>
            <p className="leading-8" style={{ color: COFFEE.stone }}>
              {property.description || "لا يوجد وصف"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyPreviewModal;
