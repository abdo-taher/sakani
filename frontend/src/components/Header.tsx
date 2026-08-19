import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SakaniLogo } from './SakaniLogo';
import { ActiveTab } from './BottomNav';
import { NotificationCenter } from './NotificationCenter';
import { StorageService } from '../services/storageService';
import { 
  Heart, 
  User, 
  Menu, 
  X, 
  Phone, 
  ShieldCheck, 
  LogOut,
  Building2,
  HelpCircle,
  ShoppingBag,
  CalendarCheck,
  MapPin,
  Smartphone
} from 'lucide-react';
import { usePWAInstall } from '../utils/pwaInstall';

interface HeaderProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  favoritesCount: number;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenNeedModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenNeedModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstalled, installApp } = usePWAInstall();
  const [liveFavoritesCount, setLiveFavoritesCount] = useState<number>(() => {
    try {
      return StorageService.getFavorites().length;
    } catch {
      return favoritesCount || 0;
    }
  });

  useEffect(() => {
    if (typeof favoritesCount === 'number') {
      setLiveFavoritesCount(favoritesCount);
    }
  }, [favoritesCount]);

  const displayCount = typeof favoritesCount === 'number' && favoritesCount > 0 
    ? favoritesCount 
    : (liveFavoritesCount > 0 ? liveFavoritesCount : (typeof StorageService !== 'undefined' && StorageService.getFavorites ? StorageService.getFavorites().length : 0));

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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const settings = (typeof StorageService !== 'undefined' && StorageService.getSettings)
    ? StorageService.getSettings()
    : { phone: '01067725976', announcement_text: 'أكبر سوق عقاري موثوق في دمياط الجديدة • معاينات مجانية واستشارات هندسية', announcement_enabled: true };

  const phone = settings.phone || settings.company_phone || '01067725976';
  const announcementText = settings.announcement_text || 'أكبر سوق عقاري موثوق في دمياط الجديدة • معاينات مجانية واستشارات هندسية';
  const showAnnouncement = settings.announcement_enabled !== false;

  const navLinks = [
    { id: 'home' as ActiveTab, label: 'الرئيسية', icon: Building2 },
    { id: 'search' as ActiveTab, label: 'عقارات للبيع والإيجار', icon: ShoppingBag },
    { id: 'places' as ActiveTab, label: 'دليل الأحياء', icon: MapPin },
    { id: 'reservations' as ActiveTab, label: 'حجوزاتي', icon: CalendarCheck },
    { id: 'contact' as ActiveTab, label: 'تواصل معنا', icon: Phone },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all" dir="rtl">
      {/* Top micro bar */}
      {showAnnouncement && (
        <div className="bg-[#0F172A] text-slate-300 text-xs py-1.5 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {announcementText}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              {!isInstalled && (
                <button
                  type="button"
                  onClick={installApp}
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 hover:bg-[#8D6A28] text-amber-300 hover:text-white transition font-bold text-[11px] cursor-pointer"
                  title="تثبيت التطبيق مباشرة"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>تثبيت التطبيق 📲</span>
                </button>
              )}

              <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-white transition">
                <Phone className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span dir="ltr">{phone}</span>
              </a>
              <button 
                onClick={onOpenNeedModal}
                className="text-[#8D6A28] hover:text-[#AC7F2B] font-bold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                محتاج عقار بمواصفات معينة؟
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <SakaniLogo size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              const Icon = link.icon;
              const linkPath = link.id === 'home' ? '/' : (link.id === 'search' ? '/properties' : (link.id === 'places' ? '/places' : (link.id === 'reservations' ? '/my-reservations' : '/contact')));
              return (
                <Link
                  key={link.id}
                  to={linkPath}
                  className={`px-3.5 lg:px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#8D6A28]/10 text-[#8D6A28]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#8D6A28]" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Link
              to="/need-property"
              className="px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-[#8D6A28] rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#8D6A28]" />
              طلب عقار
            </Link>
          </nav>

          {/* Right Actions / Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Favorites Icon */}
            <button
              onClick={() => onSelectTab('favorites')}
              className="relative p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#8D6A28] hover:border-[#8D6A28]/40 hover:bg-slate-50 transition-all cursor-pointer"
              title="العقارات المفضلة"
            >
              <Heart className={`w-5 h-5 ${displayCount > 0 ? 'text-[#8D6A28] fill-[#8D6A28]' : ''}`} />
              {displayCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8D6A28] text-white text-[10px] font-bold min-w-4 h-4 rounded-full flex items-center justify-center px-1 border border-white shadow-2xs">
                  {displayCount}
                </span>
              )}
            </button>

            {/* Customer Live Notifications Bell */}
            <NotificationCenter role="customer" />

            {/* User Account / Admin Badge */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectTab('account')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition cursor-pointer"
                  title="لوحة الإدارة"
                >
                  <ShieldCheck className="w-4 h-4 text-[#8D6A28]" />
                  <span className="hidden md:inline">لوحة الإدارة</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="تسجيل خروج الأدمن"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                title="تسجيل الدخول"
              >
                <User className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop for outside click */}
          <div 
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-30 md:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-40 md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1.5 shadow-2xl animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto" dir="rtl">
            {/* الرئيسية */}
            <Link
              to="/"
              onClick={() => { onSelectTab('home'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-right transition cursor-pointer ${
                currentTab === 'home' ? 'bg-[#8D6A28]/10 text-[#8D6A28]' : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-5 h-5 text-[#8D6A28]" />
              <span>الرئيسية</span>
            </Link>

            {/* عقارات للبيع والإيجار */}
            <Link
              to="/properties"
              onClick={() => { onSelectTab('search'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-right transition cursor-pointer ${
                currentTab === 'search' ? 'bg-[#8D6A28]/10 text-[#8D6A28]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5 text-[#8D6A28]" />
              <span>عقارات للبيع والإيجار بدمياط الجديدة</span>
            </Link>

            {/* حجوزاتي */}
            <Link
              to="/my-reservations"
              onClick={() => { onSelectTab('reservations'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-right transition cursor-pointer ${
                currentTab === 'reservations' ? 'bg-[#8D6A28]/10 text-[#8D6A28]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CalendarCheck className="w-5 h-5 text-[#8D6A28]" />
              <span>حجوزاتي ومتابعة الطلبات</span>
            </Link>

            {/* المفضلة */}
            <button
              onClick={() => { onSelectTab('favorites'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold text-right transition cursor-pointer ${
                currentTab === 'favorites' ? 'bg-[#8D6A28]/10 text-[#8D6A28]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>العقارات المفضلة</span>
              </div>
              {displayCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#8D6A28]/20 text-[#8D6A28] text-xs font-bold font-mono">
                  {displayCount}
                </span>
              )}
            </button>

            {/* دليل أحياء وأماكن دمياط الجديدة */}
            <Link
              to="/places"
              onClick={() => { onSelectTab('places'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-right transition cursor-pointer ${
                currentTab === 'places' ? 'bg-[#8D6A28]/10 text-[#8D6A28]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-5 h-5 text-[#8D6A28]" />
              <span>دليل أحياء وأماكن دمياط الجديدة</span>
            </Link>

            {/* تواصل معنا */}
            <Link
              to="/contact"
              onClick={() => { onSelectTab('contact'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-right transition cursor-pointer ${
                currentTab === 'contact' ? 'bg-[#8D6A28]/10 text-[#8D6A28]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-5 h-5 text-[#8D6A28]" />
              <span>من نحن وتواصل معنا</span>
            </Link>

            {/* تثبيت التطبيق مباشرة */}
            {!isInstalled && (
              <button
                onClick={() => { installApp(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-right transition cursor-pointer bg-blue-50/70 text-blue-800 border border-blue-100 hover:bg-blue-100/70"
              >
                <Smartphone className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="block leading-tight">تثبيت التطبيق على الجوال 📲</span>
                  <span className="text-[10px] text-blue-600 font-medium">تثبيت فوري ومباشر على الشاشة الرئيسية</span>
                </div>
              </button>
            )}

            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 font-bold text-slate-700">
                <Phone className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span dir="ltr">{phone}</span>
              </a>
              <span className="text-[#8D6A28] font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">عمولة 2.5% فقط</span>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
