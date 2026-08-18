import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { StorageService } from '../services/storageService';
import { evaluatePropertyOffer } from '../utils/offerUtils';
import { PropertyMultiVideoPlayer } from './PropertyMultiVideoPlayer';
import { PropertyVideoThumbnail } from './PropertyVideoThumbnail';
import { FALLBACK_PROPERTY_IMAGE, resolveImageUrl } from '../utils/media';
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
  const [mediaMode, setMediaMode] = useState<'photos' | 'video'>('photos');
  const [autoPlayVideo, setAutoPlayVideo] = useState<boolean>(false);

  // Reset state on property or modal open
  useEffect(() => {
    setCurrentImgIndex(0);
    setMediaMode('photos');
    setAutoPlayVideo(false);
  }, [property?.id, isOpen]);

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
    : [FALLBACK_PROPERTY_IMAGE];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  const offerInfo = evaluatePropertyOffer(property);
  const effectivePrice = offerInfo.isActive ? offerInfo.offerPrice : (property.price || 0);

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
  const hasClientReserved = property ? StorageService.hasClientReservedProperty(property.id) : false;
  const isReservable = property.status === 'available';

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/75 flex justify-center items-center p-3 sm:p-4 transition-opacity duration-150"
      dir="rtl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-100 modal-animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Mode Switcher (if video available) */}
        {(property.video_url || (property.videos && property.videos.length > 0)) && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl">
              <button
                type="button"
                onClick={() => setMediaMode('photos')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mediaMode === 'photos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📷 صور العقار ({images.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaMode('video');
                  setAutoPlayVideo(true);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mediaMode === 'video'
                    ? 'bg-[#8D6A28] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#8D6A28]'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>🎬 فيديو الجولة ({property.videos?.length || 1})</span>
              </button>
            </div>

            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline-block">
              {mediaMode === 'video' ? 'تشغيل الفيديو' : 'معرض الصور'}
            </span>
          </div>
        )}

        {/* Header Image with Carousel or Video Player */}
        {mediaMode === 'video' && (property.video_url || (property.videos && property.videos.length > 0)) ? (
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-950 overflow-hidden">
            <PropertyMultiVideoPlayer
              videos={property.videos}
              videoUrl={property.video_url}
              videoThumbnailUrl={property.video_thumbnail_url}
              fallbackPoster={images[0]}
              title="معاينة فيديو الجولة"
              autoPlay={autoPlayVideo}
              embedded={true}
            />
          </div>
        ) : (
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-900 overflow-hidden">
            <img
              src={resolveImageUrl(images[currentImgIndex])}
              alt={property.title}
              className="w-full h-full object-cover transition-all duration-300"
              onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
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

            {/* Bottom buttons / badges */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
              {(property.video_url || (property.videos && property.videos.length > 0)) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaMode('video');
                    setAutoPlayVideo(true);
                  }}
                  className="px-3 py-1 rounded-full bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold flex items-center gap-1.5 shadow backdrop-blur-xs transition hover:scale-105 cursor-pointer"
                  title="تشغيل فيديو المعاينة"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>فيديو الجولة</span>
                </button>
              )}
            </div>

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
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Price & Operation Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 flex-wrap">
            <div>
              <span className="text-xs text-slate-500 block">السعر المطلوب</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatPrice(effectivePrice)}
                </span>
                <span className="text-xs font-bold text-[#8D6A28]">
                  ج.م {property.operation_type === 'rent' ? '/ شهرياً' : ''}
                </span>

                {offerInfo.isActive && (
                  <span className="text-sm font-bold text-slate-400 line-through">
                    {formatPrice(property.price)} ج.م
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#0F172A] text-white">
                {property.operation_type === 'sale' ? 'للبيع' : 'للإيجار'}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                {property.property_type === 'apartment' ? 'شقة' : 'عقار'}
              </span>
            </div>
          </div>

          {/* Title & Location */}
          <div>
            <h3 id="preview-modal-title" className="text-lg font-black text-slate-900 leading-snug">
              {property.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#8D6A28] shrink-0" />
              <span>{property.district_name}</span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div>
              <Maximize2 className="w-4 h-4 text-[#8D6A28] mx-auto mb-1" />
              <span className="text-xs font-bold text-slate-900 block">{property.area} م²</span>
              <span className="text-[10px] text-slate-500">المساحة</span>
            </div>
            <div>
              <BedDouble className="w-4 h-4 text-[#8D6A28] mx-auto mb-1" />
              <span className="text-xs font-bold text-slate-900 block">{property.rooms} غرف</span>
              <span className="text-[10px] text-slate-500">الغرف</span>
            </div>
            <div>
              <Bath className="w-4 h-4 text-[#8D6A28] mx-auto mb-1" />
              <span className="text-xs font-bold text-slate-900 block">{property.bathrooms} حمام</span>
              <span className="text-[10px] text-slate-500">الحمامات</span>
            </div>
            <div>
              <Layers className="w-4 h-4 text-[#8D6A28] mx-auto mb-1" />
              <span className="text-xs font-bold text-slate-900 block">الدور {property.floor || 1}</span>
              <span className="text-[10px] text-slate-500">الطابق</span>
            </div>
          </div>

          {/* Description Snippet */}
          {property.description && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
              {property.description}
            </p>
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

              {hasClientReserved ? (
                <button
                  disabled
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed shadow-none"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>قمت بالحجز مسبقاً</span>
                </button>
              ) : isReservable ? (
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
    </div>,
    document.body
  );
};
