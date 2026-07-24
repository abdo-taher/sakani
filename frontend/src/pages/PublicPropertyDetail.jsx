import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BedDouble,
  Bath,
  Layers,
  Ruler,
  Paintbrush,
  Sofa,
  Building2,
  Video,
  Heart,
  CheckCircle2,
} from "lucide-react";
import usePageTitle from "../hooks/usePageTitle";
import { getPropertyById, recordView } from "../services/propertyService";
import { createReservation, checkReservation } from "../services/reservationService";
import { formatPhone, getPhoneError } from "../utils/phoneValidator";
import { COFFEE } from "../constants/constants";
import { successToast, errorToast } from "../utils/toast";
import { SAMPLE_IMG, fmtPrice } from "../utils/helpers";
import VideoThumb from "../components/VideoThumb";

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

function PublicPropertyDetail() {
  usePageTitle("تفاصيل العقار — سكني");
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(0);

  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [phoneError, setPhoneError] = useState("");
  const [alreadyReserved, setAlreadyReserved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const response = await getPropertyById(id);
      setProperty(response.data);
      recordView(id).catch(() => {});
    } catch (error) {
      console.error(error);
      errorToast("تعذر تحميل بيانات العقار");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const checkIfReserved = async (phone) => {
    if (!phone || phone.length < 11) return;
    setChecking(true);
    try {
      const res = await checkReservation(property.id, phone);
      setAlreadyReserved(res.reserved);
    } catch {
      setAlreadyReserved(false);
    } finally {
      setChecking(false);
    }
  };

  const handleReserve = async () => {
    const err = getPhoneError(form.phone);
    if (err) { setPhoneError(err); return; }
    if (!form.name.trim()) { errorToast("الاسم مطلوب"); return; }
    setPhoneError("");
    if (alreadyReserved) return;

    setSubmitting(true);
    try {
      await createReservation({
        property_id: property.id,
        name: form.name,
        phone: form.phone,
        message: form.message,
      });
      setReserveSuccess(true);
      setForm({ name: "", phone: "", message: "" });
    } catch {
      errorToast("حدث خطأ أثناء إرسال طلب الحجز");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold" style={{ color: COFFEE.stone }}>جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const images = (property.images || [])
    .filter((img) => (img.media_type || "image") === "image")
    .map((img) => img.image_url);

  const videos = (property.images || [])
    .filter((img) => img.media_type === "video")
    .map((img) => img.image_url);

  if (videos.length === 0 && property.video_url) {
    videos.push(property.video_url);
  }

  const media = [
    ...images.map((url) => ({ type: "image", url })),
    ...videos.map((url) => ({ type: "video", url })),
  ];

  if (media.length === 0) {
    media.push({ type: "image", url: SAMPLE_IMG(property.id) });
  }

  const currentMedia = media[mediaIndex] || media[0];
  const statusInfo = STATUS_MAP[property.status] || STATUS_MAP.available;
  const isRent = property.category?.slug === "rent";

  return (
    <div>
      <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto" dir="rtl">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-bold transition hover:opacity-70"
          style={{ color: COFFEE.dark }}
        >
          <ArrowRight size={20} /> رجوع
        </button>

        {/* Title + Status */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
              {property.title}
            </h1>
            <p className="flex items-center gap-1.5 mt-2 text-sm" style={{ color: COFFEE.stone }}>
              <MapPin size={14} /> {property.location?.name}
            </p>
          </div>
          <div
            className="px-4 py-2 rounded-xl font-bold text-sm shrink-0"
            style={{ background: statusInfo.bg, color: statusInfo.color }}
          >
            {statusInfo.label}
          </div>
        </div>

        {/* Slider + Details */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Slider - 3 cols */}
          <div className="lg:col-span-3">
            <div className="relative rounded-3xl overflow-hidden bg-stone-100" style={{ aspectRatio: "16/10" }}>
              {currentMedia.type === "video" ? (
                <video key={currentMedia.url} src={currentMedia.url} controls preload="none" className="w-full h-full object-cover" />
              ) : (
                <img src={currentMedia.url} alt={property.title} loading="lazy" className="w-full h-full object-cover" />
              )}

              {media.length > 1 && (
                <>
                  <button
                    onClick={() => setMediaIndex((i) => (i + 1) % media.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setMediaIndex((i) => (i - 1 + media.length) % media.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {media.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full font-bold">
                  {mediaIndex + 1} / {media.length}
                </div>
              )}

              {currentMedia.type === "video" && (
                <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Video size={12} /> فيديو
                </div>
              )}
            </div>

            {media.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {media.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMediaIndex(idx)}
                    className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition ${idx === mediaIndex ? "border-amber-600" : "border-transparent"}`}
                  >
                    {m.type === "video" ? (
                      <div className="relative w-full h-full overflow-hidden bg-black">
                        <VideoThumb src={m.url} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video size={14} color="white" />
                        </div>
                      </div>
                    ) : (
                      <img src={m.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {property.description && (
              <div className="mt-6">
                <h3 className="font-bold mb-3" style={{ color: COFFEE.dark }}>الوصف</h3>
                <p className="leading-relaxed" style={{ color: COFFEE.stone }}>{property.description}</p>
              </div>
            )}

            {property.amenities?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold mb-3" style={{ color: COFFEE.dark }}>المميزات والمرافق</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a.id} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: COFFEE.cream, color: COFFEE.dark }}>
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details + Reservation - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price */}
            <div className="rounded-2xl p-6 text-center" style={{ background: "#FBF3DF" }}>
              <p className="text-sm font-bold mb-1" style={{ color: COFFEE.stone }}>
                {isRent ? "الإيجار الشهري" : "السعر"}
              </p>
              <p className="text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
                {property.price?.toLocaleString()} ج.م
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Layers, label: "القسم", value: property.category?.name },
                { icon: Building2, label: "نوع العقار", value: property.propertyType?.name },
                { icon: MapPin, label: "المكان", value: property.location?.name },
                ...(!isRent && property.area ? [{ icon: Ruler, label: "المساحة", value: `${property.area} م²` }] : []),
                { icon: BedDouble, label: "الغرف", value: property.rooms },
                { icon: Bath, label: "الحمامات", value: property.bathrooms },
                { icon: Layers, label: "الدور", value: property.floor },
                { icon: Paintbrush, label: "التشطيب", value: FINISHING_MAP[property.finishing] || property.finishing },
                { icon: Sofa, label: "التأثيث", value: FURNISHING_MAP[property.furnishing] || property.furnishing },
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl p-3 border flex items-start gap-2" style={{ borderColor: COFFEE.line, background: "white" }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COFFEE.cream }}>
                    <item.icon size={14} color={COFFEE.gold} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold" style={{ color: COFFEE.stone }}>{item.label}</p>
                    <p className="text-sm font-bold truncate" style={{ color: COFFEE.dark }}>{item.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reservation Form */}
            {property.status === "available" && (
              <div className="rounded-2xl border p-5" style={{ borderColor: COFFEE.line, background: "white" }}>
                {reserveSuccess ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#DCFCE7" }}>
                      <CheckCircle2 className="w-8 h-8" style={{ color: "#16A34A" }} />
                    </div>
                    <h3 className="font-extrabold text-lg mb-2" style={{ color: COFFEE.dark }}>تم إرسال طلب الحجز</h3>
                    <p className="text-sm" style={{ color: COFFEE.stone }}>سنتواصل معك في أقرب وقت</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-extrabold mb-4" style={{ color: COFFEE.dark }}>احجز الآن</h3>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="الاسم الكامل"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                        style={{ borderColor: COFFEE.line }}
                      />

                      <div>
                        <input
                          type="tel"
                          placeholder="01xxxxxxxxx"
                          value={form.phone}
                          dir="ltr"
                          onChange={(e) => {
                            const val = formatPhone(e.target.value);
                            setForm({ ...form, phone: val });
                            if (phoneError) setPhoneError(getPhoneError(val) || "");
                            if (alreadyReserved) setAlreadyReserved(false);
                          }}
                          onBlur={() => checkIfReserved(form.phone)}
                          className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ${phoneError ? "border-red-400" : alreadyReserved ? "border-amber-400" : ""}`}
                          style={!phoneError && !alreadyReserved ? { borderColor: COFFEE.line } : {}}
                        />
                        {phoneError && <p className="text-red-500 text-xs mt-1 font-semibold">{phoneError}</p>}
                        {alreadyReserved && !phoneError && (
                          <p className="text-amber-600 text-xs mt-1 font-semibold">لقد قمت بحجز هذا العقار بالفعل</p>
                        )}
                        {checking && !phoneError && (
                          <p className="text-stone-400 text-xs mt-1">جاري التحقق...</p>
                        )}
                      </div>

                      <textarea
                        placeholder="ملاحظات (اختياري)"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        rows={2}
                        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 resize-none"
                        style={{ borderColor: COFFEE.line }}
                      />

                      <button
                        onClick={handleReserve}
                        disabled={submitting || alreadyReserved}
                        className="w-full py-3.5 rounded-xl font-bold text-sm transition hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                        style={{
                          backgroundColor: alreadyReserved ? "#16A34A" : COFFEE.gold,
                          color: alreadyReserved ? "#fff" : COFFEE.darkest,
                        }}
                      >
                        {alreadyReserved ? "تم الحجز بالفعل" : submitting ? "جاري الإرسال..." : "إرسال طلب الحجز"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicPropertyDetail;
