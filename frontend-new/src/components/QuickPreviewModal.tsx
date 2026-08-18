import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { evaluatePropertyOffer } from '../utils/offerUtils';
import { PropertyMultiVideoPlayer } from './PropertyMultiVideoPlayer';
import { 
  X, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize2, 
  Layers, 
  Heart, 
  MessageCircle, 
  Phone, 
  ArrowLeft, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  CalendarCheck,
  Lock,
  Flame,
  Clock,
  Video,
  Play
} from 'lucide-react';

interface QuickPreviewModalProps {
  property: Property | null;
  isOpen: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onOpenFullDetails?: (property: Property) => void;
  onToggleFavorite: (id: string) => void;
  onOpenInquiry: (property: Property) => void;
}

export const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
  property,
  isOpen,
  isFavorite,
  onClose,
  onOpenFullDetails,
  onToggleFavorite,
  onOpenInquiry,
}) => {
  const navigate = useNavigate();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Escape key support and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  const offerInfo = evaluatePropertyOffer(property);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priceText = offerInfo.isActive 
      ? `بسعر العرض الخاص ${formatPrice(offerInfo.offerPrice)} ج.م (بدلاً من ${formatPrice(offerInfo.originalPrice)} ج.م - وفر ${offerInfo.discountPercentage}%)`
      : `بسعر ${formatPrice(property.price)} ج.م`;
    const text = encodeURIComponent(
      `السلام عليكم، أستفسر بخصوص العقار كود (${property.ref_id}): "${property.title}" في ${property.district_name} ${priceText}.`
    );
    window.open(`https://wa.me/201067725976?text=${text}`, '_blank');
  };

  const handleGoToFullDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    if (onOpenFullDetails) {
      onOpenFullDetails(property);
    } else {
      navigate(`/properties/${property.id}`);
    }
  };

  const isRoomRental = property.operation_type === 'rent' && Boolean(property.has_detailed_rooms);
  const roomPrices = isRoomRental && property.detailed_rooms
    ? property.detailed_rooms.map((r) => r.price).filter((p) => p && p > 0)
    : [];
  const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : (offerInfo.isActive ? offerInfo.offerPrice : property.price);
  const availableRoomsCount = isRoomRental && property.detailed_rooms
    ? property.detailed_rooms.filter((r) => r.status === 'available').length
    : 0;

  const getStatusBadge = () => {
    if (property.status === 'sold') {
      return { text: 'تم البيع', bg: 'bg-rose-700 text-white' };
    }
    if (property.status === 'rented') {
      return { text: 'تم التأجير', bg: 'bg-purple-700 text-white' };
    }
    if (property.status === 'reserved') {
      return { text: 'محجوز', bg: 'bg-amber-600 text-white' };
    }
    if (isRoomRental && availableRoomsCount === 0 && property.detailed_rooms && property.detailed_rooms.length > 0) {
      return { text: 'لا توجد غرف متاحة', bg: 'bg-slate-700 text-white' };
    }
    return null;
  };

  const statusBadge = getStatusBadge();
  const isReservable = property.status === 'available';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 animate-fade-in"
      dir="rtl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image with Carousel */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-900 overflow-hidden">
          <img
            src={images[currentImgIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-all duration-300"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Close & Favorite buttons */}
          <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow text-slate-800 hover:bg-white hover:scale-110 active:scale-95 transition flex items-center justify-center cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {offerInfo.isActive && (
                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs font-black shadow flex items-center gap-1 border border-amber-300/40 animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                  <span>{offerInfo.badgeText}</span>
                </span>
              )}
              <span className="px-3 py-1 rounded-xl bg-[#0F172A] text-white text-xs font-bold shadow">
                {property.operation_type === 'sale' ? 'للبيع' : isRoomRental ? 'إيجار بالغرف' : 'للإيجار'}
              </span>
              {statusBadge && (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold shadow ${statusBadge.bg}`}>
                  {statusBadge.text}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(property.id);
                }}
                className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow flex items-center justify-center text-slate-800 hover:text-rose-600 transition cursor-pointer"
                title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex((prev) => (prev + 1) % images.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Bottom badge */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
              كود: {property.ref_id}
            </span>
            {property.featured && (
              <span className="text-xs font-bold bg-[#8D6A28] text-white px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                مميز
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 id="preview-modal-title" className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {property.title}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#8D6A28] shrink-0" />
                <span>{property.district_name}</span>
                {offerInfo.isActive && offerInfo.remainingText && (
                  <span className="mr-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{offerInfo.remainingText}</span>
                  </span>
                )}
              </p>
            </div>

            {offerInfo.isActive && !isRoomRental ? (
              <div className="flex flex-col items-start sm:items-end bg-rose-50/60 p-2.5 rounded-2xl border border-rose-200">
                <div className="flex items-center gap-2">
                  <span className="line-through text-xs font-bold text-slate-400 font-mono">
                    {formatPrice(offerInfo.originalPrice)} ج.م
                  </span>
                  <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                    وفر {formatPrice(offerInfo.savingsAmount)} ج.م ({offerInfo.discountPercentage}%)
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
                    {formatPrice(offerInfo.offerPrice)}
                  </span>
                  <span className="text-xs font-bold text-rose-600">ج.م</span>
                  {property.operation_type === 'rent' && (
                    <span className="text-[11px] text-slate-500 font-medium">/ شهر</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex-wrap">
                {isRoomRental && (
                  <span className="text-xs font-bold text-[#8D6A28]">يبدأ من</span>
                )}
                <span className="text-xl sm:text-2xl font-black text-[#0F172A]">
                  {formatPrice(isRoomRental ? minRoomPrice : property.price)}
                </span>
                <span className="text-xs font-bold text-[#8D6A28]">ج.م</span>
                {property.operation_type === 'rent' && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isRoomRental ? '/ غرفة' : '/ شهر'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <Maximize2 className="w-4 h-4 text-[#8D6A28] mb-1" />
              <span className="font-extrabold text-slate-900">{property.area} م²</span>
              <span className="text-[10px] text-slate-400">المساحة</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <BedDouble className="w-4 h-4 text-[#8D6A28] mb-1" />
              <span className="font-extrabold text-slate-900">{property.rooms}</span>
              <span className="text-[10px] text-slate-400">غرف</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <Bath className="w-4 h-4 text-[#8D6A28] mb-1" />
              <span className="font-extrabold text-slate-900">{property.bathrooms}</span>
              <span className="text-[10px] text-slate-400">حمامات</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <Layers className="w-4 h-4 text-[#8D6A28] mb-1" />
              <span className="font-extrabold text-slate-900">{property.floor !== undefined ? `الدور ${property.floor}` : '—'}</span>
              <span className="text-[10px] text-slate-400">الطابق</span>
            </div>
          </div>

          {/* Short description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            {property.description}
          </p>

          {/* Video Walkthrough (Multi-Video Supported) */}
          {(property.video_url || (property.videos && property.videos.length > 0)) && (
            <div className="pt-2">
              <PropertyMultiVideoPlayer
                videos={property.videos}
                videoUrl={property.video_url}
                videoThumbnailUrl={property.video_thumbnail_url}
                fallbackPoster={images[0]}
                title="معاينة فيديو الجولة"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleWhatsApp}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب</span>
              </button>

              {isReservable ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onOpenInquiry(property);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#8D6A28]/10 text-[#8D6A28] hover:bg-[#8D6A28] hover:text-white border border-[#8D6A28]/20 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>طلب معاينة</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{statusBadge ? statusBadge.text : 'غير متاح'}</span>
                </button>
              )}
            </div>

            <button
              onClick={handleGoToFullDetails}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-98 transition cursor-pointer"
            >
              <span>عرض تفاصيل العقار كاملة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
