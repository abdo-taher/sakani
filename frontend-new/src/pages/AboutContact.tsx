import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Award, 
  Send, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export const AboutContactPage: React.FC = () => {
  const [settings] = useState(() => StorageService.getSettings());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، الرسالة)');
      return;
    }

    setIsSubmitting(true);

    // 1. Try Backend API
    try {
      await ApiService.createContactMessage({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        subject: subject.trim() || 'استفسار عام من الموقع',
        message: message.trim(),
      });
    } catch (e) {}

    // 2. Local Storage persistence
    StorageService.addContactMessage({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      subject: subject.trim() || 'استفسار عام من الموقع',
      message: message.trim(),
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    setIsSubmitting(false);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setName('');
      setPhone('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 3500);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16" dir="rtl">
      
      {/* 1. Header Hero */}
      <section className="bg-[#0F172A] text-white py-14 sm:py-18 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden rounded-b-3xl sm:rounded-b-[2.5rem]">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-bold text-[#D6A94E]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>من نحن</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            سكني، شريكك الموثوق في دمياط الجديدة
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            منصة عقارية متكاملة تربط بين البائعين والمشترين والمستأجرين في دمياط الجديدة بأعلى معايير الشفافية والأمان وسرعة الإنجاز.
          </p>
        </div>
      </section>

      {/* 2. Three Pillars / Value Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">ثقة مطلقة</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              عقارات موثقة ومفحوصة قانونياً لضمان سلامة التعاملات وتوفير أعلى درجات الأمان المالي.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">خبراء محليون</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              معرفة عميقة بدمياط الجديدة وأحيائها ومرافقها وأحدث توجهات الأسعار لمساعدتك في اتخاذ القرار الأمثل.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">خدمة متكاملة</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {settings.commission_text || 'من البحث والمعاينة وتنسيق المقابلات وحتى إتمام العقد واستلام المفاتيح بعمولة مخفضة 35% فقط.'}
            </p>
          </div>

        </div>
      </section>

      {/* 3. Contact Methods & Form Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left / Contact Info (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">تواصل معنا مباشرة</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                فريقنا متاح للرد على كافة استفساراتكم على مدار الأسبوع
              </p>
            </div>

            {/* Phone Card */}
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#8D6A28] hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">اتصال هاتفي</span>
                <span className="text-base font-black text-slate-900" dir="ltr">{settings.phone}</span>
              </div>
            </a>

            {/* WhatsApp Card */}
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">محادثة واتساب سريعة</span>
                <span className="text-base font-black text-slate-900" dir="ltr">{settings.whatsapp}</span>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#8D6A28] hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">البريد الإلكتروني</span>
                <span className="text-base font-black text-slate-900">{settings.email}</span>
              </div>
            </a>

            {/* Location Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-[#8D6A28]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">العنوان والمقر</span>
                <span className="text-sm font-bold text-slate-900">{settings.address}</span>
              </div>
            </div>

            {/* Work hours */}
            {settings.working_hours && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <Clock className="w-5 h-5 text-[#8D6A28] shrink-0" />
                <span>مواعيد العمل: {settings.working_hours}</span>
              </div>
            )}
          </div>

          {/* Right / Contact Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2">أرسل لنا رسالة</h3>
            <p className="text-xs text-slate-500 mb-6">
              سواء كان لديك استفسار عن عقار، أو رغبة في عرض عقاراتك، لا تتردد في مراسلتنا.
            </p>

            {isSuccess ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-black text-slate-900">تم إرسال رسالتك بنجاح!</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  شكراً لتواصلك مع سكني. سيقوم أحد مسؤولي خدمة العملاء بالرد عليك هاتفياً أو عبر البريد في أقرب وقت.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم بالكامل *</label>
                    <input
                      type="text"
                      required
                      placeholder="اسمك الكريم"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف للتواصل *</label>
                    <input
                      type="tel"
                      dir="ltr"
                      required
                      placeholder="010XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">موضوع الرسالة</label>
                    <input
                      type="text"
                      placeholder="استفسار عن عقار، طلب تسويق..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نص الرسالة أو الاستفسار *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="اكتب تفاصيل استفسارك هنا..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl gold-gradient gold-gradient-hover text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
