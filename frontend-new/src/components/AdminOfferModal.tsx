import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { evaluatePropertyOffer, getTodayDateString, formatArabicDate } from '../utils/offerUtils';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { 
  Tag, 
  Flame, 
  Calendar, 
  Percent, 
  DollarSign, 
  X, 
  Check, 
  Clock, 
  Sparkles, 
  Trash2, 
  AlertCircle, 
  Eye,
  ArrowRight
} from 'lucide-react';

interface AdminOfferModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onOfferUpdated: (updatedProperty: Property) => void;
}

const BADGE_PRESETS = [
  'خصم 5%',
  'خصم 10%',
  'خصم 15%',
  'خصم 20%',
  'خصم 25%',
  'خصم 30%',
  'عرض خاص',
  'عرض الصيف',
  'لفترة محدودة',
  'عرض كاش',
  'فرصة مميزة'
];

export const AdminOfferModal: React.FC<AdminOfferModalProps> = ({
  property,
  isOpen,
  onClose,
  onOfferUpdated,
}) => {
  if (!isOpen || !property) return null;

  const originalPrice = Number(property.price) || 0;

  const [hasOffer, setHasOffer] = useState<boolean>(Boolean(property.has_offer));
  const [offerPrice, setOfferPrice] = useState<string>(property.offer_price ? String(property.offer_price) : '');
  const [discountPercent, setDiscountPercent] = useState<string>(
    property.offer_discount_percentage
      ? String(property.offer_discount_percentage)
      : property.offer_price && originalPrice > 0
      ? String(Math.round(((originalPrice - property.offer_price) / originalPrice) * 100))
      : '10'
  );
  const [startDate, setStartDate] = useState<string>(
    property.offer_start_date ? property.offer_start_date.split('T')[0] : getTodayDateString()
  );
  const [endDate, setEndDate] = useState<string>(
    property.offer_end_date
      ? property.offer_end_date.split('T')[0]
      : () => {
          const d = new Date();
          d.setDate(d.getDate() + 14); // default 2 weeks
          return d.toISOString().split('T')[0];
        }
  );
  const [offerTitle, setOfferTitle] = useState<string>(property.offer_title || '');
  const [offerBadge, setOfferBadge] = useState<string>(property.offer_badge || 'خصم خاص');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when property changes
  useEffect(() => {
    if (property) {
      const orig = Number(property.price) || 0;
      setHasOffer(Boolean(property.has_offer));
      setOfferPrice(property.offer_price ? String(property.offer_price) : '');
      setDiscountPercent(
        property.offer_discount_percentage
          ? String(property.offer_discount_percentage)
          : property.offer_price && orig > 0
          ? String(Math.round(((orig - property.offer_price) / orig) * 100))
          : '10'
      );
      setStartDate(property.offer_start_date ? property.offer_start_date.split('T')[0] : getTodayDateString());
      
      if (property.offer_end_date) {
        setEndDate(property.offer_end_date.split('T')[0]);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        setEndDate(d.toISOString().split('T')[0]);
      }

      setOfferTitle(property.offer_title || '');
      setOfferBadge(property.offer_badge || 'خصم خاص');
      setErrorMsg(null);
    }
  }, [property]);

  // Handler: changing Offer Price auto updates Discount Percentage
  const handleOfferPriceChange = (val: string) => {
    setOfferPrice(val);
    const num = Number(val);
    if (num > 0 && originalPrice > 0 && num < originalPrice) {
      const calculated = Math.round(((originalPrice - num) / originalPrice) * 100);
      setDiscountPercent(String(calculated));
      if (!offerBadge || offerBadge.startsWith('خصم')) {
        setOfferBadge(`خصم ${calculated}%`);
      }
    }
  };

  // Handler: changing Discount Percentage auto updates Offer Price
  const handleDiscountPercentChange = (val: string) => {
    setDiscountPercent(val);
    const pct = Number(val);
    if (pct > 0 && pct < 100 && originalPrice > 0) {
      const calculated = Math.round(originalPrice * (1 - pct / 100));
      setOfferPrice(String(calculated));
      if (!offerBadge || offerBadge.startsWith('خصم')) {
        setOfferBadge(`خصم ${pct}%`);
      }
    }
  };

  // Quick preset selection
  const handlePresetSelect = (preset: string) => {
    setOfferBadge(preset);
    const match = preset.match(/(\d+)%/);
    if (match && match[1]) {
      handleDiscountPercentChange(match[1]);
    }
  };

  // Live evaluation for preview
  const previewOfferInfo = evaluatePropertyOffer({
    price: originalPrice,
    has_offer: hasOffer,
    offer_price: Number(offerPrice) || 0,
    offer_discount_percentage: Number(discountPercent) || 0,
    offer_start_date: startDate,
    offer_end_date: endDate,
    offer_title: offerTitle,
    offer_badge: offerBadge,
  });

  const handleSave = async () => {
    if (!property) return;
    setErrorMsg(null);

    if (hasOffer) {
      const numOfferPrice = Number(offerPrice);
      if (!numOfferPrice || numOfferPrice <= 0) {
        setErrorMsg('يرجى إدخال سعر العرض المخفض بشكل صحيح');
        return;
      }
      if (originalPrice > 0 && numOfferPrice >= originalPrice) {
        setErrorMsg('سعر العرض يجب أن يكون أقل من السعر الأصلي للعقار');
        return;
      }
      if (startDate && endDate && startDate > endDate) {
        setErrorMsg('تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية');
        return;
      }
    }

    setIsSaving(true);
    const payload = {
      has_offer: hasOffer,
      offer_price: hasOffer ? Number(offerPrice) : null,
      offer_discount_percentage: hasOffer ? (Number(discountPercent) || null) : null,
      offer_start_date: hasOffer ? startDate : null,
      offer_end_date: hasOffer ? endDate : null,
      offer_title: hasOffer ? offerTitle : null,
      offer_badge: hasOffer ? offerBadge : null,
    };

    try {
      // 1. Update in LocalStorage
      const localUpdated = StorageService.updatePropertyOffer(property.id, payload);

      // 2. Update via Backend API if numeric ID
      const numId = parseInt(property.id.replace(/\D/g, ''), 10);
      if (numId) {
        await ApiService.updatePropertyOffer(numId, payload).catch((err) => {
          console.warn('API offer update sync note:', err);
        });
      }

      const finalProp: Property = {
        ...property,
        has_offer: payload.has_offer,
        offer_price: payload.offer_price ?? undefined,
        offer_discount_percentage: payload.offer_discount_percentage ?? undefined,
        offer_start_date: payload.offer_start_date ?? undefined,
        offer_end_date: payload.offer_end_date ?? undefined,
        offer_title: payload.offer_title ?? undefined,
        offer_badge: payload.offer_badge ?? undefined,
      };

      onOfferUpdated(finalProp);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ العرض');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveOffer = () => {
    setHasOffer(false);
    setOfferPrice('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>إدارة العرض الترويجي والتخفيض</span>
                <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded-md text-amber-300">
                  {property.ref_id}
                </span>
              </h2>
              <p className="text-xs text-slate-300 line-clamp-1">{property.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Master Offer Toggle Switch */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">تفعيل العرض الترويجي على هذا العقار</p>
                <p className="text-xs text-slate-600">إبراز العقار في قسم العروض وشارات التخفيض في الموقع</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasOffer}
                onChange={(e) => setHasOffer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#8D6A28]"></div>
            </label>
          </div>

          {hasOffer && (
            <div className="space-y-5 animate-fade-in">
              {/* Original Price Reference */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>السعر الأصلي الحالي المسجل:</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {originalPrice.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              {/* Pricing & Percentage Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>سعر العرض بعد الخصم (ج.م) *</span>
                  </label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => handleOfferPriceChange(e.target.value)}
                    placeholder="مثال: 3150000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-rose-600 outline-none focus:border-[#8D6A28] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>نسبة الخصم (%)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-[#8D6A28] focus:bg-white"
                  />
                </div>
              </div>

              {/* Preset Badges */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نماذج سريعة لشارة الخصم:</label>
                <div className="flex flex-wrap gap-1.5">
                  {BADGE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        offerBadge === preset
                          ? 'bg-[#8D6A28] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offer Badge & Custom Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نص الشارة المعروضة على الصورة</label>
                  <input
                    type="text"
                    value={offerBadge}
                    onChange={(e) => setOfferBadge(e.target.value)}
                    placeholder="مثال: خصم 15%"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان / وصف العرض (اختياري)</label>
                  <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    placeholder="مثال: عرض حصري لفترة محدودة"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28] focus:bg-white"
                  />
                </div>
              </div>

              {/* Date Ranges (Start & End) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <Calendar className="w-4 h-4 text-[#8D6A28]" />
                  <span>فترة سريان العرض (بين تاريخين)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ بداية العرض</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#8D6A28]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ نهاية العرض (تاريخ الانتهاء)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#8D6A28]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Eye className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>معاينة العرض كما سيظهر للزوار في الموقع:</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                    previewOfferInfo.isActive
                      ? 'bg-emerald-600 text-white'
                      : previewOfferInfo.status === 'upcoming'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-white'
                  }`}>
                    {previewOfferInfo.statusLabel}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 text-white font-extrabold text-xs shadow-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      {previewOfferInfo.badgeText || 'عرض خاص'}
                    </span>
                    {previewOfferInfo.remainingText && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {previewOfferInfo.remainingText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="line-through text-xs font-bold text-slate-400">
                      {originalPrice.toLocaleString('ar-EG')} ج.م
                    </span>
                    <span className="text-base font-black text-rose-600">
                      {previewOfferInfo.offerPrice.toLocaleString('ar-EG')} ج.م
                    </span>
                    {previewOfferInfo.savingsAmount > 0 && (
                      <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                        وفر {previewOfferInfo.savingsAmount.toLocaleString('ar-EG')} ج.م
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {hasOffer && (
            <button
              type="button"
              onClick={handleRemoveOffer}
              className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>إلغاء العرض</span>
            </button>
          )}

          <div className="flex items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-[#0F172A] hover:bg-[#8D6A28] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات وتطبيق العرض</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
