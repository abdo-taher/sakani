import React, { useState, useEffect } from 'react';
import { Property, OperationType, PropertyType, FinishingType, FurnishingType, DetailedRoom } from '../types';
import { DISTRICTS_LIST, AMENITIES_LIST } from '../data/mockData';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import { 
  X, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Building2, 
  Plus, 
  Sparkles, 
  Home, 
  Image as ImageIcon,
  ArrowRight,
  ChevronLeft,
  DoorOpen,
  DollarSign,
  Maximize2,
  Video,
  FileText,
  Tag,
  Layers
} from 'lucide-react';

interface AddPropertyModalProps {
  isOpen: boolean;
  initialProperty?: Property | null;
  onClose: () => void;
  onPropertyAdded: (newProp: Property) => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  initialProperty,
  onClose,
  onPropertyAdded,
}) => {
  const isEditMode = Boolean(initialProperty);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Basic Form State
  const [operationType, setOperationType] = useState<OperationType>('sale');
  const [rentalMode, setRentalMode] = useState<'full' | 'rooms'>('full');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [districtId, setDistrictId] = useState<string>(DISTRICTS_LIST[0].id);
  const [area, setArea] = useState<string>('');
  const [rooms, setRooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('2');
  const [floor, setFloor] = useState<string>('2');
  const [price, setPrice] = useState<string>('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [status, setStatus] = useState<Property['status']>('available');
  
  // Step 2 Details & Media
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [finishing, setFinishing] = useState<FinishingType>('super_lux');
  const [furnishing, setFurnishing] = useState<FurnishingType>('unfurnished');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'elevator', 'natural_gas', 'super_lux', 'security'
  ]);
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Step 3 - Rooms Builder (if Rental by Rooms)
  const [detailedRooms, setDetailedRooms] = useState<DetailedRoom[]>([
    {
      id: 'room-1',
      name: 'غرفة 1 - ماستر',
      description: 'غرفة رئيسية بحمام داخلي وإطلالة بحرية',
      price: 2500,
      area: 20,
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'room-2',
      name: 'غرفة 2 - مفردة',
      description: 'غرفة مجهزة ومفروشة بالكامل',
      price: 1800,
      area: 16,
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    }
  ]);

  // Contact info
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerNotes, setOwnerNotes] = useState('');

  // Populate form if initialProperty is provided (Edit Mode)
  useEffect(() => {
    if (initialProperty) {
      setOperationType(initialProperty.operation_type || 'sale');
      setRentalMode(initialProperty.has_detailed_rooms ? 'rooms' : 'full');
      setPropertyType(initialProperty.property_type || 'apartment');
      setDistrictId(initialProperty.location_id || DISTRICTS_LIST[0].id);
      setArea(String(initialProperty.area || ''));
      setRooms(String(initialProperty.rooms || '3'));
      setBathrooms(String(initialProperty.bathrooms || '2'));
      setFloor(String(initialProperty.floor || '1'));
      setPrice(String(initialProperty.price || ''));
      setIsNegotiable(Boolean(initialProperty.is_negotiable));
      setStatus(initialProperty.status || 'available');
      setTitle(initialProperty.title || '');
      setDescription(initialProperty.description || '');
      setFinishing(initialProperty.finishing || 'super_lux');
      setFurnishing(initialProperty.furnishing || 'unfurnished');
      setVideoUrl(initialProperty.video_url || '');
      setSelectedAmenities(initialProperty.amenities || ['elevator', 'natural_gas']);
      setImages(initialProperty.images && initialProperty.images.length > 0 ? initialProperty.images : [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80'
      ]);
      if (initialProperty.detailed_rooms && initialProperty.detailed_rooms.length > 0) {
        setDetailedRooms(initialProperty.detailed_rooms);
      }
      setOwnerName(initialProperty.owner_name || '');
      setOwnerPhone(initialProperty.owner_phone || '');
    } else {
      // Reset defaults
      setOperationType('sale');
      setRentalMode('full');
      setStep(1);
    }
  }, [initialProperty, isOpen]);

  if (!isOpen) return null;

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCustomImageAdd = () => {
    if (newImageUrl.trim() && images.length < 15) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Rooms Builder Handlers
  const handleAddRoom = () => {
    const nextNum = detailedRooms.length + 1;
    const newRoom: DetailedRoom = {
      id: `room-${Date.now()}`,
      name: `غرفة ${nextNum}`,
      description: 'غرفة سكنية مستقلة مجهزة',
      price: Math.round(Number(price) / (nextNum || 1)) || 1500,
      area: 16,
      status: 'available',
      imageUrl: images[0] || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    };
    setDetailedRooms(prev => [...prev, newRoom]);
  };

  const handleUpdateRoom = (roomId: string, field: keyof DetailedRoom, value: any) => {
    setDetailedRooms(prev => prev.map(r => r.id === roomId ? { ...r, [field]: value } : r));
  };

  const handleRemoveRoom = (roomId: string) => {
    if (detailedRooms.length <= 1) {
      alert('يجب أن يحتوي الإيجار بالغرف على غرفة واحدة على الأقل');
      return;
    }
    setDetailedRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!price || Number(price) <= 0) {
        alert('يرجى كتابة السعر المطلوب');
        return;
      }
      if (!area || Number(area) <= 0) {
        alert('يرجى تحديد المساحة بالمتر المربع');
        return;
      }
    }
    if (step === 2) {
      if (!title.trim()) {
        const selectedDist = DISTRICTS_LIST.find(d => d.id === districtId)?.name || 'دمياط الجديدة';
        const typeArabic = propertyType === 'apartment' ? 'شقة' : propertyType === 'villa' ? 'فيلا' : 'عقار';
        setTitle(`${typeArabic} ${area}م² ${operationType === 'sale' ? 'للبيع' : 'للإيجار'} في ${selectedDist}`);
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedDist = DISTRICTS_LIST.find(d => d.id === districtId);
    const generatedTitle = title.trim() || `${propertyType === 'apartment' ? 'شقة' : 'عقار'} بمساحة ${area} م² في ${selectedDist?.name}`;
    const hasRooms = operationType === 'rent' && rentalMode === 'rooms';

    const payloadData = {
      id: initialProperty?.id,
      ref_id: initialProperty?.ref_id,
      title: generatedTitle,
      description: description.trim() || `عقار معروض ${operationType === 'sale' ? 'للبيع' : 'للإيجار'} في ${selectedDist?.name} بدمياط الجديدة بمساحة ${area} م²، تشطيب عالي الجودة وتصميم معماري مميز وقريب من كافة الخدمات.`,
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
      status: status,
      featured: initialProperty ? Boolean(initialProperty.featured) : false,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'],
      video_url: videoUrl.trim() || undefined,
      amenities: selectedAmenities,
      tags: ['عقار مميز', selectedDist?.name || 'دمياط الجديدة', operationType === 'sale' ? 'للبيع' : 'للإيجار'],
      owner_name: ownerName.trim() || 'إدارة منصة سكني',
      owner_phone: ownerPhone.trim() || '01067725976',
      has_detailed_rooms: hasRooms,
      detailed_rooms: hasRooms ? detailedRooms : [],
    };

    // 1. Save in StorageService
    const savedProperty = StorageService.saveProperty(payloadData);

    // 2. Also try API if connected
    const numId = initialProperty ? parseInt(initialProperty.id.replace(/\D/g, ''), 10) : null;
    if (numId) {
      try {
        await ApiService.updateProperty(numId, {
          title: payloadData.title,
          description: payloadData.description,
          price: payloadData.price,
          status: payloadData.status,
          finishing: payloadData.finishing,
          furnishing: payloadData.furnishing,
          has_detailed_rooms: payloadData.has_detailed_rooms,
          rooms_data: hasRooms ? detailedRooms.map(r => ({
            name: r.name,
            description: r.description,
            price: r.price,
            area: r.area,
          })) : [],
        });
      } catch (err) {}
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    setIsSubmitting(false);
    setIsSuccess(true);
    onPropertyAdded(savedProperty);

    setTimeout(() => {
      setIsSuccess(false);
      setStep(1);
      onClose();
    }, 2000);
  };

  const totalSteps = operationType === 'rent' && rentalMode === 'rooms' ? 4 : 3;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6" dir="rtl">
      
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {isEditMode ? `تعديل العقار: ${initialProperty?.title}` : 'إضافة عقار جديد'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              الخطوة {step} من {totalSteps} — {
                step === 1 ? 'المعلومات الأساسية ونظام العرض' :
                step === 2 ? 'المواصفات والوسائط' :
                step === 3 && totalSteps === 4 ? 'إعداد الغرف المستقلة' :
                'بيانات النشر والتأكيد'
              }
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div 
            className="bg-[#8D6A28] h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {isEditMode ? 'تم تحديث بيانات العقار بنجاح!' : 'تم إضافة عقارك بنجاح!'}
              </h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                تم حفظ كافة التعديلات والمواصفات وأصبحت معروضة بنجاح على منصة سكني.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* STEP 1: Basic Info & Rental Mode */}
              {step === 1 && (
                <>
                  {/* Operation Type (Sale / Rent) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">نوع العملية</label>
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setOperationType('sale')}
                        className={`py-3 rounded-xl font-black text-sm transition-all cursor-pointer ${
                          operationType === 'sale'
                            ? 'bg-[#0F172A] text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        بيع وتمليك
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperationType('rent')}
                        className={`py-3 rounded-xl font-black text-sm transition-all cursor-pointer ${
                          operationType === 'rent'
                            ? 'bg-[#0F172A] text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        إيجار
                      </button>
                    </div>
                  </div>

                  {/* Rental Mode (Only if Rent) */}
                  {operationType === 'rent' && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                      <label className="block text-xs font-black text-[#8D6A28] flex items-center gap-1.5">
                        <DoorOpen className="w-4 h-4" />
                        <span>نظام التأجير المطلوب</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRentalMode('full')}
                          className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                            rentalMode === 'full'
                              ? 'bg-white border-[#8D6A28] text-slate-900 shadow-sm'
                              : 'border-amber-200/60 bg-amber-50/40 text-slate-600'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-[#8D6A28]" />
                          <span>إيجار الوحدة بالكامل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRentalMode('rooms')}
                          className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                            rentalMode === 'rooms'
                              ? 'bg-white border-[#8D6A28] text-slate-900 shadow-sm'
                              : 'border-amber-200/60 bg-amber-50/40 text-slate-600'
                          }`}
                        >
                          <DoorOpen className="w-4 h-4 text-[#8D6A28]" />
                          <span>إيجار بنظام الغرف المستقلة</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Property Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">نوع العقار</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition cursor-pointer"
                    >
                      <option value="apartment">شقة سكنية</option>
                      <option value="villa">فيلا مستقلة</option>
                      <option value="duplex">دوبلكس</option>
                      <option value="penthouse">بنتهاوس / روف</option>
                      <option value="shop">محل تجاري</option>
                      <option value="office">مكتب إداري</option>
                      <option value="land">قطعة أرض</option>
                      <option value="chalet">شاليه مصيفي</option>
                      <option value="studio">ستوديو / غرفة</option>
                    </select>
                  </div>

                  {/* District Location */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">الحي / المنطقة بدمياط الجديدة</label>
                    <select
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none transition cursor-pointer"
                    >
                      {DISTRICTS_LIST.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Property Specs (Area, Rooms, Baths, Floor) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">المواصفات الرئيسية</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <input
                          type="number"
                          placeholder="المساحة (م²)"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="عدد الغرف"
                          value={rooms}
                          onChange={(e) => setRooms(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="عدد الحمامات"
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="الطابق"
                          value={floor}
                          onChange={(e) => setFloor(e.target.value)}
                          className="w-full p-3.5 text-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      السعر الإجمالي المطلوب (ج.م) {operationType === 'rent' ? 'شهرياً' : ''}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-3.5 pl-12 rounded-xl border border-slate-200 bg-slate-50 font-black text-base text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                        required
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ج.م</span>
                    </div>
                  </div>

                  {/* Status Selection (in Edit mode) */}
                  {isEditMode && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">حالة توفر العقار</label>
                      <select
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-800 focus:border-[#8D6A28] outline-none cursor-pointer"
                      >
                        <option value="available">متاح حالياً للحجز</option>
                        <option value="reserved">محجوز وبانتظار إنهاء الإجراءات</option>
                        <option value="sold">تم البيع</option>
                        <option value="rented">تم التأجير</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: Description, Finishing, Furnishing & Media */}
              {step === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإعلان *</label>
                    <input
                      type="text"
                      placeholder="عنوان جذاب يوضح مواصفات وموقع العقار"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-extrabold text-sm text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الوصف التفصيلي</label>
                    <textarea
                      rows={3}
                      placeholder="اكتب وصفاً وافياً عن العقار، الواجهات، القرب من الخدمات..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#8D6A28] outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نوع التشطيب</label>
                      <select
                        value={finishing}
                        onChange={(e) => setFinishing(e.target.value as FinishingType)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs sm:text-sm text-slate-800 focus:border-[#8D6A28] outline-none cursor-pointer"
                      >
                        <option value="super_lux">سوبر لوكس</option>
                        <option value="lux">لوكس</option>
                        <option value="semi_finished">نصف تشطيب</option>
                        <option value="red_brick">طوب أحمر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الفرش والتجهيزات</label>
                      <select
                        value={furnishing}
                        onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs sm:text-sm text-slate-800 focus:border-[#8D6A28] outline-none cursor-pointer"
                      >
                        <option value="unfurnished">غير مفروش</option>
                        <option value="furnished">مفروش بالكامل</option>
                      </select>
                    </div>
                  </div>

                  {/* Video URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رابط فيديو المعاينة (اختياري)</label>
                    <input
                      type="url"
                      placeholder="https://... فيديو mp4 أو يوتيوب للجولة الميدانية"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs sm:text-sm text-slate-800 focus:border-[#8D6A28] outline-none"
                    />
                  </div>

                  {/* Amenities Multi-select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">المميزات والخدمات المتاحة</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AMENITIES_LIST.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity.id);
                        return (
                          <button
                            type="button"
                            key={amenity.id}
                            onClick={() => handleAmenityToggle(amenity.id)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-right transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 border-[#8D6A28] text-[#8D6A28]'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span>{amenity.name}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#8D6A28]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Images List */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">صور العقار ({images.length})</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="أدخل رابط صورة (URL) مباشرة..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCustomImageAdd}
                        className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3 (If Rental by Rooms): Dedicated Room Builder */}
              {step === 3 && totalSteps === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-5 h-5 text-[#8D6A28]" />
                      <h3 className="font-extrabold text-sm text-slate-900">
                        إعداد الغرف المستقلة للتأجير ({detailedRooms.length} غرف)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRoom}
                      className="px-3.5 py-1.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة غرفة أخرى</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {detailedRooms.map((room, idx) => (
                      <div key={room.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 relative">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black">
                            غرفة #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRoom(room.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                            title="حذف الغرفة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الغرفة *</label>
                            <input
                              type="text"
                              value={room.name}
                              onChange={(e) => handleUpdateRoom(room.id, 'name', e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">السعر الشهري (ج.م) *</label>
                            <input
                              type="number"
                              value={room.price}
                              onChange={(e) => handleUpdateRoom(room.id, 'price', Number(e.target.value))}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">المساحة (م²)</label>
                            <input
                              type="number"
                              value={room.area || ''}
                              onChange={(e) => handleUpdateRoom(room.id, 'area', Number(e.target.value))}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">وصف وتجهيزات الغرفة</label>
                          <input
                            type="text"
                            value={room.description || ''}
                            onChange={(e) => handleUpdateRoom(room.id, 'description', e.target.value)}
                            placeholder="سرير، دولاب، تكييف، حمام خاص..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FINAL STEP: Owner Info & Confirmation */}
              {step === totalSteps && (
                <div className="space-y-4">
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900">مراجعة بيانات النشر</h4>
                    <p className="text-xs text-slate-600">
                      العقار: {title || 'عقار جديد'} — {operationType === 'sale' ? 'للبيع' : rentalMode === 'rooms' ? 'إيجار بالغرف' : 'إيجار كامل'} بسعر {price} ج.م
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم المالك / المعلن</label>
                      <input
                        type="text"
                        placeholder="إدارة منصة سكني"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-slate-800 focus:border-[#8D6A28] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل *</label>
                      <input
                        type="tel"
                        required
                        placeholder="01067725976"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-slate-800 focus:border-[#8D6A28] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons (Next / Prev / Submit) */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                    <span>السابق</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>المتابعة</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'جاري الحفظ...' : isEditMode ? 'تحديث وحفظ التعديلات' : 'نشر العقار الآن'}</span>
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
