import React, { useState, useEffect } from 'react';
import { Property, DetailedRoom, InquiryReservation } from '../types';
import { StorageService, normalizePhoneNumber } from '../services/storageService';
import { ApiService } from '../services/apiService';
import confetti from 'canvas-confetti';
import { 
  X, 
  CalendarCheck, 
  CheckCircle2, 
  Phone, 
  User, 
  MessageSquare,
  Building2,
  MapPin,
  Clock,
  AlertTriangle,
  MessageCircle,
  DoorOpen,
  Check,
  Loader2
} from 'lucide-react';

interface InquiryModalProps {
  property: Property | null;
  selectedRoom?: DetailedRoom;
  isOpen: boolean;
  onClose: () => void;
  onRefreshInquiries?: () => void;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  property,
  selectedRoom,
  isOpen,
  onClose,
  onRefreshInquiries,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isDuplicateReserved, setIsDuplicateReserved] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeReservation, setActiveReservation] = useState<InquiryReservation | null>(null);

  // Reset state when opening modal or changing selected room
  useEffect(() => {
    if (isOpen) {
      setIsDuplicateReserved(false);
      setDuplicateMessage(null);
      setErrorMessage(null);
      setActiveReservation(null);
      setIsSuccess(false);
    }
  }, [isOpen, selectedRoom]);

  if (!isOpen || !property) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  // Perform real-time duplicate reservation checking
  const performDuplicateCheck = async (rawPhoneInput: string) => {
    const cleanPhone = normalizePhoneNumber(rawPhoneInput);
    if (!cleanPhone || cleanPhone.length < 10) {
      setIsDuplicateReserved(false);
      setDuplicateMessage(null);
      return;
    }

    setIsCheckingPhone(true);

    try {
      const propIdNumber = parseInt(property.id.replace(/\D/g, ''), 10) || 1;
      const roomIdNumber = selectedRoom ? (parseInt(selectedRoom.id.replace(/\D/g, ''), 10) || null) : null;

      // 1. Check with Backend API
      const res = await ApiService.checkReservation(propIdNumber, cleanPhone, roomIdNumber);

      if (res && (res.reserved === true || res.is_same_customer === true)) {
        setIsDuplicateReserved(true);
        const msg = selectedRoom
          ? 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل'
          : 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل';
        setDuplicateMessage(res.message || msg);
        if (res.active_reservation) {
          setActiveReservation(res.active_reservation);
        }
        setIsCheckingPhone(false);
        return;
      }
    } catch (err: any) {
      // Backend check fallback to local storage check
    }

    // 2. Check with Local StorageService
    const localCheck = StorageService.isPropertyEligibleToReserve(
      property.id, 
      cleanPhone, 
      selectedRoom?.id
    );

    if (!localCheck.allowed && localCheck.isDuplicate) {
      setIsDuplicateReserved(true);
      const msg = selectedRoom
        ? 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل'
        : 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل';
      setDuplicateMessage(localCheck.reason || msg);
      if (localCheck.activeInquiry) {
        setActiveReservation(localCheck.activeInquiry);
      }
    } else {
      setIsDuplicateReserved(false);
      setDuplicateMessage(null);
    }

    setIsCheckingPhone(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (errorMessage) setErrorMessage(null);

    const clean = normalizePhoneNumber(val);
    if (clean.length >= 11) {
      performDuplicateCheck(val);
    } else {
      if (isDuplicateReserved) {
        setIsDuplicateReserved(false);
        setDuplicateMessage(null);
      }
    }
  };

  const handlePhoneBlur = () => {
    if (phone.trim()) {
      performDuplicateCheck(phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isDuplicateReserved) return;

    setErrorMessage(null);
    setActiveReservation(null);

    if (!name.trim() || !phone.trim()) {
      setErrorMessage('يرجى إدخال الاسم ورقم الهاتف للتواصل');
      return;
    }

    setIsSubmitting(true);

    const messageText = `${preferredDate ? `الموعد المفضل: ${preferredDate}. ` : ''}${notes ? `ملاحظات: ${notes}` : ''}`.trim();

    // 1. Try Backend API first if property id is numeric or backend exists
    let backendError: string | null = null;
    let backendActiveRes: any = null;

    try {
      const propIdNumber = parseInt(property.id.replace(/\D/g, ''), 10) || 1;
      const roomIdNumber = selectedRoom ? (parseInt(selectedRoom.id.replace(/\D/g, ''), 10) || null) : null;

      await ApiService.createReservation({
        property_id: propIdNumber,
        room_id: roomIdNumber,
        name: name.trim(),
        phone: phone.trim(),
        message: messageText,
      });
    } catch (err: any) {
      if (err?.status === 409 || err?.status === 422 || err?.data?.error_code) {
        backendError = err?.data?.message || err.message;
        backendActiveRes = err?.data?.active_reservation;
        if (err?.data?.error_code === 'DUPLICATE_RESERVATION' || err?.status === 409) {
          setIsDuplicateReserved(true);
          setDuplicateMessage(
            selectedRoom 
              ? 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل' 
              : 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل'
          );
        }
      }
    }

    if (backendError) {
      setIsSubmitting(false);
      setErrorMessage(backendError);
      if (backendActiveRes) {
        setActiveReservation(backendActiveRes);
      }
      return;
    }

    // 2. Also register in StorageService for local UI state sync
    const result = StorageService.addInquiry({
      property_id: property.id,
      property_title: property.title,
      property_ref: property.ref_id,
      room_id: selectedRoom?.id,
      room_name: selectedRoom?.name,
      client_name: name.trim(),
      client_phone: phone.trim(),
      message: messageText,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message || 'لا يمكن تقديم حجز جديد في الوقت الحالي');
      if (result.activeInquiry) {
        setActiveReservation(result.activeInquiry);
      }
      if (result.activeInquiry && normalizePhoneNumber(result.activeInquiry.client_phone) === normalizePhoneNumber(phone)) {
        setIsDuplicateReserved(true);
        setDuplicateMessage(
          selectedRoom 
            ? 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل' 
            : 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل'
        );
      }
      return;
    }

    // Success flow - Record client reservation for persistent immediate UI disabling
    StorageService.recordClientReservation(
      property.id, 
      selectedRoom?.id, 
      phone.trim()
    );

    // Dispatch global event for instant reactive button update
    window.dispatchEvent(new CustomEvent('sakani_reservation_created', {
      detail: {
        propertyId: property.id,
        roomId: selectedRoom?.id,
      }
    }));

    try {
      confetti({
        particleCount: 65,
        spread: 65,
        origin: { y: 0.7 }
      });
    } catch {}

    setIsSuccess(true);
    if (onRefreshInquiries) onRefreshInquiries();

    setTimeout(() => {
      setIsSuccess(false);
      setName('');
      setPhone('');
      setNotes('');
      setPreferredDate('');
      setIsDuplicateReserved(false);
      setDuplicateMessage(null);
      onClose();
    }, 3000);
  };

  const handleContactWhatsAppForExisting = () => {
    const refCode = activeReservation?.property_ref || property.ref_id;
    const roomStr = selectedRoom ? ` - غرفة (${selectedRoom.name})` : '';
    const text = encodeURIComponent(
      `السلام عليكم، لدي طلب حجز قائم للعقار كود (${refCode})${roomStr} وأود الاستفسار عن حالته أو تأكيد موعد المعاينة.`
    );
    window.open(`https://wa.me/201067725976?text=${text}`, '_blank');
  };

  const targetPrice = selectedRoom ? selectedRoom.price : property.price;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-4" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#8D6A28]/20 flex items-center justify-center text-[#8D6A28]">
              {selectedRoom ? <DoorOpen className="w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {selectedRoom ? `حجز غرفة (${selectedRoom.name})` : 'طلب معاينة وحجز العقار'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">كود العقار: {property.ref_id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900">تم تسجيل طلب الحجز بنجاح!</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                تم تسجيل طلبك {selectedRoom ? `لغرفة "${selectedRoom.name}" في` : 'لعقار'} كود <strong>{property.ref_id}</strong>. سيتواصل معك مستشارك العقاري في أقرب وقت لتأكيد موعد المعاينة.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 font-medium">
                تنبيه: يمكنك متابعة حالة الحجز أو تعديل موعدك عبر الواتساب المباشر.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Property & Room Summary Strip */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={selectedRoom?.imageUrl || property.images[0]}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{property.title}</h4>
                  {selectedRoom && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                        الغرفة: {selectedRoom.name}
                      </span>
                      {selectedRoom.area && (
                        <span className="text-[10px] text-slate-400 font-mono">{selectedRoom.area} م²</span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#8D6A28]" />
                    <span>{property.district_name}</span>
                  </p>
                  <p className="text-xs font-black text-[#8D6A28] mt-1">
                    {formatPrice(targetPrice)} ج.م
                    {property.operation_type === 'rent' && <span className="text-[10px] text-slate-400 font-normal mr-1">/ شهر</span>}
                  </p>
                </div>
              </div>

              {/* Duplicate Reservation Alert Banner */}
              {isDuplicateReserved && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black text-xs text-amber-900">
                        {duplicateMessage || (selectedRoom ? 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل' : 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل')}
                      </h5>
                      <p className="text-xs leading-relaxed text-amber-800 mt-1">
                        طلب الحجز الخاص برقم الهاتف هذا قيد المراجعة حالياً. لا حاجة لإرسال طلب آخر.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/80">
                    <button
                      type="button"
                      onClick={handleContactWhatsAppForExisting}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>متابعة حالة الحجز الحالي عبر واتساب</span>
                    </button>
                  </div>
                </div>
              )}

              {/* General Error Message Banner */}
              {errorMessage && !isDuplicateReserved && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2 text-xs animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Client Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الاسم بالكامل *
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد طاهر"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                  />
                </div>
              </div>

              {/* Client Phone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    رقم الهاتف للتواصل والواتساب *
                  </label>
                  {isCheckingPhone && (
                    <span className="text-[10px] text-[#8D6A28] flex items-center gap-1 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>جاري التحقق من الحجز...</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    dir="ltr"
                    required
                    placeholder="010XXXXXXXX"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    className={`w-full pr-10 pl-4 py-3 rounded-xl border bg-slate-50 text-sm font-bold text-slate-900 focus:bg-white outline-none transition text-right ${
                      isDuplicateReserved 
                        ? 'border-amber-400 focus:border-amber-500 bg-amber-50/20' 
                        : 'border-slate-200 focus:border-[#8D6A28]'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * سيتم تسجيل طلبك والتواصل لتحديد موعد المعاينة وتثبيت الحجز.
                </span>
              </div>

              {/* Preferred Preview Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الموعد المفضل للمعاينة (اختياري)
                </label>
                <div className="relative">
                  <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="مثال: الجمعة القادمة بعد العصر"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات أو تفاصيل إضافية (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="أي استفسار حول التفاوض، التشطيب، أو طريقة الدفع..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:border-[#8D6A28] outline-none transition"
                ></textarea>
              </div>

              {/* Submit Button */}
              {isDuplicateReserved ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>تم إرسال طلب الحجز بالفعل</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isCheckingPhone}
                  className="w-full py-3.5 rounded-xl gold-gradient gold-gradient-hover text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التحقق والتسجيل...</span>
                    </>
                  ) : (
                    <span>تأكيد إرسال طلب الحجز</span>
                  )}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
