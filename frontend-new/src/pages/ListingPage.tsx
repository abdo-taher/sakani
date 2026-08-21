import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Property, LocationDistrict, OperationType, PropertyType, PropertyFilterState, AudienceType, PropertyStatus } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyGridSkeleton } from '../components/Skeletons';
import { evaluatePropertyOffer } from '../utils/offerUtils';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  X, 
  Building2, 
  MapPin, 
  SlidersHorizontal, 
  RotateCcw, 
  Sparkles,
  Home as HomeIcon,
  DoorOpen,
  HelpCircle,
  ChevronLeft,
  Navigation,
  Crosshair,
  Users,
  Flame
} from 'lucide-react';

// Haversine Distance Calculation (in kilometers)
function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface ListingPageProps {
  properties: Property[];
  favorites: string[];
  districts: LocationDistrict[];
  isLoading?: boolean;
  initialFilters?: Partial<PropertyFilterState>;
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onQuickPreview?: (property: Property) => void;
  onOpenAddProperty: () => void;
  onOpenNeedModal?: () => void;
}

type ActiveListingTab = 'all' | 'sale' | 'rent_whole' | 'rent_room' | 'furnished' | 'offers';
type PropertySort = 'availability' | 'newest' | 'price_asc' | 'price_desc' | 'area_desc' | 'discount_desc' | 'distance';

const availabilityRank: Record<PropertyStatus, number> = {
  available: 0,
  reserved: 1,
  rented: 2,
  sold: 3,
};

