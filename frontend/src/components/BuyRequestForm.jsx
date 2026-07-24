  import React, { useState } from "react";
  import {
    MapPin,
    Building2,
    Ruler,
    BedDouble,
    Wallet,
    MessageSquare,
    User,
    Phone,
    Send,
    ArrowRight,
  } from "lucide-react";
  import { COFFEE } from "../constants/constants";
import { successToast, errorToast } from "../utils/toast";
import { useNavigate } from "react-router-dom";

import { createNeedRequest } from "../services/needRequestService";
  import { formatPhone, getPhoneError } from "../utils/phoneValidator";
  import { numbersOnly } from "../utils/numbersOnly";
  import usePageTitle from "../hooks/usePageTitle";

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

  function BuyRequestForm() {
    usePageTitle("طلب شراء — سكني");
    const navigate = useNavigate();
    const [form, setForm] = useState({
      location: "",
      propertyType: "",
      area: "",
      rooms: "",
      budget: "",
      notes: "",
      name: "",
      phone: "",
    });
    const [sent, setSent] = useState(false);
    const [phoneError, setPhoneError] = useState("");
  
    const change = (e) => {
      const { name, value } = e.target;
      if (name === "phone") {
        const val = formatPhone(value);
        setForm({ ...form, phone: val });
        if (phoneError) setPhoneError(getPhoneError(val) || "");
      } else {
        setForm({ ...form, [name]: value });
      }
    };
     

const submit = async () => {
  const phoneErr = getPhoneError(form.phone);
  if (phoneErr) { setPhoneError(phoneErr); return; }
  setPhoneError("");
  try {

    await createNeedRequest({
      name: form.name,
      phone: form.phone,

      listing_type: "buy",

      property_type: form.propertyType,

      location: form.location,

      budget: form.budget,

      area: form.area || null,

      rooms: form.rooms || null,

      notes: form.notes,
    });

   successToast("تم إرسال الطلب — سيتم التواصل معك في أقرب وقت.");
   setSent(true);
  } catch (error) {
    console.error(error);
    errorToast("تعذر إرسال الطلب، حاول مرة أخرى.");
  }
};

    return (
      <div
        className="min-h-[85vh] flex items-center justify-center py-20 px-4 sm:px-6"
        style={{ backgroundColor: COFFEE.creamSoft }}
        dir="rtl"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ backgroundColor: COFFEE.gold }} />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ backgroundColor: COFFEE.gold }} />

        <div
          className="relative w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: COFFEE.creamSoft }}
        >
          {/* الهيدر */}
          <div
            className="flex items-center justify-between px-8 sm:px-10 py-6 rounded-t-3xl"
            style={{ backgroundColor: COFFEE.darkest }}
          >
            <button
              onClick={() => navigate("/need")}
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 hover:bg-white/10 hover:rotate-90 transition-all duration-300"
              style={{ borderColor: COFFEE.gold }}
            >
              <ArrowRight className="w-5 h-5" style={{ color: COFFEE.gold }} />
            </button>
            <div className="text-center flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: COFFEE.cream }}>
                طلب شراء
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
    placeholder="مثال: الحي الأول"
  />
</Field>

       <Field icon={Building2} label="نوع العقار">
  <input
    name="propertyType"
    value={form.propertyType}
    onChange={change}
    className={inputBase}
    style={{ borderColor: "#EADFD0" }}
    onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
    onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
    placeholder="مثال: شقة، فيلا، محل..."
  />
</Field>

              <Field icon={Ruler} label="المساحة">
                <input
                  name="area"
                  value={form.area}
                  onChange={change}
                  inputMode="numeric"
                  onKeyDown={numbersOnly.onKeyDown}
                  onPaste={numbersOnly.onPaste}
                  className={inputBase}
                  style={{ borderColor: "#EADFD0" }}
                  onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                  onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
                  placeholder="مثال: 180"
                />
              </Field>

              <Field icon={BedDouble} label="عدد الغرف">
                <input
                  name="rooms"
                  value={form.rooms}
                  onChange={change}
                  inputMode="numeric"
                  onKeyDown={numbersOnly.onKeyDown}
                  onPaste={numbersOnly.onPaste}
                  className={inputBase}
                  style={{ borderColor: "#EADFD0" }}
                  onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                  onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
                  placeholder="مثال: 3"
                />
              </Field>
            </div>

            <Field icon={Wallet} label="الميزانية">
              <input
                name="budget"
                value={form.budget}
                onChange={change}
                inputMode="numeric"
                onKeyDown={numbersOnly.onKeyDown}
                onPaste={numbersOnly.onPaste}
                className={inputBase}
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
                placeholder="مثال: 1500000"
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
                  type="tel"
                  inputMode="numeric"
                  name="phone"
                  value={form.phone}
                  onChange={change}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className={`${inputBase} ${phoneError ? "border-red-400" : ""}`}
                  style={!phoneError ? { borderColor: "#EADFD0" } : {}}
                  onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                  onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
                />
                {phoneError && <p className="text-red-500 text-xs mt-1 font-semibold">{phoneError}</p>}
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
      </div>
    );
  }

  export default BuyRequestForm;
