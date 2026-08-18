import React, { useState } from 'react';
import { Property, OperationType, PropertyType, FinishingType, FurnishingType } from '../types';
import { DISTRICTS_LIST, AMENITIES_LIST } from '../data/mockData';
import { StorageService } from '../services/storageService';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  ChevronLeft, 
  Building2, 
  DollarSign, 
  MapPin, 
  HelpCircle,
  Plus
} from 'lucide-react';

interface SellAddPropertyPageProps {
  onPropertyAdded: (newProp: Property) => void;
  onNavigateHome: () => void;
}

export const SellAddPropertyPage: React.FC<SellAddPropertyPageProps> = ({
  onPropertyAdded,
  onNavigateHome,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Data
  const [operationType, setOperationType] = useState<OperationType>('sale');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [districtId, setDistrictId] = useState<string>(DISTRICTS_LIST[0].id);
  const [area, setArea] = useState<string>('');
  const [rooms, setRooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('2');
  const [floor, setFloor] = useState<string>('2');
  const [price, setPrice] = useState<string>('');
  const [isNegotiable, setIsNegotiable] = useState(true);

  // Step 2
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [finishing, setFinishing] = useState<FinishingType>('super_lux');
  const [furnishing, setFurnishing] = useState<FurnishingType>('unfurnished');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'elevator', 'natural_gas', 'super_lux', 'security'
  ]);
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80'
  ]);

  // Step 3
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerNotes, setOwnerNotes] = useState('');

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddSampleImage = (url: string) => {
    if (images.length < 10) {
      setImages(prev => [...prev, url]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!price || Number(price) <= 0) {
        alert('يرجى تحديد السعر المطلوب');
        return;
      }
      if (!area || Number(area) <= 0) {
        alert('يرجى كتابة المساحة بالمتر المربع');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPhone.trim()) {
      alert('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }

    setIsSubmitting(true);
    const selectedDist = DISTRICTS_LIST.find(d => d.id === districtId);
    const generatedTitle = title.trim() || `${propertyType === 'apartment' ? 'شقة' : 'عقار'} بمساحة ${area} م² في ${selectedDist?.name || 'دمياط الجديدة'}`;

    const newProperty = StorageService.saveProperty({
      title: generatedTitle,
      description: description.trim() || `عقار معروض ${operationType === 'sale' ? 'للبيع' : 'للإيجار'} في ${selectedDist?.name || 'دمياط الجديدة'} بمساحة ${area} م²، موقع استراتيجي وتشطيب متميز.`,
      price: Number(price),
      is_negotiable: isNegotiable,
      operation_type: operationType,
      property_type: propertyType,
      location_id: districtId,
      district_name: selectedDist ? selectedDist.name : 'دمياط الجديدة',
      area: Number(area),
      rooms: Number(rooms),
      bathrooms: Number(bathrooms),
      floor: Number(floor) || 1,
      balconies: 1,
      finishing: finishing,
      furnishing: furnishing,
      status: 'available',
      featured: false,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'],
      amenities: selectedAmenities,
      tags: ['عقار جديد', selectedDist?.name || 'دمياط الجديدة', operationType === 'sale' ? 'للبيع' : 'للإيجار'],
      owner_name: ownerName.trim() || 'معلن سكني',
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
    onPropertyAdded(newProperty);

    setTimeout(() => {
      onNavigateHome();
    }, 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      
      {/* Container matching Screenshot 7 */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-6 sm:p-8 bg-[#0F172A] text-white">
          <h1 className="text-2xl sm:text-3xl font-black">أضف عقارك في سكني</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            الخطوة {step} من 3 — {step === 1 ? 'المعلومات الأساسية' : step === 2 ? 'التفاصيل والمواصفات' : 'بيانات التواصل والنشر'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div 
            className="bg-[#8D6A28] h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">تم نشر عقارك بنجاح في منصة سكني!</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                أصبح عقارك متاحاً الآن لجميع الباحثين في دمياط الجديدة وسيتواصل معك المشترون مباشرة.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: Basic Info matching Screenshot 7 */}
              {step === 1 && (
                <>
                  {/* نوع العملية */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      نوع العملية
                    </label>
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setOperationType('sale')}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                          operationType === 'sale'
                            ? 'bg-[#0F172A] text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        للبيع
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperationType('rent')}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                          operationType === 'rent'
                            ? 'bg-[#0F172A] text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        للإيجار
                      </button>
                    </div>
                  </div>

                  {/* نوع العقار */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      نوع العقار
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    >
                      <option value="apartment">شقة سكنية</option>
                      <option value="villa">فيلا مستقلة</option>
                      <option value="duplex">دوبلكس</option>
                      <option value="penthouse">بنتهاوس / روف</option>
                      <option value="shop">محل تجاري</option>
                      <option value="office">مكتب إداري</option>
                      <option value="land">قطعة أرض</option>
                      <option value="chalet">شاليه مصيفي</option>
                    </select>
                  </div>

                  {/* الموقع في دمياط الجديدة */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      الموقع (دمياط الجديدة)
                    </label>
                    <select
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    >
                      {DISTRICTS_LIST.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* المواصفات 4 inputs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      المواصفات
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <input
                          type="number"
                          min="1"
                          placeholder="المساحة (م²) *"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="عدد الغرف"
                          value={rooms}
                          onChange={(e) => setRooms(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="عدد الحمامات"
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="الطابق"
                          value={floor}
                          onChange={(e) => setFloor(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* السعر المطلوب */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      السعر المطلوب (ج.م) {operationType === 'rent' ? 'شهرياً' : ''}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-3.5 pl-12 rounded-xl border border-slate-200 bg-slate-50 font-black text-base text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                        required
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ج.م
                      </span>
                    </div>
                  </div>

                  {/* صور العقار Box matching Screenshot 7 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      صور العقار ({images.length}/10)
                    </label>
                    
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/60 hover:bg-slate-50 transition">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-slate-600 mb-2">
                        <Upload className="w-6 h-6 text-[#8D6A28]" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">
                        اضغط أو اسحب الصور هنا
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        الحد الأقصى 10 صور (JPG, PNG)
                      </p>

                      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddSampleImage('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80')}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold hover:border-[#8D6A28] transition"
                        >
                          + صورة ريسبشن
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSampleImage('https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80')}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold hover:border-[#8D6A28] transition"
                        >
                          + صورة واجهة
                        </button>
                      </div>
                    </div>

                    {images.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 group">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* STEP 2: Details */}
              {step === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      عنوان الإعلان (مختصر وجذاب)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شقة 150 متر للبيع في الحي الخامس بإطلالة مفتوحة"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        حالة التشطيب
                      </label>
                      <select
                        value={finishing}
                        onChange={(e) => setFinishing(e.target.value as FinishingType)}
                        className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 outline-none"
                      >
                        <option value="super_lux">سوبر لوكس</option>
                        <option value="lux">لوكس</option>
                        <option value="semi_finished">نصف تشطيب</option>
                        <option value="red_brick">على الطوب الأحمر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        حالة التأثيث
                      </label>
                      <select
                        value={furnishing}
                        onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                        className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 outline-none"
                      >
                        <option value="unfurnished">غير مفروش</option>
                        <option value="furnished">مفروش بالكامل</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      المميزات والخدمات
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AMENITIES_LIST.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity.id);
                        return (
                          <button
                            key={amenity.id}
                            type="button"
                            onClick={() => handleAmenityToggle(amenity.id)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-[#8D6A28]/10 border-[#8D6A28] text-[#8D6A28]'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{amenity.name}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#8D6A28]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      الوصف التفصيلي للعقار
                    </label>
                    <textarea
                      rows={4}
                      placeholder="اذكر مميزات العقار، قربها من الخدمات، طبيعة الحي، وتفاصيل الأقساط إن وجدت..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    ></textarea>
                  </div>
                </>
              )}

              {/* STEP 3: Contact Info */}
              {step === 3 && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      اسم المعلن أو المالك *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: م. أحمد الشربيني"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      رقم الهاتف للتواصل والواتساب *
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="010XXXXXXXX"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition text-right"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      ملاحظات إضافية لفريق سكني (اختياري)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="أوقات المعاينة المفضلة أو أي تفاصيل خاصة..."
                      value={ownerNotes}
                      onChange={(e) => setOwnerNotes(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                    ></textarea>
                  </div>
                </>
              )}

              {/* Navigation buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    className="px-5 py-3 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition"
                  >
                    السابق
                  </button>
                ) : <div />}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3.5 rounded-xl bg-[#8D6A28] hover:bg-[#AC7F2B] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-xl gold-gradient gold-gradient-hover text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>نشر العقار الآن</span>
                  </button>
                )}
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
