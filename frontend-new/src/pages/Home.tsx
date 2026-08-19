import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Property, 
  LocationDistrict, 
  OperationType, 
  PropertyType, 
  SystemSettings 
} from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { ActiveTab } from '../components/BottomNav';
import { 
  PropertyGridSkeleton, 
  LocationSectionSkeleton,
  StatsCardsSkeleton,
  RoomCardSkeleton
} from '../components/Skeletons';
import { QRCodeShareModal } from '../components/QRCodeShareModal';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { evaluatePropertyOffer } from '../utils/offerUtils';
import { FALLBACK_PROPERTY_IMAGE, sanitizePropertyMedia, resolveImageUrl } from '../utils/media';
import { 
  Search, 
  MapPin, 
  Home as HomeIcon, 
  Building2, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  Store, 
  ChevronLeft, 
  PlusCircle,
  Award,
  VolumeX,
  Volume2,
  BellRing,
  DoorOpen,
  Eye,
  CalendarCheck,
  Phone,
  Flame,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  HelpCircle,
  TrendingUp,
  MessageCircle,
  ArrowLeft,
  X,
  QrCode,
  Smartphone,
  Download
} from 'lucide-react';

interface HomePageProps {
  properties: Property[];
  districts: LocationDistrict[];
  favorites: string[];
  settings: SystemSettings;
  isLoading?: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onQuickPreview: (property: Property) => void;
  onSelectDistrict: (districtId: string) => void;
  onSelectCategory: (type: PropertyType) => void;
  onSelectDiscovery?: (discoveryId: string, params?: Record<string, string>) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSearchWithFilter: (filters: { operation: OperationType; district: string; type: string; maxPrice: string; mode?: string }) => void;
  onOpenNeedModal: () => void;
}

const WHY_US_ICON_MAP: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-[#8D6A28]" />,
  Award: <Award className="w-6 h-6 text-[#8D6A28]" />,
  Building2: <Building2 className="w-6 h-6 text-[#8D6A28]" />,
  Sparkles: <Sparkles className="w-6 h-6 text-[#8D6A28]" />,
};

// Default hero video URL fallback
export const DEFAULT_HERO_VIDEO_URL = "/hero.mp4?v=3";

