import React from 'react';
import { Property } from '../types';
import { X, Heart, Trash2, MapPin, Maximize2, BedDouble, ChevronLeft } from 'lucide-react';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
  properties: Property[];
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  properties,
  onToggleFavorite,
  onSelectProperty,
}) => {
  if (!isOpen) return null;

  const favoriteProperties = properties.filter(p => favorites.includes(p.id));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-start" dir="rtl">
      
      {/* Drawer Container */}
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#0F172A] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">العقارات المفضلة</h3>
              <p className="text-xs text-slate-400 font-medium">({favoriteProperties.length}) عقار محفوظ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Favorite Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favoriteProperties.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">لا توجد عقارات في المفضلة</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                يمكنك الضغط على علامة القلب في أي عقار لإضافته إلى قائمة العقارات المفضلة للرجوع إليه لاحقاً.
              </p>
            </div>
          ) : (
            favoriteProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => {
                  onSelectProperty(property);
                  onClose();
                }}
                className="group p-3 rounded-2xl border border-slate-200 bg-white hover:border-[#8D6A28] hover:shadow-md transition-all cursor-pointer flex gap-3 relative"
              >
                {/* Image */}
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-24 h-24 rounded-xl object-cover shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {property.operation_type === 'sale' ? 'للبيع' : 'للإيجار'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {property.ref_id}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 mt-1 group-hover:text-[#8D6A28] transition">
                      {property.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-[#8D6A28] shrink-0" />
                      {property.district_name}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-sm font-black text-[#0F172A]">
                      {formatPrice(property.price)} <span className="text-[10px] text-[#8D6A28]">ج.م</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(property.id);
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="إزالة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {favoriteProperties.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>متابعة التصفح</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
