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
  ImageIcon,
  Tag,
  Home,
} from "lucide-react";
import usePageTitle from "../hooks/usePageTitle";
import { getPropertyById, recordView } from "../services/propertyService";
import { createReservation, checkReservation } from "../services/reservationService";
import { formatPhone, getPhoneError } from "../utils/phoneValidator";
import { COFFEE } from "../constants/constants";
import { successToast, errorToast } from "../utils/toast";
import { SAMPLE_IMG, fmtPrice } from "../utils/helpers";
import VideoThumb from "../components/VideoThumb";
import RelatedPropertiesSection from "../components/RelatedPropertiesSection";

const STATUS_MAP = {
  available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
  reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
  sold: { label: "تم البيع", color: "#DC2626", bg: "#FEE2E2" },
  rented: { label: "تم التأجير", color: "#2563EB", bg: "#DBEAFE" },
  0: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
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
  const [error, setError] = useState(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [phoneError, setPhoneError] = useState("");
  const [alreadyReserved, setAlreadyReserved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [reservationType, setReservationType] = useState("property");

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
      const status = error?.response?.status;
      if (status === 404) {
        setError("العقار غير موجود");
      } else {
        setError("تعذر تحميل بيانات العقار");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfReserved = async (phone) => {
    if (!phone || phone.length < 11) return;
    setChecking(true);
    try {
      const res = await checkReservation(property.id, phone, selectedRoomId);
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
        room_id: selectedRoomId,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold" style={{ color: COFFEE.mid }}>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-stone-300" />
          <h2 className="text-xl font-bold mb-2" style={{ color: COFFEE.mid }}>{error}</h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 rounded-lg text-white font-bold"
            style={{ background: COFFEE.gold }}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const images = (property.images || [])
    .filter((img) => (img.media_type || "image") === "image" && !img.caption)
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
    <div className="min-h-screen" dir="rtl">
      <div className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: COFFEE.stone }}>
          <button onClick={() => navigate("/")} className="flex items-center gap-1 hover:underline hover:opacity-80 transition">
            <Home className="w-3.5 h-3.5" /> الرئيسية
          </button>
          <ChevronLeft className="w-2.5 h-2.5" />
          {property.category?.slug === "rent" ? (
            <>
              <button onClick={() => navigate("/rent")} className="hover:underline hover:opacity-80 transition">الإيجار</button>
              <ChevronLeft className="w-2.5 h-2.5" />
              {property.location?.name && (
                <>
                  <button onClick={() => navigate(`/rent/${encodeURIComponent(property.location.name)}`)} className="hover:underline hover:opacity-80 transition">{property.location.name}</button>
                  <ChevronLeft className="w-2.5 h-2.5" />
                </>
              )}
            </>
          ) : property.category?.slug === "buy" ? (
            <>
              <button onClick={() => navigate("/buy")} className="hover:underline hover:opacity-80 transition">البيع</button>
              <ChevronLeft className="w-2.5 h-2.5" />
            </>
          ) : null}
          <span className="font-bold" style={{ color: COFFEE.dark }}>{property.title}</span>
        </nav>

        {/* Title + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight" style={{ color: COFFEE.dark }}>
              {property.title}
            </h1>
            <p className="flex items-center gap-1.5 mt-1.5 text-xs sm:text-sm" style={{ color: COFFEE.mid }}>
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{property.location?.name}</span>
            </p>
          </div>
          <div
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm shrink-0"
            style={{ background: statusInfo.bg, color: statusInfo.color }}
          >
            {statusInfo.label}
          </div>
        </div>

        {/* Slider + Details */}
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Slider - 3 cols */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Main media */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100" style={{ aspectRatio: window.innerWidth < 640 ? "4/3" : "16/10" }}>
              {currentMedia.type === "video" ? (
                <video key={currentMedia.url} src={currentMedia.url} controls preload="none" className="w-full h-full object-cover" />
              ) : (
                <img src={currentMedia.url} alt={property.title} loading="lazy" className="w-full h-full object-cover" />
              )}

              {media.length > 1 && (
                <>
                  <button
                    onClick={() => setMediaIndex((i) => (i + 1) % media.length)}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setMediaIndex((i) => (i - 1 + media.length) % media.length)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {media.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full font-bold">
                  {mediaIndex + 1} / {media.length}
                </div>
              )}

              {currentMedia.type === "video" && (
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-red-600 text-white text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Video size={12} /> فيديو
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {media.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMediaIndex(idx)}
                    className={`shrink-0 w-16 h-14 sm:w-20 sm:h-16 rounded-xl overflow-hidden border-2 transition ${
                      idx === mediaIndex ? "border-amber-600" : "border-transparent"
                    }`}
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

            {/* Description */}
            {property.description && (
              <div>
                <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>الوصف</h3>
                <p className="leading-relaxed text-xs sm:text-sm" style={{ color: COFFEE.mid }}>{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>المميزات والمرافق</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a.id} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold" style={{ background: COFFEE.cream, color: COFFEE.dark }}>
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {property.tags?.length > 0 && (
              <div>
                <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>الوسوم</h3>
                <div className="flex flex-wrap gap-2">
                  {property.tags.map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold" style={{ background: COFFEE.gold, color: "white" }}>
                      <Tag size={13} />
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms Section - for detailed mode */}
            {isRent && property.has_detailed_rooms && (() => {
              const rooms = Array.isArray(property.rooms) ? property.rooms : Array.isArray(property.detailed_rooms) ? property.detailed_rooms : [];
              return rooms.length > 0 ? (
                <div>
                  <h3 className="font-bold mb-3 text-sm sm:text-base" style={{ color: COFFEE.dark }}>الغرف المتاحة</h3>
                  <div className="grid gap-3">
                    {rooms.map((room) => {
                    const roomStatusMap = {
                      available: { label: "متاح", color: "#16A34A", bg: "#DCFCE7" },
                      reserved: { label: "محجوز", color: "#F59E0B", bg: "#FEF3C7" },
                      rented: { label: "مؤجر", color: "#2563EB", bg: "#DBEAFE" },
                    };
                    const roomStatus = roomStatusMap[room.status] || roomStatusMap.available;
                    const roomImages = room.room_images || room.roomImages || [];
                    const primaryImg = roomImages.find(img => img.is_primary) || roomImages[0];
                    const isSelected = selectedRoomId === room.id;

                    return (
                      <div
                        key={room.id}
                        className={`rounded-2xl border-2 p-3 sm:p-4 transition cursor-pointer ${
                          isSelected ? "ring-2 ring-amber-400" : "hover:shadow-md"
                        }`}
                        style={{
                          borderColor: isSelected ? COFFEE.gold : "#f0ebe4",
                          background: isSelected ? "rgba(204,154,58,0.05)" : "white",
                        }}
                        onClick={() => {
                          if (room.status === "available") {
                            setSelectedRoomId(isSelected ? null : room.id);
                            setReserveSuccess(false);
                            setAlreadyReserved(false);
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {primaryImg ? (
                            <img
                              src={primaryImg.image_url}
                              alt={room.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: COFFEE.cream }}
                            >
                              <ImageIcon size={22} color={COFFEE.gold} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-bold text-sm sm:text-base" style={{ color: COFFEE.dark }}>{room.name}</p>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{ background: roomStatus.bg, color: roomStatus.color }}
                              >
                                {roomStatus.label}
                              </span>
                            </div>
                            <p className="text-base sm:text-lg font-extrabold" style={{ color: COFFEE.gold }}>
                              {fmtPrice(room.price)}
                              <span className="text-[10px] sm:text-xs font-normal" style={{ color: COFFEE.mid }}> / شهر</span>
                            </p>
                            {room.area > 0 && (
                              <p className="text-[10px] sm:text-xs mt-1" style={{ color: COFFEE.mid }}>{room.area} م²</p>
                            )}
                            {room.description && (
                              <p className="text-[10px] sm:text-xs mt-1 line-clamp-2" style={{ color: COFFEE.mid }}>{room.description}</p>
                            )}
                          </div>
                        </div>
                        {room.status === "available" && (
                          <div className="mt-3 text-center">
                            <span
                              className="text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full transition"
                              style={{
                                background: isSelected ? COFFEE.gold : "rgba(204,154,58,0.1)",
                                color: isSelected ? COFFEE.dark : COFFEE.gold,
                              }}
                            >
                              {isSelected ? "تم التحديد ✓" : "اضغط لاختيار هذه الغرفة"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              ) : null;
            })()}
          </div>

          {/* Details + Reservation - 2 cols */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Price */}
            {isRent && property.has_detailed_rooms ? (
              <div className="rounded-2xl p-4 sm:p-6 text-center" style={{ background: "#FBF3DF" }}>
                <p className="text-xs sm:text-sm font-bold mb-1" style={{ color: COFFEE.mid }}>
                  {selectedRoomId ? "سعر الغرفة المختارة" : "يبدأ من"}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
                  {selectedRoomId ? (() => {
                    const rooms = Array.isArray(property.rooms) ? property.rooms : Array.isArray(property.detailed_rooms) ? property.detailed_rooms : [];
                    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
                    return selectedRoom?.price && selectedRoom.price > 0 ? `${fmtPrice(selectedRoom.price)}` : "اتصل للسعر";
                  })() : (() => {
                    const rooms = Array.isArray(property.rooms) ? property.rooms : Array.isArray(property.detailed_rooms) ? property.detailed_rooms : [];
                    const prices = rooms.map(r => r.price).filter(price => price && price > 0);
                    return prices.length > 0 ? `${fmtPrice(Math.min(...prices))}` : property.price && property.price > 0 ? `${fmtPrice(property.price)}` : "اتصل للسعر";
                  })()}
                </p>
                {selectedRoomId && (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: COFFEE.mid }}>الإيجار الشهري</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl p-4 sm:p-6 text-center" style={{ background: "#FBF3DF" }}>
                <p className="text-xs sm:text-sm font-bold mb-1" style={{ color: COFFEE.mid }}>
                  {isRent ? "الإيجار الشهري" : "السعر"}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
                  {fmtPrice(property.price)}
                </p>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                <div key={idx} className="rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border flex items-start gap-2" style={{ borderColor: "#f0ebe4", background: "white" }}>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COFFEE.cream }}>
                    <item.icon size={13} color={COFFEE.gold} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold" style={{ color: COFFEE.mid }}>{item.label}</p>
                    <p className="text-xs sm:text-sm font-bold truncate" style={{ color: COFFEE.dark }}>{item.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reservation Form */}
              <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "#f0ebe4", background: "white" }}>
                {reserveSuccess ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#DCFCE7" }}>
                      <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#16A34A" }} />
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg mb-2" style={{ color: COFFEE.dark }}>تم إرسال طلب الحجز</h3>
                    <p className="text-xs sm:text-sm" style={{ color: COFFEE.mid }}>سنتواصل معك في أقرب وقت</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-extrabold mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: COFFEE.dark }}>احجز الآن</h3>

                    {/* Reservation Type Toggle - only if property has detailed rooms */}
                    {isRent && property.has_detailed_rooms && (() => {
                      const rooms = Array.isArray(property.rooms) ? property.rooms : Array.isArray(property.detailed_rooms) ? property.detailed_rooms : [];
                      const availableRooms = rooms.filter((r) => r.status === "available");
                      return availableRooms.length > 0 ? (
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => { setReservationType("property"); setSelectedRoomId(null); setReserveSuccess(false); setAlreadyReserved(false); }}
                            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition"
                            style={{
                              borderColor: reservationType === "property" ? COFFEE.gold : "#f0ebe4",
                              background: reservationType === "property" ? COFFEE.gold : "white",
                              color: reservationType === "property" ? COFFEE.darkest : COFFEE.mid,
                            }}
                          >
                            حجز بالشقة
                          </button>
                          <button
                            onClick={() => { setReservationType("room"); setReserveSuccess(false); setAlreadyReserved(false); }}
                            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition"
                            style={{
                              borderColor: reservationType === "room" ? COFFEE.gold : "#f0ebe4",
                              background: reservationType === "room" ? COFFEE.gold : "white",
                              color: reservationType === "room" ? COFFEE.darkest : COFFEE.mid,
                            }}
                          >
                            حجز بالغرفة
                          </button>
                        </div>
                      ) : null;
                    })()}

                    {/* Show form for property reservation */}
                    {(!isRent || !property.has_detailed_rooms || reservationType === "property" || selectedRoomId) && (
                      <div className="space-y-2.5 sm:space-y-3">
                        <input
                          type="text"
                          placeholder="الاسم الكامل"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2"
                          style={{ borderColor: "#f0ebe4" }}
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
                            className={`w-full border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 ${phoneError ? "border-red-400" : alreadyReserved ? "border-amber-400" : ""}`}
                            style={!phoneError && !alreadyReserved ? { borderColor: "#f0ebe4" } : {}}
                          />
                          {phoneError && <p className="text-red-500 text-[10px] sm:text-xs mt-1 font-semibold">{phoneError}</p>}
                          {alreadyReserved && !phoneError && (
                            <p className="text-amber-600 text-[10px] sm:text-xs mt-1 font-semibold">لقد قمت بحجز هذا العقار بالفعل</p>
                          )}
                          {checking && !phoneError && (
                            <p className="text-stone-400 text-[10px] sm:text-xs mt-1">جاري التحقق...</p>
                          )}
                        </div>

                        <textarea
                          placeholder="ملاحظات (اختياري)"
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={2}
                          className="w-full border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 resize-none"
                          style={{ borderColor: "#f0ebe4" }}
                        />

                        <button
                          onClick={handleReserve}
                          disabled={submitting || alreadyReserved}
                          className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm transition hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                          style={{
                            backgroundColor: alreadyReserved ? "#16A34A" : COFFEE.gold,
                            color: alreadyReserved ? "#fff" : COFFEE.darkest,
                          }}
                        >
                          {alreadyReserved ? "تم الحجز بالفعل" : submitting ? "جاري الإرسال..." : "إرسال طلب الحجز"}
                        </button>
                      </div>
                    )}

                    {/* Room selection prompt for حجز بالغرفة */}
                    {isRent && property.has_detailed_rooms && reservationType === "room" && !selectedRoomId && (
                      <p className="text-center text-xs sm:text-sm mt-3" style={{ color: COFFEE.stone }}>
                        اختر غرفة من القائمة أعلاه ثم أكمل بيانات الحجز
                      </p>
                    )}
                  </>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Related Properties */}
      <RelatedPropertiesSection
        propertyId={property.id}
        favorites={null}
        onToggleFav={null}
      />
    </div>
  );
}

export default PublicPropertyDetail;