export const HomePage: React.FC<HomePageProps> = ({
  properties,
  districts,
  favorites,
  settings,
  isLoading = false,
  onToggleFavorite,
  onSelectProperty,
  onQuickPreview,
  onSelectDistrict,
  onSelectCategory,
  onSelectDiscovery,
  onNavigateTab,
  onSearchWithFilter,
  onOpenNeedModal,
}) => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  // Hero Search Bar State
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchOperation, setSearchOperation] = useState<OperationType | 'offers'>('rent');
  const [searchDistrict, setSearchDistrict] = useState<string>('all');
  const [searchType, setSearchType] = useState<string>('all');
  const [searchRentalMode, setSearchRentalMode] = useState<string>('all');
  const [searchMaxPrice, setSearchMaxPrice] = useState<string>('');
  const [searchAudience, setSearchAudience] = useState<string>('all');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);
  const [isMobileFilterPopupOpen, setIsMobileFilterPopupOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Video states
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Best Properties category filter pill
  const [bestCategoryFilter, setBestCategoryFilter] = useState<'all' | 'rent' | 'room' | 'furnished' | 'sale'>('all');

  // Independent API Data States (Prefilled instantly from properties cache)
  const [topViewedProperties, setTopViewedProperties] = useState<Property[]>(() => properties.slice(0, 6));
  const [isLoadingTopViewed, setIsLoadingTopViewed] = useState<boolean>(() => properties.length === 0);

  const [bestPropertiesApi, setBestPropertiesApi] = useState<Property[]>(() => properties.slice(0, 8));
  const [isLoadingBestApi, setIsLoadingBestApi] = useState<boolean>(() => properties.length === 0);

  const [publicStats, setPublicStats] = useState<{
    available_properties?: number;
    locations_count?: number;
    reservations_count?: number;
    available_rooms?: number;
    total_views?: number;
    satisfaction_rate?: number;
    commission_rate?: string;
  } | null>(() => ({
    available_properties: properties.length || 24,
    locations_count: districts.length || 16,
    reservations_count: 140,
    available_rooms: 42,
    satisfaction_rate: 98,
    commission_rate: '0%',
  }));
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  // Active user session awareness
  const isAdmin = StorageService.isAdminLoggedIn();
  const clientReservations = StorageService.getClientReservations();
  const hasActiveClientReservations = !isAdmin && clientReservations.length > 0;

  // Active hero video url (from Admin CMS or default fallback)
  const heroVideoUrl = (settings.hero_use_video !== false && (settings.hero_video_url || DEFAULT_HERO_VIDEO_URL)) || '';

  // Prevent background scrolling while popup is open
  useEffect(() => {
    if (isMobileFilterPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterPopupOpen]);

  // Fetch independent homepage endpoints on mount
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch Top Viewed Properties
    ApiService.getTopViewedProperties()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => sanitizePropertyMedia({
            id: String(p.id),
            ref_id: p.ref_id || `SK-${p.id}`,
            title: p.title,
            description: p.description || '',
            price: Number(p.price) || 0,
            is_negotiable: Boolean(p.is_negotiable),
            rent_duration: p.rent_duration || 'monthly',
            operation_type: p.category?.slug === 'rent' || p.operation_type === 'rent' ? 'rent' as const : 'sale' as const,
            property_type: p.property_type?.slug || p.property_type || 'apartment',
            location_id: String(p.location_id || p.location?.id || 'district-5'),
            district_name: p.location?.name || p.district_name || 'دمياط الجديدة',
            area: Number(p.area) || 120,
            rooms: Number(p.rooms) || 3,
            bathrooms: Number(p.bathrooms) || 2,
            floor: Number(p.floor) || 1,
            balconies: Number(p.balconies) || 1,
            finishing: p.finishing || 'super_lux',
            furnishing: p.furnishing || 'unfurnished',
            audience_type: p.audience_type || 'all',
            status: p.status || 'available',
            featured: Boolean(p.featured),
            views: Number(p.cached_views || p.views) || 0,
            images: Array.isArray(p.images) && p.images.length > 0
              ? p.images.map((img: any) => typeof img === 'string' ? img : (img.image_url || img.url || img.image_path)).filter(Boolean)
              : (p.image_url ? [p.image_url] : [FALLBACK_PROPERTY_IMAGE]),
            video_url: p.video_url,
            video_thumbnail_url: p.video_thumbnail_url,
            amenities: Array.isArray(p.amenities)
              ? p.amenities.map((a: any) => typeof a === 'string' ? a : a.slug || a.name || a.id)
              : [],
            tags: Array.isArray(p.tags)
              ? p.tags.map((t: any) => typeof t === 'string' ? t : t.name)
              : [],
            has_detailed_rooms: Boolean(p.has_detailed_rooms),
            detailed_rooms: Array.isArray(p.detailed_rooms || p.detailedRooms)
              ? (p.detailed_rooms || p.detailedRooms).map((r: any) => ({
                  id: String(r.id),
                  property_id: String(p.id),
                  name: r.name,
                  price: Number(r.price),
                  area: Number(r.area),
                  description: r.description || '',
                  status: r.status || 'available',
                  imageUrl: r.room_images?.[0]?.image_url || r.primary_image?.image_url || r.imageUrl,
                  images: r.room_images?.map((img: any) => img.image_url) || [],
                }))
              : [],
            created_at: p.created_at || new Date().toISOString(),
          }));
          setTopViewedProperties(mapped);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingTopViewed(false);
      });

    // 2. Fetch Best Properties
    ApiService.getFeaturedProperties()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p: any) => sanitizePropertyMedia({
            id: String(p.id),
            ref_id: p.ref_id || `SK-${p.id}`,
            title: p.title,
            description: p.description || '',
            price: Number(p.price) || 0,
            is_negotiable: Boolean(p.is_negotiable),
            rent_duration: p.rent_duration || 'monthly',
            operation_type: p.category?.slug === 'rent' || p.operation_type === 'rent' ? 'rent' as const : 'sale' as const,
            property_type: p.property_type?.slug || p.property_type || 'apartment',
            location_id: String(p.location_id || p.location?.id || 'district-5'),
            district_name: p.location?.name || p.district_name || 'دمياط الجديدة',
            area: Number(p.area) || 120,
            rooms: Number(p.rooms) || 3,
            bathrooms: Number(p.bathrooms) || 2,
            floor: Number(p.floor) || 1,
            balconies: Number(p.balconies) || 1,
            finishing: p.finishing || 'super_lux',
            furnishing: p.furnishing || 'unfurnished',
            audience_type: p.audience_type || 'all',
            status: p.status || 'available',
            featured: Boolean(p.featured),
            views: Number(p.cached_views || p.views) || 0,
            images: Array.isArray(p.images) && p.images.length > 0
              ? p.images.map((img: any) => typeof img === 'string' ? img : (img.image_url || img.url || img.image_path)).filter(Boolean)
              : (p.image_url ? [p.image_url] : [FALLBACK_PROPERTY_IMAGE]),
            video_url: p.video_url,
            video_thumbnail_url: p.video_thumbnail_url,
            amenities: Array.isArray(p.amenities)
              ? p.amenities.map((a: any) => typeof a === 'string' ? a : a.slug || a.name || a.id)
              : [],
            tags: Array.isArray(p.tags)
              ? p.tags.map((t: any) => typeof t === 'string' ? t : t.name)
              : [],
            has_detailed_rooms: Boolean(p.has_detailed_rooms),
            detailed_rooms: Array.isArray(p.detailed_rooms || p.detailedRooms)
              ? (p.detailed_rooms || p.detailedRooms).map((r: any) => ({
                  id: String(r.id),
                  property_id: String(p.id),
                  name: r.name,
                  price: Number(r.price),
                  area: Number(r.area),
                  description: r.description || '',
                  status: r.status || 'available',
                  imageUrl: r.room_images?.[0]?.image_url || r.primary_image?.image_url || r.imageUrl,
                  images: r.room_images?.map((img: any) => img.image_url) || [],
                }))
              : [],
            created_at: p.created_at || new Date().toISOString(),
          }));
          setBestPropertiesApi(mapped);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingBestApi(false);
      });

    // 3. Fetch Public Statistics
    ApiService.getPublicStatistics()
      .then((data) => {
        if (isMounted && data && typeof data === 'object') {
          setPublicStats(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lightweight direct CSS Parallax (0 React re-renders)
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024 || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const py = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    heroRef.current.style.setProperty('--hx', `${px}px`);
    heroRef.current.style.setProperty('--hy', `${py}px`);
  };

  const handleHeroMouseLeave = () => {
    if (heroRef.current) {
      heroRef.current.style.setProperty('--hx', '0px');
      heroRef.current.style.setProperty('--hy', '0px');
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
    if (searchOperation === 'offers') {
      params.set('offers', '1');
    } else if (searchOperation) {
      params.set('operation', searchOperation);
    }
    if (searchDistrict && searchDistrict !== 'all') params.set('district', searchDistrict);
    if (searchType && searchType !== 'all') params.set('type', searchType);
    if (searchMaxPrice) params.set('max_price', searchMaxPrice);
    if (searchRentalMode && searchRentalMode !== 'all') params.set('mode', searchRentalMode);
    if (searchAudience && searchAudience !== 'all') params.set('audience', searchAudience);
    
    navigate(`/properties?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Structured Smart Quick Discovery Options ("بتدور على إيه؟")
  const discoveryOptions = useMemo(() => [
    {
      id: 'rent_whole',
      label: 'شقق للإيجار بالكامل',
      sublabel: 'سكن عائلي ومستقل بعقود موثقة',
      icon: HomeIcon,
      count: properties.filter(p => p.operation_type === 'rent' && (!p.has_detailed_rooms || !p.detailed_rooms?.length)).length,
      params: { operation: 'rent', mode: 'full' },
    },
    {
      id: 'rent_room',
      label: 'إيجار بالغرف',
      sublabel: 'غرف مستقلة في شقق مجهزة ومفروشة',
      icon: DoorOpen,
      count: properties.filter(p => p.operation_type === 'rent' && p.has_detailed_rooms && (p.detailed_rooms?.length || 0) > 0).length,
      params: { operation: 'rent', mode: 'room' },
    },
    {
      id: 'furnished',
      label: 'شقق مفروشة',
      sublabel: 'جاهزة للسكن الفوري ومجهزة بالكامل',
      icon: Sparkles,
      count: properties.filter(p => p.furnishing === 'furnished').length,
      params: { furnishing: 'furnished' },
    },
    {
      id: 'female_students',
      label: 'طلبة بنات',
      sublabel: 'سكن هادئ وآمن بالقرب من الجامعات',
      icon: Users,
      count: properties.filter(p => p.audience_type === 'female_students').length,
      params: { operation: 'rent', audience: 'female_students' },
    },
    {
      id: 'young_men',
      label: 'شباب وموظفون',
      sublabel: 'خيارات مريحة ومناسبة للميزانية',
      icon: KeyRound,
      count: properties.filter(p => p.audience_type === 'young_men').length,
      params: { operation: 'rent', audience: 'young_men' },
    },
    {
      id: 'sale_apartments',
      label: 'عقارات للبيع',
      sublabel: 'فرص تملك واستثمار بدمياط الجديدة',
      icon: Building2,
      count: properties.filter(p => p.operation_type === 'sale').length,
      params: { operation: 'sale' },
    },
  ], [properties]);

  const handleDiscoveryCardClick = (item: typeof discoveryOptions[0]) => {
    if (onSelectDiscovery) {
      onSelectDiscovery(item.id, item.params);
    } else {
      const qs = new URLSearchParams(item.params).toString();
      navigate(`/properties?${qs}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Best / Featured properties pool (prefer API, fallback to prop properties)
  const bestPropertiesSource = bestPropertiesApi.length > 0 ? bestPropertiesApi : properties;

  // Filtered Best Properties based on Category Pills
  const filteredBestProperties = useMemo(() => {
    let list = bestPropertiesSource;
    if (bestCategoryFilter === 'offers') {
      list = list.filter(p => evaluatePropertyOffer(p).isActive);
    } else if (bestCategoryFilter === 'rent') {
      list = list.filter(p => p.operation_type === 'rent' && !p.has_detailed_rooms);
    } else if (bestCategoryFilter === 'room') {
      list = list.filter(p => p.operation_type === 'rent' && p.has_detailed_rooms);
    } else if (bestCategoryFilter === 'furnished') {
      list = list.filter(p => p.furnishing === 'furnished');
    } else if (bestCategoryFilter === 'sale') {
      list = list.filter(p => p.operation_type === 'sale');
    }
    return list.slice(0, 6);
  }, [bestPropertiesSource, bestCategoryFilter]);

  // Room Rental Discovery Inventory (only if room properties exist)
  const roomRentalProperties = useMemo(() => {
    return properties
      .filter(p => p.operation_type === 'rent' && p.has_detailed_rooms && p.detailed_rooms && p.detailed_rooms.length > 0)
      .slice(0, 4);
  }, [properties]);

  // Best Offers Inventory (Active date-valid offers prioritized)
  const offerProperties = useMemo(() => {
    const activeOffers = properties.filter(p => evaluatePropertyOffer(p).isActive);
    if (activeOffers.length > 0) return activeOffers.slice(0, 4);
    return properties
      .filter(p => Boolean(p.is_negotiable) || (Array.isArray(p.tags) && p.tags.some(t => {
        const str = typeof t === 'string' ? t : (t && typeof t === 'object' && 'name' in t ? (t as any).name : String(t || ''));
        return typeof str === 'string' && (str.includes('عرض') || str.includes('خصم') || str.includes('مميز'));
      })))
      .slice(0, 4);
  }, [properties]);

  // Trending / Most-Viewed properties (prefer API, fallback to sorted properties)
  const mostViewedProperties = useMemo(() => {
    if (topViewedProperties.length > 0) return topViewedProperties.slice(0, 4);
    return [...properties]
      .filter(p => p.status === 'available')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 4);
  }, [topViewedProperties, properties]);

  // Real Trust Statistics calculation
  const totalAvailableProperties = publicStats?.available_properties ?? properties.filter(p => p.status === 'available').length;
  const totalDistrictsCount = publicStats?.locations_count ?? districts.length;
  const totalReservationsCount = publicStats?.reservations_count ?? (StorageService.getInquiries ? StorageService.getInquiries().length : 120);
  const totalAvailableRooms = publicStats?.available_rooms ?? properties.reduce((acc, p) => acc + (p.detailed_rooms?.filter(r => r.status === 'available').length || 0), 0);

  // Formatted price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  return (
    <div className="space-y-0 animate-fade-in font-['Cairo'] text-slate-900 bg-white" dir="rtl">
      
      {/* ----------------- 0. ANNOUNCEMENT BANNER (From CMS) ----------------- */}
      {settings.announcement_enabled && settings.announcement_text && (
        <div className="bg-[#8D6A28] text-white py-2 px-4 text-center text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 relative z-20">
          <BellRing className="w-4 h-4 shrink-0 text-amber-200" />
          <span>{settings.announcement_text}</span>
        </div>
      )}

      {/* ----------------- 0.5 ACTIVE CLIENT RESERVATIONS BANNER (Session Aware) ----------------- */}
      {hasActiveClientReservations && (
        <div className="bg-slate-900 text-amber-200 py-2.5 px-4 text-xs sm:text-sm font-medium border-b border-slate-800 flex items-center justify-center gap-2 relative z-20 shadow-xs">
          <CalendarCheck className="w-4 h-4 text-[#D6A94E] shrink-0" />
          <span>لديك ({clientReservations.length}) طلب حجز ومعاينة جاري متابعته</span>
          <button
            onClick={() => navigate('/my-reservations')}
            className="mr-2 underline underline-offset-4 text-white hover:text-amber-200 font-semibold cursor-pointer flex items-center gap-1"
          >
            <span>تابع حالة الحجز الآن</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ----------------- 1. ADVANCED VIDEO HERO SECTION ----------------- */}
      <section 
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] flex items-center justify-center text-white pt-6 sm:pt-10 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-3xl sm:rounded-b-[3rem] bg-slate-900 shadow-md m-0"
      >
        {/* Background HTML5 Video or High Quality Poster Fallback */}
        {heroVideoUrl && !videoError ? (
          <video
            key={heroVideoUrl}
            src={heroVideoUrl}
            autoPlay
            loop
            muted={isVideoMuted}
            playsInline
            preload="metadata"
            poster={settings.hero_bg_image || '/hero-poster.jpg'}
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-transform duration-300 ease-out"
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none transition-transform duration-300"
            style={{ 
              backgroundImage: `url(${settings.hero_bg_image || '/hero-poster.jpg'})`,
            }}
          />
        )}

        {/* Minimal High-Contrast Gradient Overlay for crystal clear video visibility + text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-1 pointer-events-none" />

        {/* Video Sound Toggle Button */}
        {heroVideoUrl && !videoError && (
          <button
            type="button"
            onClick={() => setIsVideoMuted(!isVideoMuted)}
            className="absolute bottom-6 left-6 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs border border-white/10"
            title={isVideoMuted ? "تشغيل الصوت" : "كتم الصوت"}
          >
            {isVideoMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-[#D6A94E]" />}
            <span className="hidden sm:inline">{isVideoMuted ? "صامت" : "الصوت مفعل"}</span>
          </button>
        )}

        {/* Hero Central Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-3.5 w-full pb-3 sm:pb-5">
          {/* Brand Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A94E]" />
            <span>{settings.hero_tagline || 'منصة العقارات الأولى في دمياط الجديدة'}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.25] text-white drop-shadow-sm">
            {settings.hero_title || 'بيتك القادم يبدأ من هنا'}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-xs px-2">
            {settings.hero_subtitle || 'اكتشف أفضل شقق الإيجار، سكن الطلبة والطالبات، وعقارات التملك في دمياط الجديدة مع معاينات موثقة'}
          </p>

          {/* Key Value Proposition Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-1 text-[11px] sm:text-xs font-medium text-slate-200">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              عمولة وساطة مخفضة 2.5% فقط
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D6A94E]" />
              معاينات واستشارات مجانية
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D6A94E]" />
              عقارات موثقة ومفحوصة
            </span>
          </div>
        </div>
      </section>

      {/* ----------------- 1.5 FLOATING OVERLAPPING SEARCH BAR ----------------- */}
      <div className="-mt-10 sm:-mt-14 relative z-30 max-w-6xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
        <div>
          {/* Main Card Container (Compact & lightweight) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-md border border-slate-200/90 text-right animate-fade-in space-y-3 sm:space-y-4">
            
            {/* 1. Operation Tabs & Mode Switchers (Desktop) */}
            <div className="hidden sm:flex items-center justify-between gap-1.5 sm:gap-2 pb-2 sm:pb-3 border-b border-slate-100/90 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 p-0.5 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/60 overflow-x-auto max-w-full scrollbar-hide">
                <button
                  type="button"
                  onClick={() => { setSearchOperation('rent'); setSearchRentalMode('all'); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'rent' && searchRentalMode !== 'room'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D6A94E]" />
                  <span>شقق للإيجار</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSearchOperation('rent'); setSearchRentalMode('room'); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'rent' && searchRentalMode === 'room'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D6A94E]" />
                  <span>إيجار غرف (طلبة وطالبات)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSearchOperation('sale'); setSearchRentalMode('all'); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'sale'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D6A94E]" />
                  <span>عقارات للبيع</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSearchOperation('offers'); }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'offers'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D6A28]" />
                  <span>عروض حصرية</span>
                </button>
              </div>

              {/* Advanced Filters Expand Toggle with Active Count */}
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`flex items-center gap-1 sm:gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition cursor-pointer shrink-0 ${
                  showAdvancedSearch || searchAudience !== 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span>{showAdvancedSearch ? 'إخفاء الفلاتر' : 'فلاتر إضافية'}</span>
                {searchAudience !== 'all' && (
                  <span className="w-2 h-2 rounded-full bg-[#8D6A28]" />
                )}
              </button>
            </div>

            {/* Mobile Header: Trigger for Mobile Filter & Categories Popup */}
            <div className="flex sm:hidden items-center justify-between gap-2 pb-2 border-b border-slate-100/90">
              <button
                type="button"
                onClick={() => setIsMobileFilterPopupOpen(true)}
                className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/60 text-slate-800 transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {searchOperation === 'offers' ? (
                    <>
                      <Flame className="w-3.5 h-3.5 text-[#8D6A28]" />
                      <span className="text-[#8D6A28]">عروض حصرية</span>
                    </>
                  ) : searchRentalMode === 'room' ? (
                    <>
                      <DoorOpen className="w-3.5 h-3.5 text-[#8D6A28]" />
                      <span className="text-[#8D6A28]">إيجار غرف</span>
                    </>
                  ) : searchOperation === 'sale' ? (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-[#8D6A28]" />
                      <span className="text-[#8D6A28]">عقارات للبيع</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5 text-[#8D6A28]" />
                      <span className="text-[#8D6A28]">شقق للإيجار</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <span>تغيير التصنيف والفلاتر</span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#8D6A28]" />
                </div>
              </button>
            </div>

            {/* 2. Unified Search Form */}
            <form onSubmit={handleHeroSearch} className="space-y-2.5 sm:space-y-3.5">
              
              {/* Primary Search Input Row with clear button */}
              <div className="relative flex items-center">
                <Search className="absolute right-3 sm:right-4 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D6A28] pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث باسم الحي، الشارع، كود العقار، أو أي مواصفات..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pr-9 sm:pr-11 pl-9 sm:pl-10 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition shadow-2xs"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute left-2.5 sm:left-3 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              {/* Filters Grid (District, Budget/Mode, Search Action) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                
                {/* 1. Location / District (Desktop only in form, in popup on mobile) */}
                <div className="hidden sm:block space-y-0.5 sm:space-y-1">
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700">المنطقة أو الحي</label>
                  <div className="relative group">
                    <MapPin className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D6A28] pointer-events-none" />
                    <select
                      value={searchDistrict}
                      onChange={(e) => setSearchDistrict(e.target.value)}
                      className="w-full pr-9 sm:pr-10 pl-2.5 sm:pl-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition cursor-pointer shadow-2xs"
                    >
                      <option value="all">كل أحياء دمياط الجديدة</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.available_count > 0 ? `(${d.available_count} متاح)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Rental Mode or Budget (Desktop only in form, in popup on mobile) */}
                {searchOperation === 'rent' && searchRentalMode !== 'room' ? (
                  <div className="hidden sm:block space-y-0.5 sm:space-y-1">
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700">نظام التأجير</label>
                    <div className="relative group">
                      <DoorOpen className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D6A28] pointer-events-none" />
                      <select
                        value={searchRentalMode}
                        onChange={(e) => setSearchRentalMode(e.target.value)}
                        className="w-full pr-9 sm:pr-10 pl-2.5 sm:pl-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition cursor-pointer shadow-2xs"
                      >
                        <option value="all">الكل (شقق كاملة + غرف)</option>
                        <option value="full">إيجار الشقة بالكامل</option>
                        <option value="room">إيجار بالغرف المستقلة</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="hidden sm:block space-y-0.5 sm:space-y-1">
                    <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-700">أقصى ميزانية (ج.م)</label>
                    <div className="relative group">
                      <DollarSign className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D6A28] pointer-events-none" />
                      <input
                        type="number"
                        placeholder="أي ميزانية"
                        value={searchMaxPrice}
                        onChange={(e) => setSearchMaxPrice(e.target.value)}
                        className="w-full pr-9 sm:pr-10 pl-2.5 sm:pl-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Action Search Button */}
                <div className="space-y-0.5 sm:space-y-1 flex flex-col justify-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-2.5 rounded-xl sm:rounded-2xl gold-gradient gold-gradient-hover text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>
                      {searchOperation === 'offers'
                        ? 'استعراض العروض'
                        : searchRentalMode === 'room'
                        ? 'بحث في غرف السكن'
                        : searchOperation === 'rent'
                        ? 'بحث في عقارات الإيجار'
                        : 'بحث في عقارات البيع'}
                    </span>
                  </button>
                </div>

              </div>

              {/* Collapsible Additional Filters */}
              {showAdvancedSearch && (
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">فئة السكن المستهدفة</label>
                    <div className="relative">
                      <Users className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6A28] pointer-events-none" />
                      <select
                        value={searchAudience}
                        onChange={(e) => setSearchAudience(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="all">الكل (طالبات / شباب / عائلات)</option>
                        <option value="female_students">طالبات بنات فقط</option>
                        <option value="young_men">شباب وموظفون</option>
                        <option value="families">عائلات</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700">الفرش والتجهيز</label>
                    <div className="relative">
                      <Sparkles className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6A28] pointer-events-none" />
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'furnished') {
                            navigate('/properties?furnishing=furnished');
                          }
                        }}
                        className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                      >
                        <option value="all">مفروش وغير مفروش</option>
                        <option value="furnished">مفروش بالكامل فقط</option>
                        <option value="unfurnished">غير مفروش</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchKeyword('');
                        setSearchDistrict('all');
                        setSearchType('all');
                        setSearchRentalMode('all');
                        setSearchMaxPrice('');
                        setSearchAudience('all');
                      }}
                      className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition cursor-pointer"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Small Smart Install App & QR idea strip */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-700 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  <Smartphone className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-slate-900 text-xs block sm:inline">
                    تطبيق سكني متاح الآن للجوال
                  </span>
                  <span className="text-slate-500 text-[11px] sm:mr-1">
                    — تثبيت سريع ومباشر مع تنبيهات فورية بالعروض
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>تثبيت التطبيق ورمز QR 📲</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ----------------- MOBILE FILTER & OPERATION POPUP MODAL ----------------- */}
      {isMobileFilterPopupOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fade-in" dir="rtl">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterPopupOpen(false)}
          />
          {/* Centered Modal Card */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 z-10 max-h-[88vh] overflow-y-auto space-y-3.5 animate-scale-up text-right my-auto">
            
            {/* Popup Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">خيارات البحث والتصنيف</h3>
                  <p className="text-[11px] text-slate-500 font-normal">اختر نوع العقار أو العملية والفلاتر</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterPopupOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Operation Tabs inside Mobile Popup */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">التصنيف ونوع العملية</label>
              <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 p-0.5 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/60 overflow-x-auto max-w-full scrollbar-hide">
                <button
                  type="button"
                  onClick={() => { setSearchOperation('rent'); setSearchRentalMode('all'); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'rent' && searchRentalMode !== 'room'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#D6A94E]" />
                  <span>شقق للإيجار</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSearchOperation('rent'); setSearchRentalMode('room'); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'rent' && searchRentalMode === 'room'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5 text-[#D6A94E]" />
                  <span>إيجار غرف</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSearchOperation('sale'); setSearchRentalMode('all'); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'sale'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#D6A94E]" />
                  <span>عقارات للبيع</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSearchOperation('offers'); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    searchOperation === 'offers'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>عروض حصرية</span>
                </button>
              </div>
            </div>

            {/* 2. Location / District Filter */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">المنطقة أو الحي</label>
              <div className="relative group">
                <MapPin className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D6A28] pointer-events-none" />
                <select
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="w-full pr-9 sm:pr-10 pl-2.5 sm:pl-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition cursor-pointer shadow-2xs"
                >
                  <option value="all">كل أحياء دمياط الجديدة</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.available_count > 0 ? `(${d.available_count} متاح)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Property Type Filter */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">نوع العقار</label>
              <div className="relative group">
                <Building2 className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8D6A28] pointer-events-none" />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full pr-9 sm:pr-10 pl-2.5 sm:pl-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/10 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition cursor-pointer shadow-2xs"
                >
                  <option value="all">جميع أنواع العقارات</option>
                  <option value="apartment">شقة سكنية</option>
                  <option value="villa">فيلا مستقلة</option>
                  <option value="duplex">دوبلكس</option>
                  <option value="shop">محل تجاري</option>
                  <option value="office">مكتب إداري</option>
                  <option value="chalet">شاليه مصيفي</option>
                  <option value="studio">استوديو</option>
                </select>
              </div>
            </div>

            {/* 4. Target Audience */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">فئة السكن المستهدفة</label>
              <div className="relative">
                <Users className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6A28] pointer-events-none" />
                <select
                  value={searchAudience}
                  onChange={(e) => setSearchAudience(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="all">الكل (طالبات / شباب / عائلات)</option>
                  <option value="female_students">طالبات بنات فقط</option>
                  <option value="young_men">شباب وموظفون</option>
                  <option value="families">عائلات</option>
                </select>
              </div>
            </div>

            {/* 5. Furnishing Filter */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">الفرش والتجهيز</label>
              <div className="relative">
                <Sparkles className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6A28] pointer-events-none" />
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'furnished') {
                      setIsMobileFilterPopupOpen(false);
                      navigate('/properties?furnishing=furnished');
                    }
                  }}
                  className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="all">مفروش وغير مفروش</option>
                  <option value="furnished">مفروش بالكامل فقط</option>
                  <option value="unfurnished">غير مفروش</option>
                </select>
              </div>
            </div>

            {/* 6. Rental Mode or Budget Filter in Popup */}
            {searchOperation === 'rent' && searchRentalMode !== 'room' ? (
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">نظام التأجير</label>
                <div className="relative">
                  <DoorOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6A28] pointer-events-none" />
                  <select
                    value={searchRentalMode}
                    onChange={(e) => setSearchRentalMode(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="all">الكل (شقق كاملة + غرف)</option>
                    <option value="full">إيجار الشقة بالكامل</option>
                    <option value="room">إيجار بالغرف المستقلة</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">أقصى ميزانية (ج.م)</label>
                <div className="relative">
                  <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D6A28] pointer-events-none" />
                  <input
                    type="number"
                    placeholder="أي ميزانية"
                    value={searchMaxPrice}
                    onChange={(e) => setSearchMaxPrice(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Popup Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  setSearchDistrict('all');
                  setSearchType('all');
                  setSearchRentalMode('all');
                  setSearchMaxPrice('');
                  setSearchAudience('all');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition cursor-pointer text-center"
              >
                إعادة ضبط
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterPopupOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer text-center"
              >
                تطبيق الفلاتر
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ----------------- SUBSEQUENT HOME SECTIONS CONTAINER ----------------- */}
      <div className="space-y-14 sm:space-y-20 mt-10 sm:mt-14 pb-16">
        
        {/* ----------------- 2. SMART QUICK DISCOVERY (بتدور على إيه؟) ----------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#8D6A28] text-xs font-semibold mb-2 border border-amber-200/60">
                  <Sparkles className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>تصفح سريع ومخصص</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  بتدور على إيه؟
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                  اختار نوع السكن المناسب لاحتياجاتك وسنوصلك بالمتاح فوراً في دمياط الجديدة
                </p>
              </div>
            </div>

            {/* Responsive Discovery Container (Horizontal scroll on mobile, Grid on desktop) */}
            <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-3 sm:pb-0 gap-3 sm:gap-4 snap-x sm:snap-none scrollbar-hide grid-cols-2 md:grid-cols-3 lg:grid-cols-6 -mx-4 px-4 sm:mx-0 sm:px-0">
              {discoveryOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDiscoveryCardClick(item)}
                    className="min-w-[160px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[46vw] sm:w-auto bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:border-[#8D6A28]/50 hover:shadow-xs hover:-translate-y-0.5 transition-all group cursor-pointer text-right flex flex-col justify-between focus:outline-none"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-amber-50 group-hover:text-[#8D6A28] transition-colors flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        {item.count > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {item.count} متاح
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#8D6A28] transition-colors line-clamp-1">
                          {item.label}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-2 mt-1 leading-relaxed">
                          {item.sublabel}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#8D6A28]">
                      <span>استكشف</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ----------------- 3. FEATURED / BEST PROPERTIES (أفضل العقارات المتاحة) ----------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            
            {/* Header & Category Pills */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#8D6A28] text-xs font-semibold mb-2 border border-amber-200/60">
                  <Flame className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>عقارات مختارة بعناية</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  أفضل العقارات المتاحة
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                  أحدث وأفضل الفرص السكنية الموثقة بأعلى تقييم وأفضل الأسعار
                </p>
              </div>

              <button
                onClick={() => {
                  navigate('/properties');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8D6A28] hover:text-[#AC7F2B] transition cursor-pointer self-start md:self-auto"
              >
                <span>عرض جميع العقارات</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'offers', label: 'عروض وتخفيضات' },
                { id: 'rent', label: 'شقق إيجار' },
                { id: 'room', label: 'إيجار بالغرف' },
                { id: 'furnished', label: 'مفروش بالكامل' },
                { id: 'sale', label: 'عقارات للبيع' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setBestCategoryFilter(pill.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    bestCategoryFilter === pill.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>

            {/* Properties Grid with Horizontal Mobile Scrolling */}
            {isLoading || isLoadingBestApi ? (
              <PropertyGridSkeleton count={6} />
            ) : filteredBestProperties.length > 0 ? (
              <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 gap-4 sm:gap-6 snap-x sm:snap-none scrollbar-hide sm:grid-cols-2 lg:grid-cols-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                {filteredBestProperties.map((property) => (
                  <div key={property.id} className="min-w-[285px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[82vw] sm:w-auto">
                    <PropertyCard
                      property={property}
                      isFavorite={favorites.includes(property.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelectProperty={onSelectProperty}
                      onQuickPreview={onQuickPreview}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-8 text-center border border-slate-200 space-y-3">
                <HomeIcon className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">لا توجد عقارات متاحة حالياً في هذا التصنيف</p>
                <button
                  onClick={() => setBestCategoryFilter('all')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  عرض جميع العقارات
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ----------------- 4. BROWSE BY LOCATION (استكشف السكن حسب المنطقة) ----------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6 shadow-2xs">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-semibold mb-2 border border-slate-200/80">
                  <MapPin className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>تغطية شاملة لدمياط الجديدة</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  استكشف السكن حسب المنطقة
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1">
                  تصفح الوحدات المتاحة في أرقى وأهم أحياء ومناطق دمياط الجديدة
                </p>
              </div>

              <button
                onClick={() => {
                  navigate('/places');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8D6A28] hover:text-[#AC7F2B] transition cursor-pointer self-start sm:self-auto"
              >
                <span>دليل كافة الأحياء والتفاصيل</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Locations Grid: Equal Cards */}
            {isLoading ? (
              <LocationSectionSkeleton />
            ) : districts.length > 0 ? (
              <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-3 sm:pb-0 gap-4 sm:gap-5 snap-x sm:snap-none scrollbar-hide sm:grid-cols-2 lg:grid-cols-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                {districts.slice(0, 6).map((district) => {
                  const matchingCount = properties.filter((p) => {
                    const dId = String(district.id || '').toLowerCase();
                    const dName = String(district.name || '').toLowerCase();
                    const pLoc = String(p.location_id || '').toLowerCase();
                    const pDist = String(p.district_name || '').toLowerCase();
                    return pLoc === dId || pDist === dName || pDist.includes(dName) || dName.includes(pDist);
                  }).length;
                  const count = matchingCount || district.available_count || 0;

                  return (
                    <div
                      key={district.id}
                      onClick={() => onSelectDistrict(district.id)}
                      className="min-w-[280px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[80vw] sm:w-auto relative h-52 sm:h-60 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer border border-slate-200/80 bg-slate-900"
                    >
                      <img
                        src={resolveImageUrl(district.image_url)}
                        alt={district.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 flex flex-col justify-between p-5 sm:p-6 text-white" dir="rtl">
                        {/* Top badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold bg-black/50 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full shadow-2xs">
                            {count} عقار متاح
                          </span>
                          <span className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#8D6A28] transition-all">
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        {/* Bottom Content */}
                        <div className="space-y-1">
                          <h3 className="text-lg sm:text-xl font-bold drop-shadow-xs flex items-center gap-1.5 text-white">
                            <MapPin className="w-4 h-4 text-[#D6A94E] shrink-0" />
                            <span>{district.name}</span>
                          </h3>
                          <p className="text-xs text-slate-300 font-normal line-clamp-1">
                            {district.description || 'من أرقى الأحياء السكنية والخدمية بدمياط الجديدة'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </section>

        {/* ----------------- 5. ROOM RENTAL DISCOVERY (سكن الطلبة والطالبات - إيجار بالغرف) ----------------- */}
        {roomRentalProperties.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-semibold mb-2 border border-slate-200/80">
                    <DoorOpen className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>نظام السكن المشترك والمستقل</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    سكن الطلبة والطالبات — إيجار بالغرف
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1">
                    احجز غرفتك المستقلة في شقق مجهزة ومفروشة بالكامل بالقرب من جامعة دمياط وحورس
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigate('/properties?operation=rent&mode=room');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8D6A28] hover:text-[#AC7F2B] transition cursor-pointer self-start md:self-auto"
                >
                  <span>عرض جميع غرف السكن</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 gap-4 sm:gap-5 snap-x sm:snap-none scrollbar-hide sm:grid-cols-2 lg:grid-cols-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {roomRentalProperties.map((prop) => (
                  <div key={prop.id} className="min-w-[275px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[78vw] sm:w-auto">
                    <PropertyCard
                      property={prop}
                      isFavorite={favorites.includes(prop.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelectProperty={onSelectProperty}
                      onQuickPreview={onQuickPreview}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ----------------- 6. BEST OFFERS & HIGH-VALUE LISTINGS (عروض وتخفيضات حصرية) ----------------- */}
        {offerProperties.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#8D6A28] text-xs font-semibold mb-2 border border-amber-200/60">
                    <Flame className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>عروض وتخفيضات حصرية</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    أقوى عروض وتخفيضات سكني
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                    عقارات بأسعار مخفضة وتخفيضات مباشرة في دمياط الجديدة
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigate('/properties?offers=1');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8D6A28] hover:text-[#AC7F2B] transition cursor-pointer self-start md:self-auto"
                >
                  <span>عرض كل العروض</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 gap-4 sm:gap-5 snap-x sm:snap-none scrollbar-hide sm:grid-cols-2 lg:grid-cols-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {offerProperties.map((prop) => (
                  <div key={prop.id} className="min-w-[285px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[82vw] sm:w-auto">
                    <PropertyCard
                      property={prop}
                      isFavorite={favorites.includes(prop.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelectProperty={onSelectProperty}
                      onQuickPreview={onQuickPreview}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ----------------- 7. PERSONALIZED NEED PROPERTY JOURNEY (مش لاقي اللي يناسبك؟) ----------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-md border border-slate-800">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-[#D6A94E]">
                <HelpCircle className="w-6 h-6" />
              </div>

              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
                مش لاقي العقار المناسب لاحتياجاتك؟
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                قولنا مواصفات السكن اللي محتاجه (المنطقة، الميزانية، عدد الغرف، نوع السكن) وفريق سكني هيتواصل معاك مباشرة بأقرب الخيارات المتاحة فوراً بدون أي تكلفة للمعاينة.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    navigate('/need-property');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-7 py-3 rounded-full gold-gradient gold-gradient-hover text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>سجل طلبك الآن مجاناً</span>
                </button>

                <a
                  href={`https://wa.me/${String(settings.whatsapp || '201067725976').replace(/\D/g, '')}?text=${encodeURIComponent('السلام عليكم، محتاج مساعدة في إيجاد عقار بمواصفات معينة في دمياط الجديدة.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 transition cursor-pointer flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>تواصل مع مستشار عقاري</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------- 8. MOST VIEWED / TRENDING (عقارات الأكثر إقبالاً) ----------------- */}
        {mostViewedProperties.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#8D6A28] text-xs font-semibold mb-2 border border-amber-200/60">
                    <TrendingUp className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>إقبال ومتابعة عالية</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    عقارات عليها إقبال ومشاهدة
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                    أكثر العقارات زيارة وطلباً للمعاينة هذا الأسبوع في دمياط الجديدة
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigate('/properties?sort=views_desc');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8D6A28] hover:text-[#AC7F2B] transition cursor-pointer self-start md:self-auto"
                >
                  <span>عرض الأكثر طلباً</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {isLoadingTopViewed ? (
                <PropertyGridSkeleton count={4} />
              ) : (
                <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 gap-4 sm:gap-5 snap-x sm:snap-none scrollbar-hide sm:grid-cols-2 lg:grid-cols-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {mostViewedProperties.map((property) => (
                    <div key={property.id} className="min-w-[285px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[82vw] sm:w-auto">
                      <PropertyCard
                        property={property}
                        isFavorite={favorites.includes(property.id)}
                        onToggleFavorite={onToggleFavorite}
                        onSelectProperty={onSelectProperty}
                        onQuickPreview={onQuickPreview}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ----------------- 9. TRUST & REAL STATISTICS (سكني بالأرقام) ----------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50/80 rounded-3xl p-6 sm:p-10 border border-slate-200/80 space-y-8">
            
            {/* Real Statistics Counter Bar */}
            <div className="space-y-4">
              <div className="text-center space-y-1 max-w-xl mx-auto">
                <span className="text-xs font-semibold text-[#8D6A28] uppercase tracking-wider">أرقام وحقائق موثقة</span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  سكني بالأرقام في دمياط الجديدة
                </h2>
              </div>

              {isLoadingStats ? (
                <StatsCardsSkeleton />
              ) : (
                <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 gap-3 sm:gap-5 snap-x sm:snap-none scrollbar-hide grid-cols-2 lg:grid-cols-4 -mx-2 px-2 sm:mx-0 sm:px-0">
                  
                  {/* Metric 1: Available Properties */}
                  <div className="min-w-[140px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[44vw] sm:w-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-2xs text-center space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#8D6A28] flex items-center justify-center mx-auto">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                      {totalAvailableProperties}+
                    </p>
                    <p className="text-xs font-medium text-slate-600">عقار متاح ومفحوص</p>
                  </div>

                  {/* Metric 2: Covered Districts */}
                  <div className="min-w-[140px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[44vw] sm:w-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-2xs text-center space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#8D6A28] flex items-center justify-center mx-auto">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                      {totalDistrictsCount}
                    </p>
                    <p className="text-xs font-medium text-slate-600">أحياء ومناطق نخدمها</p>
                  </div>

                  {/* Metric 3: Successful Inquiries/Reservations */}
                  <div className="min-w-[140px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[44vw] sm:w-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-2xs text-center space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#8D6A28] flex items-center justify-center mx-auto">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                      {totalReservationsCount}+
                    </p>
                    <p className="text-xs font-medium text-slate-600">طلب حجز ومعاينة ناجحة</p>
                  </div>

                  {/* Metric 4: Available Individual Rooms */}
                  <div className="min-w-[140px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[44vw] sm:w-auto bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-2xs text-center space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#8D6A28] flex items-center justify-center mx-auto">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                      {totalAvailableRooms}+
                    </p>
                    <p className="text-xs font-medium text-slate-600">غرفة سكنية موثقة</p>
                  </div>

                </div>
              )}
            </div>

            {/* Why Choose Sakani Feature Cards */}
            <div className="pt-6 border-t border-slate-200/60 space-y-6">
              <div className="text-center space-y-1 max-w-xl mx-auto">
                <span className="text-xs font-semibold text-[#8D6A28] uppercase tracking-wider">مميزات وخدمات سكني</span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  لماذا يختار عملاؤنا منصة سكني؟
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {(settings.why_us_items || []).map((item, idx) => (
                  <div key={item.id || idx} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-2xs text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#8D6A28] flex items-center justify-center mx-auto">
                      {WHY_US_ICON_MAP[item.icon] || <ShieldCheck className="w-5 h-5 text-[#8D6A28]" />}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ----------------- 10. FINAL CONTACT & SUPPORT CTA ----------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#D6A94E]">فريق الدعم والاستشارات</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                هل تحتاج إلى مساعدة أو معاينة خاصة؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal">
                تواصل معنا مباشرة عبر الهاتف أو واتساب وسيقوم مستشارنا العقاري بالرد عليك فوراً
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href={`https://wa.me/${String(settings.whatsapp || '201067725976').replace(/\D/g, '')}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن عقارات سكني في دمياط الجديدة.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-xs transition flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل عبر واتساب</span>
              </a>

              <a
                href={`tel:${settings.phone || '01067725976'}`}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/15 transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-[#D6A94E]" />
                <span dir="ltr">{settings.phone || '01067725976'}</span>
              </a>
            </div>

          </div>
        </section>

      </div>

      {/* QR Code & Mobile App Install Modal */}
      <QRCodeShareModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        initialMode="install_app"
      />

    </div>
  );
};

export default HomePage;
