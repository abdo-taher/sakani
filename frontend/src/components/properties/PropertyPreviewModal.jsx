import { X, MapPin, Layers, Ruler, BedDouble, Bath, ArrowUpDown, Paintbrush, Sofa, Building2, ImageIcon, Video, Sparkles } from "lucide-react";
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
  if (!property) return null;

  const statusInfo = STATUS_MAP[property.status] || {
    label: property.status,
    color: COFFEE.stone,
    bg: COFFEE.cream,
  };

  const images = property.images || [];
  const amenities = property.amenities || [];

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

        {/* Body (scrollable) */}
        <div className="overflow-y-auto p-8">
          {/* الصور */}
          {images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={18} color={COFFEE.gold} />
                <h3 className="font-bold" style={{ color: COFFEE.dark }}>
                  الصور ({images.length})
                </h3>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((img, idx) => (
  <img
    key={img.id || idx}
    src={img.image_url}
    alt={`صورة ${idx + 1}`}
    className="w-40 h-28 rounded-2xl object-cover shrink-0 border"
    style={{ borderColor: COFFEE.line }}
  />
))}
              </div>
            </div>
          )}

          {/* الفيديو */}
          {property.video_url && (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      <Video size={18} color={COFFEE.gold} />
      <h3 className="font-bold" style={{ color: COFFEE.dark }}>
        فيديو العقار
      </h3>
    </div>
    <video
      src={property.video_url}
      controls
      className="w-full max-h-64 rounded-2xl border"
      style={{ borderColor: COFFEE.line }}
    />
  </div>
)}

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