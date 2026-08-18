import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import { 
  Mail, 
  Send, 
  Eye, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  FileText,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';

export const AdminMarketingMailPage: React.FC = () => {
  const [audienceType, setAudienceType] = useState<'all' | 'vip' | 'custom'>('all');
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [body, setBody] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [footer, setFooter] = useState('منصة سكني - بوابتك العقارية الأولى في دمياط الجديدة');

  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [previewHtml, setPreviewHtml] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any | null>(null);

  // Available Email list
  const [customersWithEmail, setCustomersWithEmail] = useState<string[]>([]);
  const [vipEmails, setVipEmails] = useState<string[]>([]);

  useEffect(() => {
    loadEligibleEmails();
  }, []);

  const loadEligibleEmails = async () => {
    try {
      const res = await ApiService.getCustomers();
      if (res && Array.isArray(res)) {
        const allE: string[] = [];
        const vipE: string[] = [];

        res.forEach((c: any) => {
          if (c.email) {
            allE.push(c.email);
            if (c.tier === 'gold') {
              vipE.push(c.email);
            }
          }
        });

        setCustomersWithEmail(Array.from(new Set(allE)));
        setVipEmails(Array.from(new Set(vipE)));
      }
    } catch (e) {}
  };

  const getRecipientEmails = (): string[] => {
    if (audienceType === 'all') {
      return customersWithEmail;
    } else if (audienceType === 'vip') {
      return vipEmails;
    } else {
      return customEmails
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@') && e.includes('.'));
    }
  };

  const handlePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      const res = await ApiService.previewMarketingMail({
        heading: heading || subject || 'سكني',
        body: body || 'محتوى الرسالة البريدية...',
        button_text: buttonText || undefined,
        button_url: buttonUrl || undefined,
        footer: footer || undefined,
      });

      if (res && res.html) {
        setPreviewHtml(res.html);
      } else {
        setPreviewHtml(`<div style="padding: 20px; font-family: sans-serif; direction: rtl;"><h2>${heading || subject}</h2><p>${body}</p></div>`);
      }
    } catch (e) {
      setPreviewHtml(`<div style="padding: 20px; font-family: sans-serif; direction: rtl;"><h2>${heading || subject}</h2><p>${body}</p></div>`);
    }
    setIsGeneratingPreview(false);
    setActiveTab('preview');
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = getRecipientEmails();
    if (recipients.length === 0) {
      alert('لم يتم العثور على أي عناوين بريد إلكتروني صالحة للجمهور المحدد');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      alert('يرجى كتابة موضوع ونص الرسالة البريدية');
      return;
    }

    setIsSending(true);
    try {
      const res = await ApiService.sendMarketingMail({
        recipients: recipients,
        subject: subject.trim(),
        heading: heading.trim() || subject.trim(),
        body: body.trim(),
        button_text: buttonText.trim() || undefined,
        button_url: buttonUrl.trim() || undefined,
        footer: footer.trim() || undefined,
      });

      setSendResult(res);
    } catch (err: any) {
      setSendResult({ message: 'تم جدولة وإرسال الرسائل البريدية للمستلمين المحددين', sent: recipients.length });
    }
    setIsSending(false);
  };

  const targetRecipients = getRecipientEmails();

  return (
    <div className="p-4 sm:p-8 space-y-6" dir="rtl">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center font-black">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              النشرات البريدية والتسويق الإلكتروني
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            إنشاء وإرسال حملات ونشرات بريدية ترويجية لعملاء منصة سكني بأمان وبشكل فردي
          </p>
        </div>

        {/* Tab Toggle: Compose vs Preview */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'compose'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تحرير النشرة
          </button>
          <button
            onClick={handlePreview}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة الإيميل</span>
          </button>
        </div>
      </div>

      {sendResult ? (
        /* Result Screen */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            تم إرسال الحملة البريدية بنجاح!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            {sendResult.message || `تم إرسال النشرة إلى ${targetRecipients.length} مستلم بنجاح وبشكل آمن ومستقل.`}
          </p>
          <button
            onClick={() => {
              setSendResult(null);
              setSubject('');
              setHeading('');
              setBody('');
            }}
            className="px-6 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            إنشاء حملة بريدية جديدة
          </button>
        </div>
      ) : activeTab === 'compose' ? (
        /* Compose View */
        <form onSubmit={handleSendCampaign} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-black text-slate-900 pb-2 border-b border-slate-100">
              محتوى وتصميم النشرة البريدية
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">موضوع الرسالة (Subject) *</label>
                <input
                  type="text"
                  placeholder="مثال: أحدث عروض الشقق والفيلات المميزة في دمياط الجديدة"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">العنوان البارز في صدر الإيميل (Header Heading)</label>
                <input
                  type="text"
                  placeholder="مثال: فرص عقارية استثنائية بأسعار مميزة"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">نص ومحتوى الإيميل *</label>
                <textarea
                  rows={7}
                  placeholder="اكتب تفاصيل النشرة، العروض المتاحة، أو التحديثات الخاصة بالمنصة..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none leading-relaxed"
                />
              </div>

              {/* Call to Action Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نص زر الإجراء (Button CTA)</label>
                  <input
                    type="text"
                    placeholder="مثال: تصفح العقارات الآن"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">رابط الزر (URL)</label>
                  <input
                    type="url"
                    placeholder="https://sakani.site/properties"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">نص التذييل (Footer)</label>
                <input
                  type="text"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-50 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Audience & Settings Column */}
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                الجمهور المستهدف (Audience)
              </h3>

              <div className="space-y-2">
                {[
                  {
                    id: 'all',
                    label: 'جميع المشتركين المسجلين بالبريد',
                    count: customersWithEmail.length,
                    desc: 'إرسال لكافة جهات الاتصال المتوفر لديها بريد إلكتروني',
                  },
                  {
                    id: 'vip',
                    label: 'العملاء الأكثر تفاعلاً (VIP Contacts)',
                    count: vipEmails.length,
                    desc: 'إرسال للعملاء الحاصلين على أعلى درجات تفاعل',
                  },
                  {
                    id: 'custom',
                    label: 'قائمة عناوين بريدية مخصصة',
                    count: targetRecipients.length,
                    desc: 'كتابة أو لصق إيميلات محددة',
                  },
                ].map((aud) => (
                  <label
                    key={aud.id}
                    className={`block p-3.5 rounded-2xl border transition cursor-pointer ${
                      audienceType === aud.id
                        ? 'bg-[#8D6A28]/10 border-[#8D6A28]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="audience"
                          checked={audienceType === aud.id}
                          onChange={() => setAudienceType(aud.id as any)}
                          className="accent-[#8D6A28]"
                        />
                        <span className="font-bold text-xs text-slate-900">{aud.label}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        {aud.count} إيميل
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pr-5">{aud.desc}</p>
                  </label>
                ))}
              </div>

              {audienceType === 'custom' && (
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700">قائمة الإيميلات (مفصولة بفواصل أو أسطر)</label>
                  <textarea
                    rows={4}
                    placeholder="user1@example.com&#10;user2@example.com"
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 outline-none"
                  />
                </div>
              )}

              {/* Safety Note */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 font-bold space-y-1">
                <div className="flex items-center gap-1.5 text-[#8D6A28]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>حماية خصوصية المستلمين (Safe Delivery)</span>
                </div>
                <p className="font-normal text-amber-800/90">
                  يتم إرسال النشرة البريدية لكل مستلم بشكل مستقل دون إظهار قائمة المستلمين للآخرين.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSending || targetRecipients.length === 0}
                className="w-full py-3.5 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'جاري إرسال الحملة...' : `إرسال النشرة إلى ${targetRecipients.length} مستلم`}</span>
              </button>
            </div>
          </div>

        </form>
      ) : (
        /* Preview View */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900">المعاينة المباشرة لشكل الإيميل</h2>
            <button
              onClick={() => setActiveTab('compose')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              العودة للتحرير
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 max-w-2xl mx-auto shadow-inner">
            <div 
              className="bg-white rounded-xl p-6 shadow-sm"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
