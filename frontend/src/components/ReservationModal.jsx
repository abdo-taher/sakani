import React, { useState } from "react";
import { X, User, Phone, MapPin, CheckCircle2, Home, MessageSquare } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { SAMPLE_IMG, fmtPrice } from "../utils/helpers";
import { createReservation } from "../services/reservationService";

function ReservationModal({ open, property, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open || !property) return null;

  const image =
    property.images && property.images.length
      ? property.images[0].image_url
      : SAMPLE_IMG(property.id);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createReservation({
        property_id: property.id,
        name: form.name,
        phone: form.phone,
        message: form.message,
      });

      setSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setForm({ name: "", phone: "", message: "" });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          /* -------- حالة النجاح -------- */
          <div className="p-10 flex flex-col items-center text-center gap-4 overflow-y-auto">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#DCFCE7" }}
            >
              <CheckCircle2 className="w-9 h-9" style={{ color: "#16A34A" }} />
            </div>

            <h3 className="text-xl font-extrabold" style={{ color: COFFEE.dark }}>
              تم إرسال طلبك بنجاح
            </h3>

            <p className="text-stone-500 leading-6">
              هيتواصل معاك فريقنا في أقرب وقت لتأكيد حجز
              <span className="font-bold"> {property.title}</span>
            </p>

            <button
              onClick={handleClose}
              className="mt-2 w-full py-3.5 rounded-xl font-bold"
              style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}
            >
              تمام
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto">
            {/* -------- شريط صورة العقار -------- */}
            <div className="relative w-full shrink-0 max-h-56 flex items-center justify-center overflow-hidden" style={{ backgroundColor: COFFEE.darkest }}>
              <img
                src={image}
                alt={property.title}
                className="w-full h-full max-h-56 object-contain"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(20,12,8,0.85) 0%, rgba(20,12,8,0.15) 40%, rgba(20,12,8,0) 65%)",
                }}
              />

              <button
                onClick={handleClose}
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:rotate-90 transition-transform duration-300"
              >
                <X className="w-5 h-5" style={{ color: COFFEE.dark }} />
              </button>

              <div className="absolute bottom-3 right-5 left-5 text-white">
                <p className="font-extrabold text-lg leading-snug truncate">
                  {property.title}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-white/85 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{property.location?.name}</span>
                </div>
              </div>
            </div>

            {/* -------- ملخص السعر -------- */}
            <div
              className="flex items-center justify-between px-6 py-3 border-b"
              style={{ borderColor: "#EADFD0", backgroundColor: "#FAF6EF" }}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 shrink-0" style={{ color: COFFEE.gold }} />
                <span className="text-sm text-stone-500">
                  {property.category?.slug === "rent" ? "إيجار شهري" : "سعر العقار"}
                </span>
              </div>
              <span
                className="font-extrabold text-lg whitespace-nowrap"
                style={{ color: COFFEE.gold }}
              >
                {fmtPrice(property.price)} ج.م
              </span>
            </div>

            {/* -------- الفورم -------- */}
            <div className="p-6">
              <h2
                className="text-lg font-extrabold mb-1"
                style={{ color: COFFEE.dark }}
              >
                احجز العقار
              </h2>
              <p className="text-stone-400 text-sm mb-4">
                اكتب بياناتك وهنتواصل معاك في أسرع وقت
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 px-1">
                    الاسم بالكامل
                  </label>
                  <div className="relative">
                    <User
                      className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-stone-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      name="name"
                      placeholder="مثال: أحمد محمد"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full border rounded-xl py-3 pr-12 pl-4 text-[15px] outline-none transition focus:ring-2"
                      style={{ borderColor: "#E5DED2" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 px-1">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 text-stone-400 pointer-events-none"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="01xxxxxxxxx"
                      value={form.phone}
                      onChange={handleChange}
                      dir="ltr"
                      className="w-full border rounded-xl py-3 pr-12 pl-4 text-[15px] text-right outline-none transition focus:ring-2"
                      style={{ borderColor: "#E5DED2" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 px-1">
                    ملاحظات أو استفسار <span className="font-normal text-stone-400">(اختياري)</span>
                  </label>
                  <div className="relative">
                    <MessageSquare
                      className="absolute top-4 right-4 w-5 h-5 text-stone-400 pointer-events-none"
                    />
                    <textarea
                      name="message"
                      placeholder="اكتب أي تفاصيل حابب تقولها لينا..."
                      value={form.message}
                      onChange={handleChange}
                      rows={2}
                      className="w-full border rounded-xl py-3 pr-12 pl-4 text-[15px] outline-none transition focus:ring-2 resize-none"
                      style={{ borderColor: "#E5DED2" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-base transition hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100 mt-2"
                  style={{
                    backgroundColor: COFFEE.gold,
                    color: COFFEE.darkest,
                  }}
                >
                  {loading ? "جاري الإرسال..." : "إرسال طلب الحجز"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationModal;