import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, OperationType, PropertyType, FinishingType, FurnishingType } from '../types';
import { DISTRICTS_LIST, AMENITIES_LIST } from '../data/mockData';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { LocationMapPicker } from '../components/LocationMapPicker';
import { FALLBACK_PROPERTY_IMAGE, resolveImageUrl } from '../utils/media';
import { SEOHead } from '../components/SEOHead';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  DollarSign, 
  MapPin, 
  HelpCircle,
  Plus,
  User,
  Phone,
  Layers,
  Compass,
  ArrowRight,
  ShieldCheck,
  Video,
  FileText
} from 'lucide-react';

export const AddPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Contact Info
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState(() => StorageService.getClientPhone() || '');
  const [ownerNotes, setOwnerNotes] = useState('');

  // Dynamic Lists from Backend
  const [districts, setDistricts] = useState(DISTRICTS_LIST);
  const [amenitiesList, setAmenitiesList] = useState(AMENITIES_LIST);

  // Property Basic Data
  const [operationType, setOperationType] = useState<OperationType>('rent');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [districtId, setDistrictId] = useState<string>(DISTRICTS_LIST[0].id);
  const [price, setPrice] = useState<string>('');
  const [isNegotiable, setIsNegotiable] = useState(true);

  // Load live data from API
  React.useEffect(() => {
    ApiService.getLocations().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        const mapped = res.map((l: any) => ({
          id: String(l.id),
          name: l.name,
          description: l.description || '',
          count: Number(l.available_count || l.properties_count) || 0,
          available_count: Number(l.available_count || l.properties_count) || 0,
          image_url: l.image_url || '',
          coordinates: { lat: Number(l.latitude) || 31.4357, lng: Number(l.longitude) || 31.6708 },
        }));
        setDistricts(mapped);
        setDistrictId(mapped[0].id);
      }
    }).catch(() => {});

    ApiService.getAmenities().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setAmenitiesList(res.map((a: any) => ({
          id: a.slug || a.name || String(a.id),
          name: a.name,
          icon: 'Sparkles',
        })));
      }
    }).catch(() => {});
  }, []);

  // Specs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<string>('');
  const [rooms, setRooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('2');
  const [floor, setFloor] = useState<string>('2');
  const [finishing, setFinishing] = useState<FinishingType>('super_lux');
  const [furnishing, setFurnishing] = useState<FurnishingType>('unfurnished');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'elevator', 'natural_gas', 'super_lux', 'security'
  ]);

  // Coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 31.4357, lng: 31.6708 });

  // Images
  const [images, setImages] = useState<string[]>([
    FALLBACK_PROPERTY_IMAGE
  ]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddImageUrl = () => {
    if (customImageUrl.trim() && images.length < 15) {
      setImages(prev => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!ownerName.trim() || !ownerPhone.trim()) {
        alert('يرجى كتابة الاسم ورقم الهاتف للتواصل معك');
        return;
      }
    } else if (step === 2) {
      if (!price || Number(price) <= 0) {
        alert('يرجى تحديد السعر المطلوب');
        return;
      }
    }
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPhone.trim()) {
      alert('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }

    setIsSubmitting(true);
    const selectedDist = districts.find(d => d.id === districtId);
    const hasArea = operationType !== 'rent' && area && Number(area) > 0;
    const generatedTitle = title.trim() || `${propertyType === 'apartment' ? 'شقة' : 'عقار'} ${hasArea ? `بمساحة ${area} م²` : ''} في ${selectedDist?.name || 'دمياط الجديدة'}`.trim();
    const generatedDesc = description.trim() || `عقار معروض ${operationType === 'sale' ? 'للبيع' : 'للإيجار'} في ${selectedDist?.name || 'دمياط الجديدة'} ${hasArea ? `بمساحة ${area} م²،` : ''} موقع مميز وتشطيب عالي الجودة.`;

    const payload = {
      title: generatedTitle,
      description: generatedDesc,
      price: Number(price),
      is_negotiable: isNegotiable,
      operation_type: operationType,
      property_type: propertyType,
      category_id: operationType === 'sale' ? '1' : '2',
      property_type_id: '1',
      location_id: districtId || '1',
      latitude: coords.lat,
      longitude: coords.lng,
      area: (area && Number(area) > 0) ? Number(area) : null,
      rooms: Number(rooms),
      bathrooms: Number(bathrooms),
      floor: Number(floor) || 1,
      finishing: finishing,
      furnishing: furnishing,
      video_url: videoUrl.trim() || undefined,
      submitter_name: ownerName.trim(),
      submitter_phone: ownerPhone.trim(),
      submitter_notes: ownerNotes.trim() || undefined,
      images: images,
      amenities: selectedAmenities,
    };

    // Save submitter phone in storage for convenience
    StorageService.setClientPhone(ownerPhone.trim());

    // 1. Submit to Backend API
    try {
      await ApiService.submitProperty(payload);
    } catch (err) {
      console.warn('Backend property submission fallback:', err);
    }

    // 2. Storage persistence (Pending Review)
    StorageService.saveProperty({
      ...payload,
      district_name: selectedDist ? selectedDist.name : 'دمياط الجديدة',
      balconies: 1,
      status: 'available',
      submission_status: 'pending_review',
      featured: false,
      tags: ['عقار قيد المراجعة', selectedDist?.name || 'دمياط الجديدة', operationType === 'sale' ? 'للبيع' : 'للإيجار'],
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim(),
    });

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.55 }
      });
    } catch {}

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6 sm:pt-10" dir="rtl">
      <SEOHead
        title="أضف عقارك للبيع أو الإيجار مجاناً | سكني"
        description="اعرض شقتك، فيلتك أو محلك التجاري للبيع أو الإيجار أمام آلاف الباحثين عن عقارات في دمياط الجديدة مع تسويق احترافي وتوثيق قانوني."
        canonical="https://sakani.site/sell"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition cursor-pointer">الرئيسية</button>
          <span>/</span>
          <span className="text-[#8D6A28]">أضف عقارك في سكني</span>
        </div>

        {isSuccess ? (
          /* Confirmation Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200 shadow-sm text-center space-y-5 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-[#8D6A28] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                تم استلام بيانات عقارك بنجاح!
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                تم استلام عقارك وسيقوم فريق سكني بمراجعته وتدقيق البيانات قبل النشر للجمهور. سنتواصل معك هاتفياً أو عبر واتساب فور الانتهاء من المراجعة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold max-w-md mx-auto space-y-1">
              <div className="text-[#8D6A28] flex items-center justify-center gap-1.5 font-black">
                <ShieldCheck className="w-4 h-4" />
                <span>حالة الطلب: قيد المراجعة والاعتماد (Pending Review)</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                لن يظهر العقار بشكل عام في القوائم إلا بعد موافقة الإدارة لضمان جودة العروض.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer"
              >
                العودة للصفحة الرئيسية
              </button>

              <button
                onClick={() => navigate('/properties')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                استعراض باقي العقارات
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Section Form */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            
            {/* Header Hero Banner */}
            <div className="p-6 sm:p-8 bg-[#0F172A] text-white space-y-3 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8D6A28]/20 border border-[#D6A94E]/40 text-[#D6A94E] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>منصة سكني • تسويق عقارك باحترافية</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  أضف عقارك للبيع أو الإيجار
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                  سجل بيانات عقارك في دقائق، وسيقوم فريقنا بمراجعته واعتماده ونشره لأكبر قاعدة من المشترين والمستأجرين في دمياط الجديدة.
                </p>
              </div>

              {/* Progress Steps Header */}
              <div className="relative z-10 pt-4 flex items-center justify-between text-xs font-bold border-t border-white/10 mt-4">
                <span className={step >= 1 ? 'text-[#D6A94E]' : 'text-slate-400'}>1. معلومات التواصل</span>
                <span className={step >= 2 ? 'text-[#D6A94E]' : 'text-slate-400'}>2. السعر والمواصفات</span>
                <span className={step >= 3 ? 'text-[#D6A94E]' : 'text-slate-400'}>3. الموقع والصور</span>
              </div>
            </div>

            {/* Form Steps */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* ----------------- STEP 1: CONTACT INFO ----------------- */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="w-5 h-5 text-[#8D6A28]" />
                    <h2 className="text-base font-black text-slate-900">معلومات المالك والتواصل</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">الاسم الكامل <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="اسم المالك أو المعلن"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">رقم الهاتف / الواتساب <span className="text-rose-500">*</span></label>
                      <input
                        type="tel"
                        placeholder="010XXXXXXXX"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">ملاحظات إضافية للتواصل (اختياري)</label>
                    <input
                      type="text"
                      placeholder="أوقات الاتصال المفضلة أو وسيلة تواصل بديلة..."
                      value={ownerNotes}
                      onChange={(e) => setOwnerNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>المتابعة إلى مواصفات العقار</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 2: PROPERTY BASIC & SPECS ----------------- */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Building2 className="w-5 h-5 text-[#8D6A28]" />
                    <h2 className="text-base font-black text-slate-900">بيانات العقار والسعر والمواصفات</h2>
                  </div>

                  {/* Operation Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">الغرض من العرض</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOperationType('rent')}
                        className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black border transition cursor-pointer ${
                          operationType === 'rent'
                            ? 'bg-[#8D6A28]/10 border-[#8D6A28] text-[#8D6A28] shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        إيجار
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperationType('sale')}
                        className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black border transition cursor-pointer ${
                          operationType === 'sale'
                            ? 'bg-[#8D6A28]/10 border-[#8D6A28] text-[#8D6A28] shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        بيع
                      </button>
                    </div>
                  </div>

                  {/* Property Type & Price Grid */}
                  <div className={`grid grid-cols-1 ${operationType === 'rent' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">نوع العقار</label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                      >
                        <option value="apartment">شقة سكنية</option>
                        <option value="villa">فيلا مستقلة</option>
                        <option value="duplex">دوبلكس</option>
                        <option value="shop">محل تجاري</option>
                        <option value="office">مكتب إداري</option>
                        <option value="chalet">شاليه مصيفي</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {operationType === 'rent' ? 'الإيجار الشهري (ج.م) *' : 'سعر البيع المطلوب (ج.م) *'}
                      </label>
                      <input
                        type="number"
                        placeholder="السعر بالجنيه"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition font-mono"
                      />
                    </div>

                    {operationType !== 'rent' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">المساحة (م²)</label>
                        <input
                          type="number"
                          placeholder="المساحة بالمتر"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-[#8D6A28] outline-none transition font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Rooms, Baths, Floor */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">عدد الغرف</label>
                      <select
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none"
                      >
                        <option value="1">1 غرفة</option>
                        <option value="2">2 غرفة</option>
                        <option value="3">3 غرف</option>
                        <option value="4">4 غرف</option>
                        <option value="5">5 غرف فأكثر</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">عدد الحمامات</label>
                      <select
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none"
                      >
                        <option value="1">1 حمام</option>
                        <option value="2">2 حمام</option>
                        <option value="3">3 حمامات</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">الدور / الطابق</label>
                      <input
                        type="number"
                        placeholder="مثال: 2"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none"
                      />
                    </div>
                  </div>

                  {/* Finishing & Furnishing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">مستوى التشطيب</label>
                      <select
                        value={finishing}
                        onChange={(e) => setFinishing(e.target.value as FinishingType)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none"
                      >
                        <option value="super_lux">سوبر لوكس</option>
                        <option value="lux">لوكس</option>
                        <option value="semi_finished">نصف تشطيب / محارة</option>
                        <option value="red_brick">طوب أحمر</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">حالة الفرش</label>
                      <select
                        value={furnishing}
                        onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none"
                      >
                        <option value="unfurnished">غير مفروش (فاضي)</option>
                        <option value="furnished">مفروش بالكامل</option>
                      </select>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">عنوان الإعلان (اختياري)</label>
                      <input
                        type="text"
                        placeholder="مثال: شقة للبيع 135م بحري صريح بالحي الخامس"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">وصف العقار ومميزاته</label>
                      <textarea
                        rows={3}
                        placeholder="اكتب تفاصيل العقار، القرب من الخدمات، اتجاه الشقة، الفيو..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">رابط فيديو للعقار (YouTube أو Drive) (اختياري)</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Nav Buttons */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      السابق
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>المتابعة إلى الموقع والصور</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STEP 3: LOCATION & MAP & IMAGES ----------------- */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Compass className="w-5 h-5 text-[#8D6A28]" />
                    <h2 className="text-base font-black text-slate-900">الموقع الجغرافي والصور والمرافق</h2>
                  </div>

                  {/* District Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">الحي / المنطقة في دمياط الجديدة</label>
                    <select
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-50 outline-none"
                    >
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Interactive Map Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      تحديد موقع العقار على الخريطة (اختياري ودقيق)
                    </label>
                    <LocationMapPicker
                      latitude={coords.lat}
                      longitude={coords.lng}
                      onChange={setCoords}
                      height="280px"
                    />
                  </div>

                  {/* Amenities Multi-Check */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700">المرافق والتجهيزات المتوفرة</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {amenitiesList.map((a) => {
                        const isChecked = selectedAmenities.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleAmenityToggle(a.id)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition text-right flex items-center justify-between cursor-pointer ${
                              isChecked
                                ? 'bg-[#8D6A28]/10 border-[#8D6A28] text-[#8D6A28]'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span>{a.name}</span>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#8D6A28]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Images Section */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700">صور العقار</label>
                    
                    {/* Add Image URL input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="ضع رابط صورة مباشرة (مثال: https://...)"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                      >
                        إضافة صورة
                      </button>
                    </div>

                    {/* Image Thumbnails */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 h-24 group bg-slate-100">
                          <img 
                            src={resolveImageUrl(url)} 
                            alt={`صورة ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                              رئيسية
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 left-1 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Action Buttons */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      السابق
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isSubmitting ? 'جاري إرسال العقار...' : 'تأكيد وإرسال العقار للمراجعة'}</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
