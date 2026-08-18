import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Heart, 
  CalendarCheck, 
  Phone, 
  ShieldCheck 
} from 'lucide-react';
import { StorageService } from '../services/storageService';

export type ActiveTab = 'home' | 'search' | 'places' | 'sell' | 'favorites' | 'account' | 'contact' | 'reservations';

interface BottomNavProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  favoritesCount: number;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount,
  isAdmin,
}) => {
  const [liveFavoritesCount, setLiveFavoritesCount] = useState<number>(() => {
    try {
      return StorageService.getFavorites().length;
    } catch {
      return favoritesCount || 0;
    }
  });

  useEffect(() => {
    setLiveFavoritesCount(favoritesCount);
  }, [favoritesCount]);

  useEffect(() => {
    const handleFavUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setLiveFavoritesCount(e.detail.length);
      } else {
        try {
          setLiveFavoritesCount(StorageService.getFavorites().length);
        } catch {}
      }
    };

    window.addEventListener('sakani_favorites_updated', handleFavUpdate);
    window.addEventListener('storage', handleFavUpdate);
    return () => {
      window.removeEventListener('sakani_favorites_updated', handleFavUpdate);
      window.removeEventListener('storage', handleFavUpdate);
    };
  }, []);

  const formatBadgeCount = (count?: number): string | undefined => {
    if (!count || count <= 0) return undefined;
    return count > 99 ? '99+' : String(count);
  };

  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: 'الرئيسية',
      icon: Home,
    },
    {
      id: 'search' as ActiveTab,
      label: 'عقارات',
      icon: Search,
    },
    {
      id: 'reservations' as ActiveTab,
      label: 'حجوزاتي',
      icon: CalendarCheck,
    },
    {
      id: 'favorites' as ActiveTab,
      label: 'المفضلة',
      icon: Heart,
      badge: formatBadgeCount(liveFavoritesCount),
    },
    {
      id: isAdmin ? ('account' as ActiveTab) : ('contact' as ActiveTab),
      label: isAdmin ? 'لوحة الإدارة' : 'تواصل معنا',
      icon: isAdmin ? ShieldCheck : Phone,
    },
  ];

  return (
    <nav 
      aria-label="شريط التنقل السفلي"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-lg border-t border-slate-200/70 shadow-[0_-6px_24px_rgba(15,23,42,0.06)] pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 transition-all duration-200"
      dir="rtl"
    >
      <div className="max-w-md mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex-1 min-w-0 flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8D6A28]/40 select-none ${
                  isActive
                    ? 'bg-[#8D6A28]/10 text-[#8D6A28]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80'
                }`}
              >
                {/* Subtle top indicator on active tab */}
                {isActive && (
                  <span 
                    aria-hidden="true"
                    className="absolute top-0 w-5 h-[2.5px] rounded-full bg-[#8D6A28] animate-in fade-in zoom-in-75 duration-200" 
                  />
                )}

                {/* Icon with optional badge */}
                <div className="relative flex items-center justify-center mb-0.5">
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive 
                        ? 'text-[#8D6A28] stroke-[2.1] scale-105' 
                        : 'text-slate-500 stroke-[1.8]'
                    }`} 
                  />
                  {item.badge && (
                    <span 
                      aria-label={`${item.badge} عناصر`}
                      className="absolute -top-1 -right-2 bg-[#8D6A28] text-white text-[9px] font-semibold min-w-[17px] h-[17px] rounded-full flex items-center justify-center px-1 leading-none shadow-2xs border border-white"
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Tab Label */}
                <span 
                  className={`text-[10px] sm:text-[11px] leading-tight truncate max-w-full tracking-tight transition-all duration-200 ${
                    isActive 
                      ? 'font-black text-[#8D6A28]' 
                      : 'font-bold text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
