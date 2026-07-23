import React, { useState } from "react";
import {
  X,
  MapPin,
  Home,
  BedDouble,
  CalendarClock,
  Wallet,
  MessageSquare,
  User,
  Phone,
  Send,
} from "lucide-react";
import { COFFEE } from "../constants/constants";
import Swal from "sweetalert2";
import { createNeedRequest } from "../services/needRequestService";
/* الفيلد بقى مكوّن ثابت برّه RentRequestForm عشان مايتعملوش remount */
function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="font-bold text-base flex items-center gap-2" style={{ color: COFFEE.dark }}>
        <Icon className="w-5 h-5" style={{ color: COFFEE.gold }} />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  "w-full border-2 rounded-xl p-3.5 mt-2 text-base transition-all duration-300 outline-none bg-white";

function RentRequestForm({ onClose }) {
  const [form, setForm] = useState({
    location: "",
    furnished: "",
    rooms: "",
    duration: "",
    budget: "",
    notes: "",
    name: "",
    phone: "",
  });
  const [sent, setSent] = useState(false);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
  try {
    await createNeedRequest({
      name: form.name,
      phone: form.phone,

      listing_type: "rent",

      property_type: form.furnished,

      location: form.location,

      budget: form.budget,

      rooms: form.rooms || null,

      rent_duration: form.duration,

      notes: form.notes,
    });

    await Swal.fire({
      icon: "success",
      title: "تم إرسال الطلب",
      text: "سيتم التواصل معك في أقرب وقت.",
      confirmButtonColor: COFFEE.gold,
    });

    onClose();
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "حدث خطأ",
      text: "تعذر إرسال الطلب.",
      confirmButtonColor: COFFEE.gold,
    });
  }
};

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: "rgba(20,12,8,0.55)", backdropFilter: "blur(4px)" }}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl animate-popIn"
        style={{ backgroundColor: COFFEE.creamSoft }}
      >
        {/* الهيدر */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8 sm:px-10 py-6 rounded-t-3xl"
          style={{ backgroundColor: COFFEE.darkest }}
        >
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center border-2 hover:bg-white/10 hover:rotate-90 transition-all duration-300"
            style={{ borderColor: COFFEE.gold }}
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" style={{ color: COFFEE.gold }} />
          </button>
          <div className="text-center flex-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: COFFEE.cream }}>
              طلب إيجار
            </h2>
            <p className="text-sm mt-1.5" style={{ color: `${COFFEE.cream}99` }}>
              املأ البيانات وهنتواصل معاك في أقرب وقت
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* الحقول */}
        <div className="px-8 sm:px-10 py-8 space-y-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field icon={MapPin} label="المنطقة">
              <input
                name="location"
                value={form.location}
                onChange={change}
                className={inputBase}
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
                placeholder="مثال: الحي الأول"
              />
            </Field>

            <Field icon={Home} label="نوع التشطيب">
              <select
                name="furnished"
                value={form.furnished}
                onChange={change}
                className={inputBase}
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
              >
                <option value="">اختر</option>
                <option>مفروش</option>
                <option>على البلاط</option>
              </select>
            </Field>

            <Field icon={BedDouble} label="عدد الغرف">
  <input
    type="text"
    inputMode="numeric"
    name="rooms"
    value={form.rooms}
    onChange={change}
    className={inputBase}
    style={{ borderColor: "#EADFD0" }}
    placeholder="مثال: 3"
  />
</Field>

            <Field icon={CalendarClock} label="مدة الإيجار">
              <input
                name="duration"
                value={form.duration}
                onChange={change}
                className={inputBase}
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
                placeholder="مثال: سنة"
              />
            </Field>
          </div>

          <Field icon={Wallet} label="الميزانية">
            <input
              name="budget"
              value={form.budget}
              onChange={change}
              className={inputBase}
              style={{ borderColor: "#EADFD0" }}
              onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
              onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
              placeholder="مثال: 7000"
            />
          </Field>

          <Field icon={MessageSquare} label="ملاحظات">
            <textarea
              rows="4"
              name="notes"
              value={form.notes}
              onChange={change}
              className={`${inputBase} resize-none`}
              style={{ borderColor: "#EADFD0" }}
              onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
              onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
            />
          </Field>

          <div className="h-px w-full" style={{ backgroundColor: "#EADFD0" }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field icon={User} label="الاسم">
              <input
                name="name"
                value={form.name}
                onChange={change}
                className={inputBase}
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
              />
            </Field>

            <Field icon={Phone} label="رقم الهاتف">
              <input
                name="phone"
                value={form.phone}
                onChange={change}
                className={inputBase}
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
              />
            </Field>
          </div>

          <button
            onClick={submit}
            className="w-full rounded-xl py-5 font-bold text-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-lg"
            style={{
              backgroundColor: sent ? "#3B8A5A" : COFFEE.gold,
              color: COFFEE.darkest,
            }}
          >
            {sent ? (
              "تم إرسال الطلب بنجاح ✓"
            ) : (
              <>
                <Send className="w-5 h-5" />
                إرسال الطلب
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-popIn { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1); }
      `}</style>
    </div>
  );
}

export default RentRequestForm;