export const ListingPage: React.FC<ListingPageProps> = ({
  properties,
  favorites,
  districts,
  isLoading = false,
  initialFilters = {} as PropertyFilterState,
  onToggleFavorite,
  onSelectProperty,
  onQuickPreview,
  onOpenAddProperty,
  onOpenNeedModal,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL query parameters as single source of truth
  const urlOperation = searchParams.get('operation') || searchParams.get('listing');
  const urlMode = searchParams.get('mode');
  const urlFurnishing = searchParams.get('furnishing');
  const urlOffers = searchParams.get('offers') === '1' || searchParams.get('offers_only') === '1';
  const urlType = searchParams.get('type') || searchParams.get('property_type');
  const urlDistrict = searchParams.get('district') || searchParams.get('place') || searchParams.get('location');
  const urlAudience = searchParams.get('audience') || searchParams.get('audience_type');
  const urlQ = searchParams.get('q') || searchParams.get('search');
  const urlMinPrice = searchParams.get('min_price');
  const urlMaxPrice = searchParams.get('max_price');
  const urlRooms = searchParams.get('rooms');
  const urlSort = searchParams.get('sort');
  const urlStatus = searchParams.get('status') as PropertyStatus | null;

  // Compute active listing tab from URL
  const activeListingTab: ActiveListingTab = useMemo(() => {
    if (urlOffers) return 'offers';
    if (urlFurnishing === 'furnished') return 'furnished';
    if (urlOperation === 'sale') return 'sale';
    if (urlOperation === 'rent' && urlMode === 'room') return 'rent_room';
    if (urlOperation === 'rent' && urlMode === 'full') return 'rent_whole';
    if (urlOperation === 'rent' && !urlAudience) return 'rent_whole';
    return 'all';
  }, [urlOperation, urlMode, urlFurnishing, urlOffers, urlAudience]);

  // Local filter states
  const [selectedDistrict, setSelectedDistrict] = useState<string>(urlDistrict || initialFilters.district || 'all');
  const [propertyType, setPropertyType] = useState<PropertyType | 'all'>((urlType as PropertyType) || initialFilters.property_type || 'all');
  const [audienceFilter, setAudienceFilter] = useState<AudienceType | 'all'>((urlAudience as AudienceType) || 'all');
  const [offersOnly, setOffersOnly] = useState<boolean>(urlOffers || Boolean(initialFilters.offers_only));
  const [searchQuery, setSearchQuery] = useState(urlQ || initialFilters.search_query || '');
  const [minPrice, setMinPrice] = useState<string>(urlMinPrice || initialFilters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState<string>(urlMaxPrice || initialFilters.max_price?.toString() || '');
  const [roomsFilter, setRoomsFilter] = useState<string>(urlRooms || 'all');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>(urlStatus || initialFilters.status || 'all');
  const [sortBy, setSortBy] = useState<PropertySort>((urlSort as PropertySort) || 'availability');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Proximity Geolocation States
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [proximityRadius, setProximityRadius] = useState<number>(5); // Default 5 km
  const [isProximityActive, setIsProximityActive] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleToggleProximity = () => {
    if (isProximityActive) {
      setIsProximityActive(false);
      setUserCoords(null);
      if (sortBy === 'distance') setSortBy('availability');
      return;
    }

    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setUserCoords({ lat, lng });
        setIsProximityActive(true);
        setIsLocating(false);
        setSortBy('distance');
      },
      () => {
        setIsLocating(false);
        alert('تعذر تحديد موقعك الجغرافي. يرجى تفعيل إذن الموقع في متصفحك.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Synchronize URL whenever URL params change externally (e.g. Back/Forward button)
  useEffect(() => {
    setSelectedDistrict(urlDistrict || 'all');
    setPropertyType((urlType as PropertyType) || 'all');
    setSearchQuery(urlQ || '');
    setMinPrice(urlMinPrice || '');
    setMaxPrice(urlMaxPrice || '');
    setRoomsFilter(urlRooms || 'all');
    setStatusFilter(urlStatus || 'all');
    setSortBy((urlSort as PropertySort) || 'availability');
  }, [urlDistrict, urlType, urlQ, urlMinPrice, urlMaxPrice, urlRooms, urlStatus, urlSort]);

  useEffect(() => {
    if (!showAdvancedFilters) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAdvancedFilters]);

  // Helper to update URL search parameters
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Tab switcher handler
  const handleTabChange = (tab: ActiveListingTab) => {
    if (tab === 'all') {
      setOffersOnly(false);
      updateUrlParams({ operation: null, mode: null, furnishing: null, offers: null, offers_only: null });
    } else if (tab === 'offers') {
      setOffersOnly(true);
      updateUrlParams({ offers: '1', operation: null, mode: null, furnishing: null });
    } else if (tab === 'sale') {
      setOffersOnly(false);
      updateUrlParams({ operation: 'sale', mode: null, furnishing: null, offers: null, offers_only: null });
    } else if (tab === 'rent_whole') {
      setOffersOnly(false);
      updateUrlParams({ operation: 'rent', mode: 'full', furnishing: null, offers: null, offers_only: null });
    } else if (tab === 'rent_room') {
      setOffersOnly(false);
      updateUrlParams({ operation: 'rent', mode: 'room', furnishing: null, offers: null, offers_only: null });
    } else if (tab === 'furnished') {
      setOffersOnly(false);
      updateUrlParams({ furnishing: 'furnished', mode: null, offers: null, offers_only: null });
    }
  };

  // Precise Filtered Properties Calculation
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // 1. Discovery / Listing Tab Logic
      if (activeListingTab === 'offers' || offersOnly) {
        const offer = evaluatePropertyOffer(p);
        if (!offer.isActive) return false;
      } else if (activeListingTab === 'sale') {
        if (p.operation_type !== 'sale') return false;
      } else if (activeListingTab === 'rent_whole') {
        if (p.operation_type !== 'rent') return false;
        // Exclude room-only rental properties
        if (p.has_detailed_rooms && p.detailed_rooms && p.detailed_rooms.length > 0) return false;
      } else if (activeListingTab === 'rent_room') {
        if (p.operation_type !== 'rent') return false;
        // Only include properties with active detailed rooms
        if (!p.has_detailed_rooms || !p.detailed_rooms || p.detailed_rooms.length === 0) return false;
      } else if (activeListingTab === 'furnished') {
        if (p.furnishing !== 'furnished') return false;
      }

      // Explicit URL Operation check
      if (urlOperation && urlOperation !== 'all') {
        if (p.operation_type !== urlOperation) return false;
      }

      // Explicit URL Mode check
      if (urlMode === 'full') {
        if (p.operation_type !== 'rent') return false;
        if (p.has_detailed_rooms && p.detailed_rooms && p.detailed_rooms.length > 0) return false;
      } else if (urlMode === 'room') {
        if (p.operation_type !== 'rent') return false;
        if (!p.has_detailed_rooms || !p.detailed_rooms || p.detailed_rooms.length === 0) return false;
      }

      // Explicit Furnishing check
      if (urlFurnishing === 'furnished') {
        if (p.furnishing !== 'furnished') return false;
      }

      // 2. District Filter
      if (selectedDistrict !== 'all') {
        const dLower = selectedDistrict.trim().toLowerCase();
        const locId = String(p.location_id || '').toLowerCase();
        const distName = String(p.district_name || '').toLowerCase();
        if (locId !== dLower && distName !== dLower && !distName.includes(dLower) && !dLower.includes(distName)) {
          return false;
        }
      }

      // 3. Property Type Filter
      if (propertyType !== 'all') {
        if (p.property_type !== propertyType) return false;
      }

      // 3.1 Audience Classification Filter
      if (audienceFilter !== 'all') {
        if (p.audience_type !== audienceFilter) {
          return false;
        }
      }

      // 4. Minimum Rooms Filter
      if (roomsFilter !== 'all') {
        const rNum = Number(roomsFilter);
        if (p.rooms < rNum) return false;
      }

      // 4.1 Availability status
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // 5. Min Price
      if (minPrice && Number(minPrice) > 0) {
        if (p.price < Number(minPrice)) return false;
      }

      // 6. Max Price
      if (maxPrice && Number(maxPrice) > 0) {
        if (p.price > Number(maxPrice)) return false;
      }

      // 7. Search Query Text Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchDistrict = p.district_name?.toLowerCase().includes(q);
        const matchTags = Array.isArray(p.tags) && p.tags.some((t: any) => {
          const str = typeof t === 'string' ? t : (t?.name || String(t || ''));
          return typeof str === 'string' && str.toLowerCase().includes(q);
        });

        if (!matchTitle && !matchDesc && !matchDistrict && !matchRef && !matchTags) {
          return false;
        }
      }

      // 8. Proximity Filter (Coordinates & Radius)
      if (isProximityActive && userCoords) {
        if (!p.latitude || !p.longitude) {
          return false; // Safely exclude properties without coordinates when proximity filter is enabled
        }
        const dist = calculateHaversine(userCoords.lat, userCoords.lng, Number(p.latitude), Number(p.longitude));
        if (dist > proximityRadius) {
          return false;
        }
        (p as any).distance = dist;
      } else {
        delete (p as any).distance;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'availability') {
        const statusDifference = (availabilityRank[a.status] ?? 99) - (availabilityRank[b.status] ?? 99);
        if (statusDifference !== 0) return statusDifference;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'distance' && (a as any).distance !== undefined && (b as any).distance !== undefined) {
        return (a as any).distance - (b as any).distance;
      }
      if (sortBy === 'discount_desc') {
        const discA = evaluatePropertyOffer(a).discountPercentage || 0;
        const discB = evaluatePropertyOffer(b).discountPercentage || 0;
        return discB - discA;
      }
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'area_desc') return b.area - a.area;
      // Default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    properties,
    activeListingTab,
    offersOnly,
    urlOperation,
    urlMode,
    urlFurnishing,
    selectedDistrict,
    propertyType,
    searchQuery,
    minPrice,
    maxPrice,
    roomsFilter,
    statusFilter,
    sortBy,
    isProximityActive,
    userCoords,
    proximityRadius,
  ]);

  const resetFilters = () => {
    setSelectedDistrict('all');
    setPropertyType('all');
    setOffersOnly(false);
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setRoomsFilter('all');
    setStatusFilter('all');
    setSortBy('availability');
    setSearchParams({}, { replace: true });
  };

  // Dynamic Header Title and Subtitle based on active view
  const headerContent = useMemo(() => {
    if (activeListingTab === 'offers' || offersOnly) {
      return {
        title: 'عروض وتخفيضات عقارات دمياط الجديدة',
        subtitle: 'تصفح أقوى التخفيضات والخصومات الحصرية لفترة محدودة على الشقق والفيلات والغرف',
        badge: 'عروض وتخفيضات حصرية',
      };
    }
    if (activeListingTab === 'sale') {
      return {
        title: propertyType === 'apartment' ? 'شقق للبيع في دمياط الجديدة' : 'عقارات للبيع في دمياط الجديدة',
        subtitle: 'تصفح أفضل الفرص الاستثمارية والسكنية المتاحة للشراء والتملك الفوري',
        badge: 'بيع وتملك',
      };
    }
    if (activeListingTab === 'rent_whole') {
      return {
        title: 'شقق للإيجار بالكامل',
        subtitle: 'شقق ووحدات سكنية مستقلة متاحة للإيجار العائلي والشهري',
        badge: 'إيجار مستقل',
      };
    }
    if (activeListingTab === 'rent_room') {
      return {
        title: 'عقارات للإيجار بنظام الغرف المستقلة',
        subtitle: 'غرف فردية ومستقلة متاحة للحجز المباشر بالوحدة في أرقى أحياء دمياط الجديدة',
        badge: 'إيجار بالغرف',
      };
    }
    if (activeListingTab === 'furnished') {
      return {
        title: 'شقق وعقارات مفروشة بالكامل',
        subtitle: 'وحدات جاهزة للسكن الفوري ومجهزة بكافة الأجهزة والفرش العصري',
        badge: 'سكن مفروش',
      };
    }
    return {
      title: 'عقارات دمياط الجديدة',
      subtitle: 'تصفح أحدث عروض الشقق والفيلات والمحلات التجارية المتاحة للبيع والإيجار',
      badge: 'السوق العقاري',
    };
  }, [activeListingTab, propertyType]);

  // Contextual empty state message
  const emptyStateContent = useMemo(() => {
    if (activeListingTab === 'offers' || offersOnly) {
      return {
        title: 'لا توجد عروض أو خصومات نشطة حالياً مطابقة للبحث',
        desc: 'يمكنك تصفح باقي العقارات المتاحة أو إعادة ضبط خيارات الفلترة لمشاهدة كافة الوحدات المعروضة.',
        actionText: 'عرض كافة العقارات',
        actionTab: 'all' as ActiveListingTab,
      };
    }
    if (activeListingTab === 'furnished') {
      return {
        title: 'لا توجد شقق مفروشة متاحة حاليًا',
        desc: 'لم نجد شقق مفروشة تطابق خياراتك، يمكنك تصفح باقي الشقق أو إرسال طلب خاص لنوفره لك.',
        actionText: 'عرض كافة الإيجارات',
        actionTab: 'rent_whole' as ActiveListingTab,
      };
    }
    if (activeListingTab === 'rent_room') {
      return {
        title: 'لا توجد غرف متاحة للإيجار حاليًا',
        desc: 'لا تتوفر غرف شاغرة وفقاً لخيارات التصفية الحالية. جرب تصفح باقي خيارات الإيجار.',
        actionText: 'عرض كافة الإيجارات',
        actionTab: 'rent_whole' as ActiveListingTab,
      };
    }
    if (activeListingTab === 'sale') {
      return {
        title: 'لا توجد عقارات للبيع مطابقة للبحث',
        desc: 'جرب توسيع نطاق السعر أو تغيير الحي المطلوب، أو تواصل معنا لمساعدتك.',
        actionText: 'عرض كافة العقارات',
        actionTab: 'all' as ActiveListingTab,
      };
    }
    return {
      title: 'لم نجد أي عقار مطابق لبحثك',
      desc: 'جرب تغيير الفلاتر أو الميزانية، أو أضف طلبك وسيقوم فريق سكني بالبحث لك عن العقار المطلوب.',
      actionText: 'عرض كافة العقارات',
      actionTab: 'all' as ActiveListingTab,
    };
  }, [activeListingTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" dir="rtl">
      
      {/* Page Title & Search Header */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#8D6A28] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{headerContent.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {headerContent.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {headerContent.subtitle}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث بالمنطقة، كود العقار، الكلمات المفتاحية..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateUrlParams({ q: e.target.value || null });
              }}
              className="w-full pr-11 pl-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs text-sm font-bold text-slate-900 focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/20 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  updateUrlParams({ q: null });
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-5 py-3.5 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              showAdvancedFilters 
                ? 'bg-[#0F172A] text-white border-[#0F172A]' 
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>تصفية متقدمة</span>
          </button>
        </div>

        {/* Primary Listing Mode Filter Pills (الكل / عروض وتخفيضات / شقق للبيع / شقق للإيجار / إيجار بالغرف / شقق مفروشة) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeListingTab === 'all'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الكل ({properties.length})
          </button>

          {/* Offers & Discounts Tab */}
          <button
            onClick={() => handleTabChange(activeListingTab === 'offers' ? 'all' : 'offers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeListingTab === 'offers' || offersOnly
                ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white shadow-md'
                : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeListingTab === 'offers' || offersOnly ? 'fill-amber-200 text-amber-200 animate-pulse' : 'fill-rose-500 text-rose-500'}`} />
            <span>عروض وتخفيضات ({properties.filter(p => evaluatePropertyOffer(p).isActive).length})</span>
          </button>

          <button
            onClick={() => handleTabChange('sale')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeListingTab === 'sale'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>شقق للبيع ({properties.filter(p => p.operation_type === 'sale').length})</span>
          </button>

          <button
            onClick={() => handleTabChange('rent_whole')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeListingTab === 'rent_whole'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            <span>شقق للإيجار بالكامل ({properties.filter(p => p.operation_type === 'rent' && (!p.has_detailed_rooms || !p.detailed_rooms?.length)).length})</span>
          </button>

          <button
            onClick={() => handleTabChange('rent_room')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeListingTab === 'rent_room'
                ? 'bg-[#8D6A28] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>إيجار بالغرف ({properties.filter(p => p.operation_type === 'rent' && p.has_detailed_rooms && (p.detailed_rooms?.length || 0) > 0).length})</span>
          </button>

          <button
            onClick={() => handleTabChange('furnished')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeListingTab === 'furnished'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>شقق مفروشة ({properties.filter(p => p.furnishing === 'furnished').length})</span>
          </button>

          {/* Quick District Pills */}
          <div className="h-5 w-px bg-slate-300 mx-1 shrink-0" />

          {districts.map((dist) => (
            <button
              key={dist.id}
              onClick={() => {
                const nextDist = selectedDistrict === dist.id ? 'all' : dist.id;
                setSelectedDistrict(nextDist);
                updateUrlParams({ district: nextDist === 'all' ? null : nextDist });
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedDistrict === dist.id
                  ? 'bg-[#8D6A28] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {dist.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Popup */}
      {showAdvancedFilters && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6" dir="rtl">
          <button
            type="button"
            aria-label="إغلاق نافذة التصفية"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-default"
            onClick={() => setShowAdvancedFilters(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#8D6A28]" />
              خيارات التصفية التفصيلية
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط الفلاتر
              </button>
              <button type="button" onClick={() => setShowAdvancedFilters(false)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500" aria-label="إغلاق">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* District / Place Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span>المنطقة أو الحي</span>
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDistrict(val);
                  updateUrlParams({ district: val === 'all' ? null : val, place: null, location: null });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#8D6A28]"
              >
                <option value="all">كل أحياء دمياط الجديدة</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.available_count > 0 ? `(${d.available_count} متاح)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العقار</label>
              <select
                value={propertyType}
                onChange={(e) => {
                  const val = e.target.value as PropertyType | 'all';
                  setPropertyType(val);
                  updateUrlParams({ type: val === 'all' ? null : val });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">الكل</option>
                <option value="apartment">شقق سكنية</option>
                <option value="villa">فيلات</option>
                <option value="duplex">دوبلكس</option>
                <option value="shop">محلات تجارية</option>
                <option value="office">مكاتب إدارية</option>
                <option value="land">أراضي</option>
                <option value="chalet">شاليهات</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الغرف (على الأقل)</label>
              <select
                value={roomsFilter}
                onChange={(e) => {
                  setRoomsFilter(e.target.value);
                  updateUrlParams({ rooms: e.target.value === 'all' ? null : e.target.value });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">أي عدد غرف</option>
                <option value="1">1+ غرفة</option>
                <option value="2">2+ غرف</option>
                <option value="3">3+ غرف</option>
                <option value="4">4+ غرف وأكثر</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">أقل سعر (ج.م)</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  updateUrlParams({ min_price: e.target.value || null });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            {/* Availability Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">حالة الإتاحة</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value as PropertyStatus | 'all';
                  setStatusFilter(val);
                  updateUrlParams({ status: val === 'all' ? null : val });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="reserved">محجوز</option>
                <option value="rented">تم التأجير</option>
                <option value="sold">تم البيع</option>
              </select>
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">أعلى سعر (ج.م)</label>
              <input
                type="number"
                placeholder="بلا حد أقصى"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  updateUrlParams({ max_price: e.target.value || null });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            {/* Audience Classification Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الفئة المستهدفة</label>
              <select
                value={audienceFilter}
                onChange={(e) => {
                  const val = e.target.value as AudienceType | 'all';
                  setAudienceFilter(val);
                  updateUrlParams({ audience: val === 'all' ? null : val });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">الكل / مناسب للجميع</option>
                <option value="families">عائلات فقط</option>
                <option value="young_men">شباب / مهندسين</option>
                <option value="female_students">طالبات ومغتربات</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button type="button" onClick={() => setShowAdvancedFilters(false)} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">
              تطبيق الفلاتر
            </button>
          </div>
          </div>
        </div>
      , document.body)}

      {/* Sorting & Proximity & Results Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold">
            تم العثور على <span className="text-[#8D6A28] font-black">{filteredProperties.length}</span> عقار
          </span>

          {/* Proximity Toggle Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleProximity}
              disabled={isLocating}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-[11px] shadow-2xs ${
                isProximityActive
                  ? 'bg-[#8D6A28] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'جاري تحديد موقعك...' : isProximityActive ? 'بحث الأقرب لموقعي (مفعل)' : 'الأقرب لموقعي'}</span>
            </button>

            {/* Proximity Radius Selector (shown when proximity active) */}
            {isProximityActive && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200/80 text-[11px] font-bold text-amber-900">
                <span>نطاق:</span>
                <select
                  value={proximityRadius}
                  onChange={(e) => setProximityRadius(Number(e.target.value))}
                  className="bg-transparent font-black text-[#8D6A28] outline-none cursor-pointer"
                >
                  <option value={1}>1 كم</option>
                  <option value={3}>3 كم</option>
                  <option value={5}>5 كم</option>
                  <option value={10}>10 كم</option>
                  <option value={20}>20 كم</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">ترتيب حسب:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              updateUrlParams({ sort: e.target.value });
            }}
            className="bg-transparent font-bold text-slate-900 border-none outline-none cursor-pointer text-xs"
          >
            {isProximityActive && <option value="distance">الأقرب جغرافياً (مسافة)</option>}
            <option value="availability">المتاح أولاً</option>
            <option value="newest">الأحدث أولاً</option>
            <option value="discount_desc">🔥 أعلى نسبة خصم</option>
            <option value="price_asc">الأقل سعراً</option>
            <option value="price_desc">الأعلى سعراً</option>
            <option value="area_desc">الأكبر مساحة</option>
          </select>
        </div>
      </div>

      {/* Properties Grid or Contextual Empty State */}
      {isLoading ? (
        <PropertyGridSkeleton count={6} />
      ) : filteredProperties.length === 0 ? (
        <div className="py-16 sm:py-20 px-4 text-center space-y-4 bg-slate-50/80 rounded-3xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{emptyStateContent.title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {emptyStateContent.desc}
          </p>
          
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleTabChange(emptyStateContent.actionTab)}
              className="px-5 py-2.5 rounded-xl bg-[#8D6A28] text-white text-xs font-bold hover:bg-[#AC7F2B] transition cursor-pointer shadow-sm"
            >
              {emptyStateContent.actionText}
            </button>

            {onOpenNeedModal && (
              <button
                onClick={onOpenNeedModal}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <HelpCircle className="w-4 h-4 text-[#8D6A28]" />
                <span>طلب عقار بمواصفات خاصة</span>
              </button>
            )}

            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorite={favorites.includes(property.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectProperty={onSelectProperty}
              onQuickPreview={onQuickPreview}
            />
          ))}
        </div>
      )}

    </div>
  );
};
