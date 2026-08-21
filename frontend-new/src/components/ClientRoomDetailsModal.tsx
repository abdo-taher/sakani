import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DetailedRoom, Property } from '../types';
import { resolveImageUrl, FALLBACK_PROPERTY_IMAGE } from '../utils/media';
import { 
  X, 
  DoorOpen, 
  Maximize2, 
  CalendarCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Play, 
  ChevronRight, 
  ChevronLeft,
  BedDouble,
  Bath,
  Wind
} from 'lucide-react';

const formatPrice = (p: number | string | undefined | null) => {
  if (p === undefined || p === null) return '0';
  const num = typeof p === 'number' ? p : parseFloat(String(p));
  if (isNaN(num)) return '0';
  return num.toLocaleString('ar-EG');
};

interface ClientRoomDetailsModalProps {
  room: DetailedRoom | null;
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onBookRoom: (room: DetailedRoom) => void;
  isAlreadyReserved?: boolean;
}

export const ClientRoomDetailsModal: React.FC<ClientRoomDetailsModalProps> = ({
  room,
  property,
  isOpen,
  onClose,
  onBookRoom,
  isAlreadyReserved = false,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'photos' | 'video'>('photos');

  if (!isOpen || !room) return null;

  // Extract all photos for this room
  const roomImages: string[] = [];
  if (room.imageUrl) roomImages.push(room.imageUrl);
  if (Array.isArray(room.images)) {
    room.images.forEach(img => {
      if (img && !roomImages.includes(img)) roomImages.push(img);
    });
  }
  if (Array.isArray(room.media)) {
    room.media.forEach(m => {
      if (m.media_type === 'image' && m.image_url && !roomImages.includes(m.image_url)) {
        roomImages.push(m.image_url);
      }
    });
  }
  if (roomImages.length === 0) {
    if (property.images && property.images.length > 0) {
      roomImages.push(property.images[0]);
    } else {
      roomImages.push(FALLBACK_PROPERTY_IMAGE);
    }
  }

  // Extract video if available
  const roomVideos: string[] = [];
  if (Array.isArray(room.videos)) {
    room.videos.forEach(v => { if (v) roomVideos.push(v); });
  }
  if (Array.isArray(room.media)) {
    room.media.forEach(m => {
      if (m.media_type === 'video' && m.image_url && !roomVideos.includes(m.image_url)) {
        roomVideos.push(m.image_url);
      }
    });
  }

  const roomAreaNum = typeof room.area === 'number' ? room.area : parseFloat(String(room.area || ''));
  const hasValidArea = !isNaN(roomAreaNum) && roomAreaNum > 0;

  const roomPriceNum = typeof room.price === 'number' ? room.price : parseFloat(String(room.price || ''));
  const hasValidPrice = !isNaN(roomPriceNum) && roomPriceNum > 0;

  const isAvail = room.status === 'available';
  const isReserved = room.status === 'reserved';
  const isRented = room.status === 'rented';

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#8D6A28]/10 text-[#8D6A28] flex items-center justify-center shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {room.name || 'تفاصيل الغرفة'}
                </h3>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full shrink-0 ${
                  isAvail 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : isReserved 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {isAvail ? 'متاح للحجز' : isReserved ? 'محجوزة' : 'تم التأجير'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate font-medium">
                {property.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 custom-scrollbar">
          
          {/* Media Viewport */}
          <div className="space-y-2.5">
            {roomVideos.length > 0 && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setViewMode('photos')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'photos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📷 صور الغرفة ({roomImages.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('video')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'video' ? 'bg-[#8D6A28] text-white shadow-xs' : 'text-slate-600 hover:text-[#8D6A28]'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>🎬 فيديو المعاينة</span>
                </button>
              </div>
            )}

            {viewMode === 'video' && roomVideos[0] ? (
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-inner">
                <video
                  src={roomVideos[0]}
                  poster={resolveImageUrl(roomImages[0])}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
                  <img
                    src={resolveImageUrl(roomImages[activeMediaIndex] || roomImages[0])}
                    alt={room.name || 'غرفة'}
                    className="w-full h-full object-cover transition duration-300"
                    onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                  />

                  {roomImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : roomImages.length - 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition cursor-pointer"
                        title="الصورة السابقة"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setActiveMediaIndex((prev) => (prev < roomImages.length - 1 ? prev + 1 : 0))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition cursor-pointer"
                        title="الصورة التالية"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono font-bold">
                    {activeMediaIndex + 1} / {roomImages.length}
                  </div>
                </div>

                {/* Thumbnails strip */}
                {roomImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {roomImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                          idx === activeMediaIndex ? 'border-[#8D6A28] scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
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
              </div>
            )}
          </div>

          {/* Quick Specifications Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[11px] font-bold text-amber-800/80 block mb-0.5">سعر إيجار الغرفة</span>
              <p className="text-base font-black text-[#8D6A28] font-mono">
                {hasValidPrice ? `${formatPrice(roomPriceNum)} ج.م` : 'حسب الاتفاق'}
                <span className="text-[11px] font-medium text-slate-500"> / شهر</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5">المساحة الإجمالية</span>
              <p className="text-sm font-black text-slate-900 font-mono">
                {hasValidArea ? `${roomAreaNum} م²` : 'غير محددة'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5">جاهزية الحجز</span>
              <p className={`text-sm font-black ${
                isAvail ? 'text-emerald-700' : isReserved ? 'text-amber-700' : 'text-purple-700'
              }`}>
                {isAvail ? 'متاحة للحجز الآن' : isReserved ? 'محجوزة حالياً' : 'تم التأجير'}
              </p>
            </div>
          </div>

          {/* Room Description */}
          {room.description && (
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span>مواصفات وتفاصيل الغرفة</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {room.description}
              </p>
            </div>
          )}

          {/* Location & Property Context */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>تابع للعقار: <strong className="text-slate-900">{property.title}</strong></span>
            {property.district_name && (
              <span className="text-slate-500 font-medium">{property.district_name}</span>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <span className="text-xs text-slate-400 block">الإجمالي الشهري</span>
            <span className="text-lg font-black text-[#8D6A28] font-mono">
              {hasValidPrice ? `${formatPrice(roomPriceNum)} ج.م` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAlreadyReserved ? (
              <button
                disabled
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-not-allowed shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>طلب الحجز مسجل بالفعل</span>
              </button>
            ) : isAvail ? (
              <button
                onClick={() => {
                  onClose();
                  onBookRoom(room);
                }}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-black transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>احجز هذه الغرفة الآن</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-slate-100 text-slate-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>{isReserved ? 'الغرفة محجوزة' : 'تم تأجير الغرفة'}</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
