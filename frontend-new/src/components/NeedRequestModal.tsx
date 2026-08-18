import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import { 
  X, 
  HelpCircle, 
  CheckCircle2, 
  Phone, 
  User, 
  MapPin, 
  Wallet,
  Building2,
  Sparkles
} from 'lucide-react';

interface NeedRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeedRequestModal: React.FC<NeedRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [listingType, setListingType] = useState<'buy' | 'rent'>('buy');
  const [propertyType, setPropertyType] = useState('شقة سكنية');
  const [location, setLocation] = useState('الحي الخامس أو المتميز');
  const [budget, setBudget] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('3');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    setIsSubmitting(true);

    // 1. Try Backend API
    try {
      await ApiService.createNeedRequest({
        name: name.trim(),
        phone: phone.trim(),
        listing_type: listingType,
        property_type: propertyType,
        location: location.trim() || 'دمياط الجديدة',
        budget: Number(budget) || 0,
        area: Number(area) || undefined,
        rooms: Number(rooms) || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (e) {}

    // 2. Storage persistence
    StorageService.addNeedRequest({
      client_name: name.trim(),
      client_phone: phone.trim(),
      listing_type: listingType,
      property_type: propertyType,
      location: location.trim() || 'دمياط الجديدة',
      budget: Number(budget) || 0,
      area: Number(area) || undefined,
      rooms: Number(rooms) || undefined,
      notes: notes.trim() || undefined,
    });

    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 }
      });
    } catch {}

    setIsSubmitting(false);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setName('');
      setPhone('');
      setNotes('');
      setBudget('');
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex justify-center items-center p-4" dir="rtl">
      
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#8D6A28]/20 flex items-center justify-center text-[#8D6A28]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">محتاج عقار بمواصفات خاصة؟</h3>
              <p className="text-xs text-slate-400">سجل طلبك وسيقوم خبراؤنا بالبحث عن أفضل خيار</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">تم تسجيل طلبك بنجاح!</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                يقوم فريق سكني حالياً بالبحث بين مئات العقارات المسجلة لدينا في دمياط الجديدة وسنتواصل معك بأقرب فرصة.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Switch (شراء / إيجار) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الطلب</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setListingType('buy')}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      listingType === 'buy' ? 'bg-[#0F172A] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    عايز أشتري
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('rent')}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      listingType === 'rent' ? 'bg-[#0F172A] text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    عايز أأجر
                  </button>
                </div>
              </div>

              {/* Property Type & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العقار</label>
                  <input
                    type="text"
                    placeholder="شقة، فيلا، محل، مكتب..."
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المنطقة أو الحي المفصل</label>
                  <input
                    type="text"
                    placeholder="مثال: الحي الخامس، المتميز..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                  />
                </div>
              </div>

              {/* Budget & Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الميزانية التقريبية (ج.م)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المساحة المفضلة (م²)</label>
                  <input
                    type="number"
                    placeholder="مثال: 140"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكريم *</label>
                  <input
                    type="text"
                    required
                    placeholder="اسمك بالكامل"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none text-right"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات أو مواصفات خاصة</label>
                <textarea
                  rows={2}
                  placeholder="مثال: دور أرضي بحديقة، بحري، أسانسير، تقسيط..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none"
                ></textarea>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl gold-gradient gold-gradient-hover text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب البحث عن عقار'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
