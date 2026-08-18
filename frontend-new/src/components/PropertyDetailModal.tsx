import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Property, DetailedRoom } from '../types';
import { StorageService } from '../services/storageService';
import { AMENITIES_LIST } from '../data/mockData';
import { getAmenityDisplay } from '../utils/amenities';
import { PropertyMultiVideoPlayer } from './PropertyMultiVideoPlayer';
import { FALLBACK_PROPERTY_IMAGE, resolveImageUrl } from '../utils/media';
import { 
  X, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize2, 
  Layers, 
  Heart, 
  Share2, 
  Phone, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  CalendarCheck, 
  ArrowUpDown, 
  Flame, 
  ShieldCheck, 
  Car, 
  AirVent, 
  Waves, 
  Trees, 
  Eye, 
  Utensils, 
  Sun, 
  Wifi,
  DoorOpen,
  Map as MapIcon,
  Calculator,
  CheckCheck,
  Building,
  Clock,
  ArrowRight,
  FileText,
  Play,
  Lock,
  Tag,
  Play,
  Compass
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property | null;
  allProperties: Property[];
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenInquiry: (property: Property, selectedRoom?: DetailedRoom) => void;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  elevator: <ArrowUpDown className="w-4 h-4 text-[#8D6A28]" />,
  natural_gas: <Flame className="w-4 h-4 text-[#8D6A28]" />,
  super_lux: <Sparkles className="w-4 h-4 text-[#8D6A28]" />,
  security: <ShieldCheck className="w-4 h-4 text-[#8D6A28]" />,
  parking: <Car className="w-4 h-4 text-[#8D6A28]" />,
  ac: <AirVent className="w-4 h-4 text-[#8D6A28]" />,
  pool: <Waves className="w-4 h-4 text-[#8D6A28]" />,
  garden: <Trees className="w-4 h-4 text-[#8D6A28]" />,
  sea_view: <Eye className="w-4 h-4 text-[#8D6A28]" />,
  equipped_kitchen: <Utensils className="w-4 h-4 text-[#8D6A28]" />,
  balcony: <Sun className="w-4 h-4 text-[#8D6A28]" />,
  internet: <Wifi className="w-4 h-4 text-[#8D6A28]" />,
};

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  allProperties,
  isFavorite,
  onClose,
  onToggleFavorite,
  onSelectProperty,
  onOpenInquiry,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mediaMode, setMediaMode] = useState<'photos' | 'video'>('photos');
  const [autoPlayVideo, setAutoPlayVideo] = useState<boolean>(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mortgage / Installment Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanYears, setLoanYears] = useState<number>(5);

  if (!property) return null;

  const images = property.images && property.images.length > 0
    ? property.images
    : [FALLBACK_PROPERTY_IMAGE];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `${property.title} - منصة سكني دمياط الجديدة`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${property.owner_phone || '01067725976'}`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `السلام عليكم، أود الاستفسار وحجز موعد معاينة للعقار (${property.ref_id}): "${property.title}" بسعر ${formatPrice(property.price)} ج.م في ${property.district_name}.`
    );
    window.open(`https://wa.me/201067725976?text=${text}`, '_blank');
  };

  // Calculator calculations
  const downPaymentAmount = (property.price * downPaymentPercent) / 100;
  const remainingAmount = property.price - downPaymentAmount;
  const totalMonths = loanYears * 12;
  // Standard simple interest estimate (e.g. 10% per annum on remaining)
  const interestRate = 0.10;
  const totalWithInterest = remainingAmount * (1 + interestRate * loanYears);
  const monthlyInstallment = totalMonths > 0 ? Math.round(totalWithInterest / totalMonths) : 0;

  // Similar properties in same district or operation type
  const similarProperties = allProperties
    .filter((p) => p.id !== property.id && (p.location_id === property.location_id || p.operation_type === property.operation_type))
    .slice(0, 4);

  const hasClientReserved = property ? StorageService.hasClientReservedProperty(property.id) : false;
  const isReservable = property ? property.status === 'available' : false;

  useEffect(() => {
    if (!property) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [property, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/75 flex justify-center items-center p-3 sm:p-4 md:p-6 transition-opacity duration-150" dir="rtl" onClick={onClose}>
      
      {/* Modal Container */}
      <div 
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden modal-animate-pop my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent sm:absolute sm:top-3 sm:right-3 sm:left-3 pointer-events-none">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-800 hover:bg-white hover:scale-110 active:scale-95 transition pointer-events-auto cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-800 hover:bg-white hover:scale-110 active:scale-95 transition cursor-pointer"
              title="مشاركة العقار"
            >
              {copiedLink ? <CheckCheck className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => onToggleFavorite(property.id)}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-slate-800 hover:text-rose-600 hover:bg-white hover:scale-110 active:scale-95 transition cursor-pointer"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Media Mode Switcher (Photos vs Video Walkthrough) */}
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
              {mediaMode === 'video' ? 'معاينة الفيديو مباشرة' : 'معرض الصور'}
            </span>
          </div>
        )}

        {/* Scrollable Content (Gallery + Details) */}
        <div className="overflow-y-auto flex-1">

        {/* Gallery / Image Slider or Video Player */}
        {mediaMode === 'video' && (property.video_url || (property.videos && property.videos.length > 0)) ? (
          <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden bg-slate-950">
            <PropertyMultiVideoPlayer
              videos={property.videos}
              videoUrl={property.video_url}
              videoThumbnailUrl={property.video_thumbnail_url}
              fallbackPoster={images[0]}
              title="فيديو المعاينة والجولة الميدانية"
              autoPlay={autoPlayVideo}
              embedded={true}
            />
          </div>
        ) : (
          <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden bg-slate-900">
            <img
              src={resolveImageUrl(images[currentImageIndex])}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
            />

            {/* Dark Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 hover:scale-110 active:scale-95 transition cursor-pointer z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 hover:scale-110 active:scale-95 transition cursor-pointer z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Bottom Indicators & Counter & Video Button */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow">
                <span>الصور</span>
                <span className="font-mono">{currentImageIndex + 1}/{images.length}</span>
              </span>

              {(property.video_url || (property.videos && property.videos.length > 0)) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMediaMode('video');
                    setAutoPlayVideo(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs transition hover:scale-105 cursor-pointer"
                  title="تشغيل فيديو الجولة"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>شاهد الفيديو ({property.videos?.length || 1})</span>
                </button>
              )}
            </div>

            {/* Badges on bottom right */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-[#0F172A] text-white text-xs font-bold shadow">
                {property.operation_type === 'sale' ? 'للبيع' : 'للإيجار'}
              </span>
              {property.featured && (
                <span className="px-3 py-1 rounded-xl bg-[#8D6A28] text-white text-xs font-bold shadow flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  مميز
                </span>
              )}
            </div>
          </div>
        )}

        {/* Thumbnail gallery strip (Photos + Video Thumbnails) */}
        {(images.length > 1 || Boolean(property.video_url || (property.videos && property.videos.length > 0))) && (
          <div className="flex gap-2 p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
            {/* Dedicated Video Thumbnail Buttons */}
            {Array.isArray(property.videos) && property.videos.length > 0 ? (
              property.videos.filter(v => Boolean(v && (v.url || (v as any).video_url))).map((vid, idx) => (
                <button
                  key={`modal-video-${idx}`}
                  type="button"
                  onClick={() => {
                    setMediaMode('video');
                    setAutoPlayVideo(true);
                  }}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer group/vid ${
                    mediaMode === 'video'
                      ? 'border-[#8D6A28] scale-105 shadow-sm ring-2 ring-[#8D6A28]/30'
                      : 'border-amber-300/80 bg-slate-900 hover:border-[#8D6A28]'
                  }`}
                  title={vid.title || `فيديو ${idx + 1}`}
                >
                  <PropertyVideoThumbnail
                    videoUrl={vid.url || (vid as any).video_url}
                    thumbnailUrl={vid.thumbnail_url || property.video_thumbnail_url}
                    fallbackImage={images[0]}
                    alt={vid.title || 'فيديو المعاينة'}
                    playBadgeSize="sm"
                    className="w-full h-full"
                    label={property.videos!.length > 1 ? `فيديو ${idx + 1}` : 'فيديو'}
                    active={mediaMode === 'video'}
                  />
                </button>
              ))
            ) : property.video_url ? (
              <button
                type="button"
                onClick={() => {
                  setMediaMode('video');
                  setAutoPlayVideo(true);
                }}
                className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer group/vid ${
                  mediaMode === 'video'
                    ? 'border-[#8D6A28] scale-105 shadow-sm ring-2 ring-[#8D6A28]/30'
                    : 'border-amber-300/80 bg-slate-900 hover:border-[#8D6A28]'
                }`}
                title="فيديو المعاينة"
              >
                <PropertyVideoThumbnail
                  videoUrl={property.video_url}
                  thumbnailUrl={property.video_thumbnail_url}
                  fallbackImage={images[0]}
                  alt="فيديو المعاينة"
                  playBadgeSize="sm"
                  className="w-full h-full"
                  label="فيديو"
                  active={mediaMode === 'video'}
                />
              </button>
            ) : null}

            {/* Photo Thumbnails */}
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMediaMode('photos');
                  setCurrentImageIndex(idx);
                }}
                className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                  mediaMode === 'photos' && idx === currentImageIndex 
                    ? 'border-[#8D6A28] scale-105 shadow-sm' 
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={resolveImageUrl(img)} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-5 sm:p-8 space-y-8">

          {/* Title & Price Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8D6A28] bg-[#8D6A28]/10 px-3 py-1 rounded-lg w-fit mb-3">
              رقم الكود: {property.ref_id}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug mb-3">
              {property.title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium mb-4">
              <MapPin className="w-4 h-4 text-[#8D6A28] shrink-0" />
              <span>{property.district_name}</span>
              {property.address_detail && (
                <span className="text-slate-400">({property.address_detail})</span>
              )}
            </div>

            {/* Price section */}
            <div className="flex flex-wrap items-baseline justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0F172A]">
                  {formatPrice(property.price)}
                </span>
                <span className="text-lg font-bold text-[#8D6A28]">
                  ج.م
                </span>
                {property.operation_type === 'rent' && (
                  <span className="text-sm text-slate-500 font-medium">/ شهر</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {property.is_negotiable && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                    السعر قابل للتفاوض
                  </span>
                )}
                {property.operation_type === 'sale' && (
                  <button
                    onClick={() => setShowCalculator(!showCalculator)}
                    className="text-xs font-bold text-[#8D6A28] bg-[#8D6A28]/10 hover:bg-[#8D6A28]/20 px-3 py-1.5 rounded-xl border border-[#8D6A28]/30 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>حاسبة الأقساط</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mortgage / Installment Calculator (Expandable) */}
          {showCalculator && property.operation_type === 'sale' && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#8D6A28] text-white flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">حاسبة التقسيط والتمويل العقاري التقديرية</h3>
                    <p className="text-[11px] text-slate-500">حساب تقريبي للمقدم والقسط الشهري بناءً على سعر العقار</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalculator(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs"
                >
                  إغلاق ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نسبة المقدم: {downPaymentPercent}% ({formatPrice(downPaymentAmount)} ج.م)
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full accent-[#8D6A28] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مدة السداد: {loanYears} سنوات ({totalMonths} شهر)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={loanYears}
                    onChange={(e) => setLoanYears(Number(e.target.value))}
                    className="w-full accent-[#8D6A28] cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-amber-200/60 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 block">المبلغ المتبقي</span>
                  <span className="font-extrabold text-slate-900 text-sm">{formatPrice(remainingAmount)} ج.م</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">المقدم المطلوب</span>
                  <span className="font-extrabold text-[#8D6A28] text-sm">{formatPrice(downPaymentAmount)} ج.م</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 block">القسط الشهري التقديري</span>
                  <span className="font-black text-emerald-700 text-base">{formatPrice(monthlyInstallment)} ج.م/شهر</span>
                </div>
              </div>
            </div>
          )}

          {/* Key Specifications Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-3">المواصفات الأساسية</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <Maximize2 className="w-6 h-6 text-[#8D6A28] mb-1.5" />
                <span className="text-lg font-black text-slate-900">{property.area} م²</span>
                <span className="text-xs text-slate-500 mt-0.5">المساحة الإجمالية</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <BedDouble className="w-6 h-6 text-[#8D6A28] mb-1.5" />
                <span className="text-lg font-black text-slate-900">{property.rooms}</span>
                <span className="text-xs text-slate-500 mt-0.5">غرف نوم</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <Bath className="w-6 h-6 text-[#8D6A28] mb-1.5" />
                <span className="text-lg font-black text-slate-900">{property.bathrooms}</span>
                <span className="text-xs text-slate-500 mt-0.5">حمامات</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <Layers className="w-6 h-6 text-[#8D6A28] mb-1.5" />
                <span className="text-lg font-black text-slate-900">{property.floor !== undefined ? `الدور ${property.floor}` : '—'}</span>
                <span className="text-xs text-slate-500 mt-0.5">الطابق</span>
              </div>
            </div>
          </div>

          {/* Secondary Specifications Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 mb-3">تفاصيل إضافية</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center justify-between p-2 bg-white rounded-xl">
                <span className="text-slate-500">نوع العقار:</span>
                <span className="font-extrabold text-slate-900">
                  {property.property_type === 'apartment' ? 'شقة سكنية' : property.property_type === 'villa' ? 'فيلا مستقلة' : property.property_type === 'duplex' ? 'دوبلكس' : property.property_type === 'shop' ? 'محل تجاري' : property.property_type === 'office' ? 'مكتب إداري' : 'أرض / أخرى'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded-xl">
                <span className="text-slate-500">التشطيب:</span>
                <span className="font-extrabold text-slate-900">
                  {property.finishing === 'super_lux' ? 'سوبر لوكس' : property.finishing === 'lux' ? 'لوكس' : property.finishing === 'semi_finished' ? 'نصف تشطيب' : 'طوب أحمر'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded-xl">
                <span className="text-slate-500">الفرش:</span>
                <span className="font-extrabold text-slate-900">
                  {property.furnishing === 'furnished' ? 'مفروش بالكامل' : 'غير مفروش'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded-xl">
                <span className="text-slate-500">البلكونات:</span>
                <span className="font-extrabold text-slate-900">{property.balconies || 1}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded-xl">
                <span className="text-slate-500">حالة الوحدة:</span>
                <span className="font-extrabold text-emerald-700">جاهزة للتسليم</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded-xl">
                <span className="text-slate-500">تاريخ الإعلان:</span>
                <span className="font-extrabold text-slate-900">{new Date(property.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </div>

          {/* Description Section with expandable toggle */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8D6A28]" />
              <span>الوصف الشامل</span>
            </h3>
            <p className={`text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line ${
              isDescExpanded ? '' : 'line-clamp-4'
            }`}>
              {property.description}
            </p>
            {property.description.length > 140 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="mt-2 text-xs font-bold text-[#8D6A28] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {isDescExpanded ? 'عرض أقل ↑' : 'قراءة الوصف كاملاً ↓'}
              </button>
            )}
          </div>

          {/* Detailed Rooms (If available in rent mode) */}
          {property.has_detailed_rooms && property.detailed_rooms && property.detailed_rooms.length > 0 && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-[#8D6A28]" />
                الغرف المتاحة للحجز بشكل مستقل
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {property.detailed_rooms.map((room) => (
                  <div 
                    key={room.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 hover:border-[#8D6A28] transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">{room.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          room.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {room.status === 'available' ? 'متاح' : 'محجوز'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{room.description}</p>
                      <p className="text-sm font-black text-[#8D6A28] mt-1.5">{formatPrice(room.price)} ج.م / شهر</p>
                    </div>

                    {room.status === 'available' && (
                      <button
                        onClick={() => onOpenInquiry(property, room)}
                        className="px-3.5 py-2 rounded-xl bg-[#8D6A28] text-white text-xs font-bold hover:bg-[#AC7F2B] transition cursor-pointer shrink-0"
                      >
                        احجز الغرفة
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities & Features (المميزات) */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">المميزات والمرافق</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((rawAmenity, idx) => {
                  const display = getAmenityDisplay(rawAmenity);

                  return (
                    <div 
                      key={display.id || idx}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm font-bold text-slate-800"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#8D6A28]/10 flex items-center justify-center shrink-0">
                        {display.icon}
                      </div>
                      <span className="truncate">{display.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {property.tags && property.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {property.tags.map((tag: any, i) => {
                const tagLabel = typeof tag === 'string' ? tag : (tag?.name || String(tag || ''));
                if (!tagLabel) return null;
                return (
                  <span key={i} className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                    #{tagLabel}
                  </span>
                );
              })}
            </div>
          )}

          {/* Location Preview Box with Direct Google Maps Link */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-3">الموقع والحي</h3>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-6 text-center shadow-inner">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#8D6A28]/10 text-[#8D6A28] flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">{property.district_name}</h4>
                <p className="text-xs text-slate-500">
                  دمياط الجديدة — موقع استراتيجي قريب من المحاور الرئيسية، الجامعات، والخدمات والمساحات الخضراء.
                </p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`دمياط الجديدة ${property.district_name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  <MapIcon className="w-4 h-4 text-[#8D6A28]" />
                  <span>فتح الموقع المباشر على خريطة جوجل</span>
                </a>
              </div>
            </div>
          </div>

          {/* Similar Properties (عقارات مشابهة) */}
          {similarProperties.length > 0 && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">عقارات مشابهة قد تهمك</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {similarProperties.map((simProp) => (
                  <div
                    key={simProp.id}
                    onClick={() => {
                      onSelectProperty(simProp);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex gap-3.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={resolveImageUrl(simProp.images[0])}
                      alt={simProp.title}
                      className="w-24 h-20 rounded-xl object-cover shrink-0"
                      onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                    />
                    <div className="flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{simProp.title}</h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{simProp.district_name}</p>
                      </div>
                      <p className="font-black text-[#8D6A28] text-sm">
                        {formatPrice(simProp.price)} ج.م
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        </div>
        {/* End Scrollable Content */}

        {/* Sticky Action Bottom Bar */}
        <div className="sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:px-8 shadow-2xl flex items-center justify-between gap-3 shrink-0">
          
          <div className="hidden sm:block">
            <span className="text-xs text-slate-500 block">السعر المطلوب</span>
            <span className="text-xl font-black text-[#0F172A]">
              {formatPrice(property.price)} <span className="text-xs text-[#8D6A28]">ج.م</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none justify-end">
            <button
              onClick={handleWhatsApp}
              className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
              title="محادثة واتساب"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب</span>
            </button>

            <button
              onClick={handleCall}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="اتصال هاتفي"
            >
              <Phone className="w-4 h-4 text-[#8D6A28]" />
              <span className="hidden sm:inline">اتصال</span>
            </button>

            {hasClientReserved ? (
              <button
                disabled
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none"
              >
                <Check className="w-4 h-4 text-amber-600" />
                <span>قمت بالحجز مسبقاً</span>
              </button>
            ) : isReservable ? (
              <button
                onClick={() => onOpenInquiry(property)}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-white gold-gradient gold-gradient-hover font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>طلب معاينة / حجز</span>
              </button>
            ) : (
              <button
                disabled
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-200 text-slate-500 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>غير متاح للحجز ({property.status === 'sold' ? 'تم البيع' : property.status === 'rented' ? 'تم التأجير' : 'محجوز'})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
