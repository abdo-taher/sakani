import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { ContactMessage } from '../types';
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
  Sparkles,
  Reply,
  Bell,
  Calendar,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

export const AboutContactPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightedMsgId = searchParams.get('msg_id');
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const [clientMessages, setClientMessages] = useState<ContactMessage[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    loadClientMessages();
    const handleUpdate = () => loadClientMessages();
    const handleSettingsUpdate = (e: any) => {
      if (e?.detail) setSettings(e.detail);
      else setSettings(StorageService.getSettings());
    };
    window.addEventListener('sakani_contact_messages_updated', handleUpdate);
    window.addEventListener('sakani_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('sakani_contact_messages_updated', handleUpdate);
      window.removeEventListener('sakani_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const loadClientMessages = () => {
    const all = StorageService.getContactMessages();
    // Show messages that have replies or all client messages
    setClientMessages(all.filter(m => Boolean(m.reply || (m.replies && m.replies.length > 0))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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
              {settings.commission_text || `من البحث والمعاينة وتنسيق المقابلات وحتى إتمام العقد واستلام المفاتيح بعمولة مخفضة ${settings.commission_percentage !== undefined ? settings.commission_percentage : 2.5}% فقط.`}
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

      {/* 4. Client Responses / Recent Replies Section */}
      {clientMessages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center font-bold">
                  <Reply className="w-5 h-5 rotate-180" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">سجل ردود إدارة سكني على استفساراتك</h2>
                  <p className="text-xs text-slate-500 font-medium">الردود الرسمية الواردة من إدارة المنصة على رسائلك السابقة</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold self-start sm:self-auto">
                {clientMessages.length} رد متوفر
              </span>
            </div>

            <div className="space-y-4">
              {clientMessages.map((msg) => {
                const isHighlighted = highlightedMsgId === msg.id;
                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`p-5 rounded-2xl border transition-all ${
                      isHighlighted
                        ? 'bg-amber-50/40 border-[#8D6A28] shadow-md ring-2 ring-[#8D6A28]/20'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">{msg.name}</span>
                        {msg.subject && (
                          <span className="text-xs text-slate-500 mr-2">({msg.subject})</span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(msg.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed py-2.5 italic">
                      "{msg.message}"
                    </p>

                    {/* Official Admin Reply Card */}
                    <div className="bg-gradient-to-r from-amber-50 to-emerald-50/30 p-4 rounded-xl border border-amber-200/80 space-y-2 mt-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#8D6A28]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>رد إدارة منصة سكني:</span>
                        </div>
                        {msg.replied_at && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(msg.replied_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-900 font-medium whitespace-pre-wrap leading-relaxed bg-white/90 p-3 rounded-lg border border-amber-200/40 shadow-2xs">
                        {msg.reply || msg.replies?.[msg.replies.length - 1]?.reply_text}
                      </p>

                      <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500">هل تحتاج لمزيد من التفاصيل أو التواصل؟</span>
                        <a
                          href={`https://wa.me/${(settings.phone || '01067725976').replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً إدارة سكني، بخصوص ردكم على استفساري رقم (${msg.id}).`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>متابعة عبر واتساب</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
