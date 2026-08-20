import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { DISTRICTS_LIST } from '../data/mockData';
import { SEOHead } from '../components/SEOHead';
import confetti from 'canvas-confetti';
import { 
  HelpCircle, 
  Building2, 
  MapPin, 
  Wallet, 
  Maximize2, 
  BedDouble, 
  Phone, 
  User, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const NeedPropertyPage: React.FC = () => {
  const navigate = useNavigate();

  const [listingType, setListingType] = useState<'rent' | 'buy'>('rent');
  const [propertyType, setPropertyType] = useState('شقة سكنية');
  const [location, setLocation] = useState('الحي الخامس أو المتميز');
  const [budget, setBudget] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('3');
  const [rentDuration, setRentDuration] = useState('سنة');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(() => StorageService.getClientPhone() || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [settings, setSettings] = useState(() => StorageService.getSettings());

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      if (e?.detail) setSettings(e.detail);
      else setSettings(StorageService.getSettings());
    };
    window.addEventListener('sakani_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('sakani_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim() || !phone.trim()) {
      alert('يرجى كتابة الاسم ورقم الهاتف للتواصل معك');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      listing_type: listingType,
      property_type: propertyType,
      location: location.trim() || 'دمياط الجديدة',
      budget: Number(budget) || 0,
      area: Number(area) || undefined,
      rooms: Number(rooms) || undefined,
      rent_duration: listingType === 'rent' ? rentDuration : undefined,
      notes: notes.trim() || undefined,
    };

    // 1. Submit to Backend API
    try {
      await ApiService.createNeedRequest(payload);
    } catch (err) {
      console.warn('Backend need-request submission error:', err);
    }

    // 2. Storage persistence
    StorageService.addNeedRequest({
      client_name: payload.name,
      client_phone: payload.phone,
      listing_type: payload.listing_type,
      property_type: payload.property_type,
      location: payload.location,
      budget: payload.budget,
      area: payload.area,
      rooms: payload.rooms,
      notes: payload.notes,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6 sm:pt-10" dir="rtl">
      <SEOHead
        title="اطلب عقارك بمواصفات خاصة | سكني"
        description="سجل مواصفات وميزانية العقار المطلوب وسيقوم فريق المستشارين العقاريين في سكني بالبحث عن أفضل الخيارات ومطابقتها وتوفيرها لك فوراً."
        canonical="https://sakani.site/need-property"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition cursor-pointer">الرئيسية</button>
          <span>/</span>
          <span className="text-[#8D6A28]">طلب عقار بمواصفات خاصة</span>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-5 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-black text-slate-900">
                تم استلام طلبك بنجاح!
              </h2>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                شكراً لثقتكم في سكني. سيقوم مستشارنا العقاري بالبحث عن أفضل الخيارات المطابقة لمواصفاتك والتواصل معك هاتفياً أو عبر واتساب بأقرب وقت.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 font-bold max-w-md mx-auto">
              {settings.commission_text || `عمولة سكني مخفضة ${settings.commission_percentage !== undefined ? settings.commission_percentage : 2.5}% فقط • بدون أي رسوم معاينة مسبقة`}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/properties')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer"
              >
                تصفح العقارات المتاحة الآن
              </button>

              <button
                onClick={() => {
                  setIsSuccess(false);
                  setName('');
                  setNotes('');
                  setBudget('');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                إرسال طلب آخر
              </button>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            {/* Header Hero Banner */}
            <div className="p-6 sm:p-8 bg-[#0F172A] text-white space-y-3 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8D6A28]/20 border border-[#D6A94E]/40 text-[#D6A94E] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>خدمة البحث المخصص في دمياط الجديدة</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  محتاج عقار بمواصفات خاصة؟
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                  مش لاقي العقار المناسب؟ سجل المواصفات اللي محتاجها وسيقوم فريق خبراء سكني بالبحث عن أفضل الخيارات والتواصل معك مباشرة.
                </p>
              </div>

              {/* Background ambient light */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#8D6A28]/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            </div>

            {/* Request Form Body */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* Section 1: Listing Goal (Buy vs Rent) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700">الغرض من الطلب</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setListingType('rent')}
                    className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black border transition cursor-pointer flex items-center justify-center gap-2 ${
                      listingType === 'rent'
                        ? 'bg-[#8D6A28]/10 border-[#8D6A28] text-[#8D6A28] shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>إيجار (سكني / تجاري)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setListingType('buy')}
                    className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black border transition cursor-pointer flex items-center justify-center gap-2 ${
                      listingType === 'buy'
                        ? 'bg-[#8D6A28]/10 border-[#8D6A28] text-[#8D6A28] shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>شراء وتملك</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Property Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Property Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نوع العقار</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    >
                      <option value="شقة سكنية">شقة سكنية</option>
                      <option value="غرفة مستقلة مفروشة">غرفة مستقلة مفروشة</option>
                      <option value="فيلا مستقلة">فيلا مستقلة</option>
                      <option value="دوبلكس">دوبلكس</option>
                      <option value="محل تجاري">محل تجاري</option>
                      <option value="مكتب إداري">مكتب إداري</option>
                      <option value="شاليه مصيفي">شاليه مصيفي</option>
                      <option value="أرض">أرض</option>
                    </select>
                  </div>
                </div>

                {/* Preferred District */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الحي أو المنطقة المفضلة</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    >
                      <option value="كل أحياء دمياط الجديدة">كل أحياء دمياط الجديدة</option>
                      {DISTRICTS_LIST.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {listingType === 'rent' ? 'أقصى ميزانية للإيجار الشهري (ج.م)' : 'الميزانية المتوقعة للشراء (ج.م)'}
                  </label>
                  <div className="relative">
                    <Wallet className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      placeholder="مثال: 5000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    />
                  </div>
                </div>

                {/* Rooms */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">عدد الغرف المطلوب على الأقل</label>
                  <div className="relative">
                    <BedDouble className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                      className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    >
                      <option value="1">غرفة واحدة / استوديو</option>
                      <option value="2">غرفتان</option>
                      <option value="3">3 غرف نوم</option>
                      <option value="4">4 غرف فأكثر</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Contact Info */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-black text-slate-900">معلومات الاتصال بك</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">الاسم الكريم <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="اسمك الكامل"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">رقم الهاتف / الواتساب <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="010XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full pr-10 pl-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">ملاحظات أو اشتراطات خاصة (اختياري)</label>
                  <textarea
                    rows={3}
                    placeholder="مثال: يفضل دور أول أو ثاني، واجهة بحري، قريبة من جامعة دمياط..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition leading-relaxed"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl gold-gradient gold-gradient-hover text-white text-sm sm:text-base font-black shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-98 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isSubmitting ? 'جاري إرسال طلبك...' : 'إرسال الطلب لفريق سكني'}</span>
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  بياناتك محمية تماماً ولن يتم مشاركتها مع أي جهة خارجية
                </p>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
