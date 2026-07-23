import React, { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";
import {
  Send,
  Plus,
  X,
  Eye,
  Mail,
  Type,
  FileText,
  Link,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { COFFEE } from "../../constants/constants";
import { sendMarketingMail } from "../../services/marketingMailService";
import { successToast, errorToast } from "../../utils/toast";

function MarketingMail() {
  usePageTitle("البريد التسويقي — سكني");
  const [recipients, setRecipients] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [footer, setFooter] = useState("");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState(null);

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorToast("البريد الإلكتروني غير صحيح");
      return;
    }
    if (recipients.includes(email)) {
      errorToast("البريد الإلكتروني مضاف بالفعل");
      return;
    }
    setRecipients([...recipients, email]);
    setEmailInput("");
  };

  const removeEmail = (email) => {
    setRecipients(recipients.filter((e) => e !== email));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      errorToast("أضف بريداً إلكترونياً واحداً على الأقل");
      return;
    }
    if (!subject.trim()) {
      errorToast("أدخل عنوان الرسالة");
      return;
    }
    if (!body.trim()) {
      errorToast("أدخل نص الرسالة");
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const data = await sendMarketingMail({
        recipients,
        subject: subject.trim(),
        heading: heading.trim() || subject.trim(),
        body: body.trim(),
        button_text: buttonText.trim() || null,
        button_url: buttonUrl.trim() || null,
        footer: footer.trim() || null,
      });
      setResult(data);
      successToast(data.message);
    } catch (error) {
      errorToast(error.response?.data?.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    backgroundColor: "#F8F6F2",
    borderColor: "#E4D9C9",
    color: COFFEE.dark,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
            البريد التسويقي
          </h1>
          <p className="text-stone-500 mt-2">
            إرسال رسائل تسويقية مخصصة للعملاء
          </p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition hover:scale-105"
          style={{ borderColor: COFFEE.gold, color: COFFEE.gold }}
        >
          <Eye size={18} />
          {showPreview ? "إخفاء المعاينة" : "معاينة"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className={`${showPreview ? "lg:col-span-3" : "lg:col-span-5"} space-y-5`}>
          {/* Recipients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: COFFEE.dark }}>
              <Mail size={16} color={COFFEE.gold} />
              المستلمون
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="أدخل البريد الإلكتروني واضغط Enter"
                className="flex-1 rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
              />
              <button
                onClick={addEmail}
                className="px-4 py-3 rounded-xl text-white font-bold transition hover:opacity-90"
                style={{ backgroundColor: COFFEE.gold }}
              >
                <Plus size={18} />
              </button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "#F3EDE4", color: COFFEE.dark }}
                  >
                    {email}
                    <button onClick={() => removeEmail(email)} className="hover:text-red-500 transition">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-stone-400 mt-2">{recipients.length} مستلم</p>
          </div>

          {/* Subject */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: COFFEE.dark }}>
              <Type size={16} color={COFFEE.gold} />
              عنوان الرسالة
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: عروض خاصة على شقق دمياط الجديدة!"
              className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
              onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
            />
          </div>

          {/* Heading */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: COFFEE.dark }}>
              <Type size={16} color={COFFEE.gold} />
              عنوان المحتوى <span className="text-stone-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="يُستخدم كعنوان داخل البريد — إذا فارغ يُستخدم عنوان الرسالة"
              className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
              onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
            />
          </div>

          {/* Body */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: COFFEE.dark }}>
              <FileText size={16} color={COFFEE.gold} />
              نص الرسالة
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="اكتب محتوى الرسالة هنا... يمكنك استخدام سطور جديدة"
              className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all resize-none leading-relaxed"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
              onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
            />
          </div>

          {/* Button */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: COFFEE.dark }}>
              <Link size={16} color={COFFEE.gold} />
              زر الدعوة للعمل <span className="text-stone-400 font-normal">(اختياري)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="نص الزر: اكتشف الآن"
                className="rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
              />
              <input
                type="url"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="رابط الزر: https://sakani.site"
                className="rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: COFFEE.dark }}>
              <FileText size={16} color={COFFEE.gold} />
              تذييل الرسالة <span className="text-stone-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="مثال: للاستفسار اتصل بنا على 01067725976"
              className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
              onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
            />
          </div>

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-green-800">{result.message}</p>
                {result.failed?.length > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    فشل الإرسال إلى: {result.failed.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}
          >
            {sending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send size={20} />
                إرسال البريد ({recipients.length} مستلم)
              </>
            )}
          </button>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-stone-100">
                <p className="text-sm font-bold" style={{ color: COFFEE.dark }}>
                  معاينة البريد
                </p>
              </div>
              <div className="p-4">
                <div className="bg-stone-50 rounded-xl overflow-hidden border border-stone-200">
                  {/* Preview Header */}
                  <div className="text-center py-5 px-4" style={{ backgroundColor: COFFEE.darkest }}>
                    <p className="text-lg font-extrabold" style={{ color: COFFEE.gold }}>سكني</p>
                    <p className="text-xs" style={{ color: "#F7F1E8CC" }}>شريكك العقاري في دمياط الجديدة</p>
                  </div>

                  {/* Preview Content */}
                  <div className="p-5 text-center">
                    <h3 className="font-bold text-base mb-3" style={{ color: COFFEE.dark }}>
                      {heading || subject || "عنوان الرسالة"}
                    </h3>
                    <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: COFFEE.dark }}>
                      {body || "نص الرسالة سيظهر هنا..."}
                    </div>
                    {buttonText && (
                      <div className="mt-4">
                        <span className="inline-block px-6 py-2.5 rounded-full text-white text-sm font-bold" style={{ backgroundColor: COFFEE.gold }}>
                          {buttonText}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Preview Footer */}
                  <div className="text-center py-4 px-4 border-t border-stone-200">
                    <p className="text-xs font-semibold" style={{ color: COFFEE.gold }}>سكني — عقاراتك في دمياط الجديدة</p>
                    {footer && <p className="text-xs mt-1" style={{ color: "#8C7A6B" }}>{footer}</p>}
                    <p className="text-xs mt-2" style={{ color: "#B8AFA3" }}>تم إرسال هذه الرسالة من منصة سكني</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketingMail;
