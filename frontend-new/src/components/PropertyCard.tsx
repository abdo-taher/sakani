import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { evaluatePropertyOffer } from '../utils/offerUtils';
import { FALLBACK_PROPERTY_IMAGE, resolveImageUrl } from '../utils/media';
import { 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize2, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  MessageCircle,
  Sparkles,
  Eye,
  ArrowLeft,
  Lock,
  Flame,
  Tag,
  CloudUpload,
  Loader2,
  Video,
  Play,
  Clock
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('ar-EG');

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectProperty?: (property: Property) => void;
  onQuickPreview?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = React.memo(({
  property,
  isFavorite,
  onToggleFavorite,
  onSelectProperty,
  onQuickPreview,
}) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const videoThumbnail = property.video_thumbnail_url
    || property.videos?.find((video) => Boolean(video?.thumbnail_url))?.thumbnail_url;
  const images = property.images && property.images.length > 0
    ? property.images
    : [videoThumbnail || FALLBACK_PROPERTY_IMAGE];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price: number) => {
    return currencyFormatter.format(price);
  };

  const offerInfo = evaluatePropertyOffer(property);
  const isRoomRental = property.operation_type === 'rent' && Boolean(property.has_detailed_rooms);
  
  const roomPrices = isRoomRental && property.detailed_rooms
    ? property.detailed_rooms.map((r) => r.price).filter((p) => p && p > 0)
    : [];
  
  const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : (offerInfo.isActive ? offerInfo.offerPrice : property.price);
  const availableRoomsCount = isRoomRental && property.detailed_rooms
    ? property.detailed_rooms.filter((r) => r.status === 'available').length
    : 0;

  const getOperationBadge = () => {
    if (property.operation_type === 'sale') {
      return {
        text: 'للبيع',
        bg: 'bg-slate-900 text-white',
      };
    }
    if (isRoomRental) {
      return {
        text: 'إيجار بالغرف',
        bg: 'bg-[#8D6A28] text-white',
      };
    }
    return {
      text: 'للإيجار',
      bg: 'bg-slate-800 text-white',
    };
  };

  const getStatusBadge = () => {
    if (property.status === 'sold') {
      return { text: 'تم البيع', bg: 'bg-slate-800/90 text-white' };
    }
    if (property.status === 'rented') {
      return { text: 'تم التأجير', bg: 'bg-slate-800/90 text-white' };
    }
    if (property.status === 'reserved') {
      return { text: 'محجوز', bg: 'bg-amber-800/90 text-amber-100' };
    }
    if (isRoomRental && availableRoomsCount === 0 && property.detailed_rooms && property.detailed_rooms.length > 0) {
      return { text: 'لا توجد غرف متاحة', bg: 'bg-slate-700 text-white' };
    }
    return null;
  };

  const opBadge = getOperationBadge();
  const statusBadge = getStatusBadge();

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priceText = offerInfo.isActive 
      ? `بسعر العرض الخاص ${formatPrice(offerInfo.offerPrice)} ج.م (بدلاً من ${formatPrice(offerInfo.originalPrice)} ج.م)` 
      : `بسعر ${formatPrice(property.price)} ج.م`;
    const message = encodeURIComponent(
      `مرحباً، أود الاستفسار عن العقار: "${property.title}" (كود: ${property.ref_id}) ${priceText} في ${property.district_name}. رابط العقار: ${window.location.origin}/#/properties/${property.id}`
    );
    window.open(`https://wa.me/201067725976?text=${message}`, '_blank');
  };

  const handleDetailsButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectProperty) {
      onSelectProperty(property);
    } else {
      navigate(`/properties/${property.id}`);
    }
  };

  const isUploading = Boolean(property.is_uploading);

  return (
    <div 
      onClick={() => onQuickPreview ? onQuickPreview(property) : (onSelectProperty ? onSelectProperty(property) : navigate(`/properties/${property.id}`))}
      className={`group bg-white rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col relative ${
        isUploading 
          ? 'opacity-70 grayscale-[15%] border-dashed border-amber-300 bg-amber-50/20 shadow-none' 
          : 'border-slate-200/90 hover:border-[#8D6A28]/50 shadow-2xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
      }`}
      dir="rtl"
    >
      {/* Background Upload In-Progress Banner */}
      {isUploading && (
        <div className="absolute top-0 right-0 left-0 z-30 flex items-center justify-center gap-1.5 py-1 px-3 text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-200/95 backdrop-blur-xs border-b border-amber-300 shadow-xs">
          <CloudUpload className="w-3.5 h-3.5 animate-bounce text-amber-700 shrink-0" />
          <span>جاري رفع ومعالجة الوسائط بالخلفية...</span>
          <Loader2 className="w-3 h-3 animate-spin text-amber-700 shrink-0" />
        </div>
      )}

      {/* Image Carousel Container */}
      <div className={`relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100 ${isUploading ? 'pt-6' : ''}`}>
        <img
          src={resolveImageUrl(images[currentImageIndex])}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25 pointer-events-none" />

        {/* Badges on Top Right */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex items-center gap-1 sm:gap-1.5 flex-wrap max-w-[80%]">
          {offerInfo.isActive && (
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold shadow-2xs bg-slate-900/90 backdrop-blur-md text-amber-200 flex items-center gap-1 border border-amber-400/30">
              <Flame className="w-3.5 h-3.5 text-[#D6A94E]" />
              <span>{offerInfo.badgeText}</span>
            </span>
          )}
          <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold shadow-2xs ${opBadge.bg}`}>
            {opBadge.text}
          </span>
          {property.audience_type && property.audience_type !== 'all' && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-medium shadow-2xs bg-black/60 backdrop-blur-md text-white border border-white/20">
              {property.audience_type === 'female_students'
                ? 'طالبات بنات'
                : property.audience_type === 'young_men'
                ? 'شباب وموظفون'
                : 'عائلات'}
            </span>
          )}
          {statusBadge && (
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold shadow-2xs ${statusBadge.bg}`}>
              {statusBadge.text}
            </span>
          )}
        </div>

        {/* Top Left Icons: Favorite & Featured & Video */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 flex items-center gap-1.5">
          {property.featured && (
            <span className="bg-[#8D6A28] text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-semibold shadow-2xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              مميز
            </span>
          )}

          {(property.video_url || (property.videos && property.videos.length > 0)) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/properties/${property.id}?view=video`);
              }}
              className="bg-slate-900/90 hover:bg-[#8D6A28] text-amber-300 hover:text-white border border-amber-400/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold shadow-2xs flex items-center gap-1 transition-all transform hover:scale-105 cursor-pointer backdrop-blur-md"
              title="مشاهدة فيديو المعاينة"
            >
              <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
              <span>فيديو جولة</span>
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(property.id);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-2xs flex items-center justify-center text-slate-700 hover:text-rose-600 transition-all cursor-pointer"
            title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} 
            />
          </button>
        </div>

        {/* Carousel Prev/Next Buttons (only if > 1 image) */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer"
              aria-label="الصورة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer"
              aria-label="الصورة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex ? 'w-4 bg-white shadow' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Reference Code Badge on Bottom Right of Image */}
        <div className="absolute bottom-2.5 right-3 text-[11px] font-mono font-bold text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
          {property.ref_id}
        </div>

        {/* Quick preview icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickPreview) {
              onQuickPreview(property);
            } else if (onSelectProperty) {
              onSelectProperty(property);
            } else {
              navigate(`/properties/${property.id}`);
            }
          }}
          className="absolute bottom-2.5 left-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow hover:scale-110 active:scale-95 cursor-pointer z-10"
          title="معاينة سريعة"
          aria-label="معاينة سريعة"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </button>
      </div>

      {/* Card Content Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        
        <div>
          {/* Price Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
            {offerInfo.isActive && !isRoomRental ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="line-through text-xs font-bold text-slate-400 font-mono">
                    {formatPrice(offerInfo.originalPrice)} ج.م
                  </span>
                  <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    وفر {formatPrice(offerInfo.savingsAmount)} ج.م ({offerInfo.discountPercentage}%)
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight font-mono">
                    {formatPrice(offerInfo.offerPrice)}
                  </span>
                  <span className="text-sm font-bold text-rose-600">
                    ج.م
                  </span>
                  {property.operation_type === 'rent' && (
                    <span className="text-xs text-slate-500 font-medium">
                      / شهرياً
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {isRoomRental && (
                  <span className="text-xs font-semibold text-[#8D6A28]">يبدأ من</span>
                )}
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {formatPrice(isRoomRental ? minRoomPrice : property.price)}
                </span>
                <span className="text-sm font-semibold text-[#8D6A28]">
                  ج.م
                </span>
                {property.operation_type === 'rent' && (
                  <span className="text-xs text-slate-500 font-normal">
                    {isRoomRental ? '/ للغرفة شهرياً' : '/ شهرياً'}
                  </span>
                )}
              </div>
            )}

            {isRoomRental && property.detailed_rooms && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                availableRoomsCount > 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {availableRoomsCount > 0 ? `${availableRoomsCount} غرف متاحة` : 'لا توجد غرف متاحة'}
              </span>
            )}

            {!isRoomRental && !offerInfo.isActive && property.is_negotiable && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                قابل للتفاوض
              </span>
            )}

            {offerInfo.isActive && offerInfo.remainingText && (
              <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8D6A28]" />
                <span>{offerInfo.remainingText}</span>
              </span>
            )}
          </div>

          {/* Property Title */}
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-[#8D6A28] transition-colors mb-1">
            {property.title}
          </h3>

          {/* District & Location & Proximity Distance */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-normal mb-2.5 gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#8D6A28] shrink-0" />
              <span className="truncate">{property.district_name}</span>
            </div>
            {(property as any).distance !== undefined && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-[#8D6A28] font-semibold text-[11px] font-mono border border-amber-200/80 shrink-0">
                يبعد {((property as any).distance < 1 ? Math.round((property as any).distance * 1000) + ' م' : (property as any).distance.toFixed(1) + ' كم')}
              </span>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-[11px] sm:text-xs font-medium">
            <div className="flex items-center justify-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-[#8D6A28]" />
              <span>{property.area} م²</span>
            </div>
            
            <div className="flex items-center justify-center gap-1 border-x border-slate-200/80">
              <BedDouble className="w-3.5 h-3.5 text-[#8D6A28]" />
              <span>{property.rooms} غرف</span>
            </div>

            <div className="flex items-center justify-center gap-1">
              <Bath className="w-3.5 h-3.5 text-[#8D6A28]" />
              <span>{property.bathrooms} حمام</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Full Details Button */}
        <div className="pt-2 flex items-center gap-2 mt-auto">
          <button
            onClick={handleWhatsApp}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs flex items-center justify-center cursor-pointer"
            title="تواصل عبر واتساب"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleDetailsButtonClick}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#8D6A28] text-white font-semibold text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>التفاصيل الكاملة</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
