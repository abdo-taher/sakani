import React, { useState } from "react";
import usePageTitle from "../hooks/usePageTitle";

import {
  Phone,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";

import Reveal from "../components/Reveal";

import { COFFEE } from "../constants/constants";
import { sendContactMessage } from "../services/contactService";
import { formatPhone, getPhoneError } from "../utils/phoneValidator";


/* -------------------------------------------------------------------- */
/*  صفحة: تواصل معنا                                                     */
/* -------------------------------------------------------------------- */
function Contact() {
  usePageTitle("تواصل معنا — سكني");
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  return (
    <div
      className="min-h-[70vh] w-full overflow-x-hidden py-16 px-4 sm:px-6 flex justify-center"
      style={{ backgroundColor: COFFEE.creamSoft }}
      dir="rtl"
    >
      <div className="w-full max-w-3xl mx-auto">
        <h1
          className="animate-heroFade text-2xl sm:text-4xl font-extrabold mb-3 text-center"
          style={{ color: COFFEE.dark }}
        >
          تواصل معنا
        </h1>
        <p className="animate-heroFade-1 text-stone-500 text-center mb-10">
          هنرد عليك في أقرب وقت، إحنا هنا عشان نساعدك
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Reveal
            delay={0}
            className="bg-white rounded-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center min-h-[120px]"
          >
            <Phone className="w-6 h-6 mb-3 animate-float" style={{ color: COFFEE.gold }} />
            <p className="font-bold text-sm break-words" style={{ color: COFFEE.dark }}>
              01067725976
            </p>
          </Reveal>
          <Reveal
            delay={120}
            className="bg-white rounded-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center min-h-[120px]"
          >
            <MapPin className="w-6 h-6 mb-3 animate-float-delay" style={{ color: COFFEE.gold }} />
            <p className="font-bold text-sm break-words" style={{ color: COFFEE.dark }}>
              دمياط الجديدة، مصر
            </p>
          </Reveal>
          <Reveal
            delay={240}
            className="bg-white rounded-2xl p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center min-h-[120px]"
          >
            <ImageIcon className="w-6 h-6 mb-3 animate-float-slow" style={{ color: COFFEE.gold }} />
            <p className="font-bold text-sm break-words" style={{ color: COFFEE.dark }}>
              info@sakani.site
            </p>
          </Reveal>
        </div>

        {sent ? (
          <div className="animate-fadePop bg-white rounded-2xl p-10 text-center shadow-sm">
            <svg viewBox="0 0 52 52" className="w-16 h-16 mx-auto mb-3">
              <circle cx="26" cy="26" r="25" fill="none" stroke={COFFEE.gold} strokeWidth="2" />
              <path
                fill="none"
                stroke={COFFEE.gold}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27l8 8 16-16"
                className="animate-drawCheck"
              />
            </svg>
            <p className="font-bold text-lg" style={{ color: COFFEE.dark }}>
              تم إرسال رسالتك بنجاح
            </p>
            <p className="text-stone-500 text-sm mt-2">هيتواصل معاك فريقنا في أقرب وقت</p>
          </div>
        ) : (
          <Reveal
            as="div"
            className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <div className="sm:col-span-1">
              <label className="block text-base font-bold mb-2.5" style={{ color: COFFEE.dark }}>
                الاسم بالكامل
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسمك بالكامل"
                className="w-full box-border rounded-xl border-2 px-5 py-4 text-base focus:ring-2 outline-none transition-all"
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-base font-bold mb-2.5" style={{ color: COFFEE.dark }}>
                رقم الهاتف
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  const val = formatPhone(e.target.value);
                  setPhone(val);
                  if (phoneError) setPhoneError(getPhoneError(val) || "");
                }}
                placeholder="01xxxxxxxxx"
                dir="ltr"
                className={`w-full box-border rounded-xl border-2 px-5 py-4 text-base focus:ring-2 outline-none transition-all ${phoneError ? "border-red-400" : ""}`}
                style={!phoneError ? { borderColor: "#EADFD0" } : {}}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
              />
              {phoneError && <p className="text-red-500 text-xs mt-1 font-semibold">{phoneError}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-base font-bold mb-2.5" style={{ color: COFFEE.dark }}>
                رسالتك
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا"
                rows={6}
                className="w-full box-border rounded-xl border-2 px-5 py-4 text-base focus:ring-2 outline-none transition-all resize-none"
                style={{ borderColor: "#EADFD0" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#EADFD0")}
              />
            </div>

            {formError && (
              <p className="text-red-500 text-sm sm:col-span-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 font-semibold">
                {formError}
              </p>
            )}

            <button
              type="button"
              onClick={async () => {

  if (!name.trim() || !phone.trim() || !message.trim()) {
    setFormError("من فضلك املأ كل الحقول");
    return;
  }

  try {

    setFormError("");

    await sendContactMessage({
      name,
      phone,
      message,
      email: "",
      subject: "",
    });

    setSent(true);

    setName("");
    setPhone("");
    setMessage("");

  } catch (error) {

    console.log(error);

    setFormError("حدث خطأ أثناء إرسال الرسالة");

  }

}}
              className="btn-shimmer sm:col-span-2 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}
            >
              إرسال الرسالة
            </button>
          </Reveal>
        )}
      </div>
    </div>
  );
}



export default Contact;