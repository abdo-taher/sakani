import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { LocationDistrict, Property } from '../types';
import { SEOHead } from '../components/SEOHead';
import { buildLocationSchema, buildBreadcrumbsSchema, SITE_BASE_URL } from '../utils/seo';
import { 
  MapPin, 
  Search, 
  Building2, 
  Sparkles, 
  KeyRound, 
  ChevronLeft, 
  GraduationCap, 
  TreePine, 
  Waves, 
  Landmark, 
  Compass, 
  CheckCircle2,
  Users,
  Tag,
  Loader2
} from 'lucide-react';
import { ModernStateFeedback, LocationSectionSkeleton, PropertyGridSkeleton } from '../components/Skeletons';
import { PageLoader } from '../components/PageLoader';
import { PropertyCard } from '../components/PropertyCard';
import { resolveImageUrl, FALLBACK_PROPERTY_IMAGE, sanitizePropertyMedia } from '../utils/media';
import { ApiService } from '../services/apiService';

interface PlacesPageProps {
  districts?: LocationDistrict[];
  properties?: Property[];
}

interface DistrictExtendedInfo {
  tag: string;
  tagColor: string;
  category: 'luxury' | 'student' | 'compounds' | 'coastal' | 'central';
  avgRent: string;
  avgSale: string;
  rentPrices: number[];
  salePrices: number[];
  suitableFor: string;
  landmarks: string[];
  features: string[];
  nearbyServices: string[];
  propertyTypes: Record<string, number>;
  finishingTypes: Record<string, number>;
  avgArea: number;
  avgRooms: number;
}

// Helper: format price in Egyptian pounds
const formatPrice = (price: number): string => {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)} مليون ج.م`;
  if (price >= 1_000) return `${Math.round(price / 1_000)},${String(price % 1_000).padStart(3, '0').slice(0, 3)} ج.م`;
  return `${price.toLocaleString('ar-EG')} ج.م`;
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'شقة', villa: 'فيلا', duplex: 'دوبلكس', studio: 'ستوديو', penthouse: 'بنتهاوس', chalet: 'شاليه', office: 'مكتب', clinic: 'عيادة', shop: 'محل', warehouse: 'مستودع', land: 'أرض', townhouse: 'تاون هاوس', twin_house: 'توين هاوس', mansion: 'قصر', other: 'أخرى',
};

const FINISHING_LABELS: Record<string, string> = {
  super_lux: 'سوبر لوكس', lux: 'لوكس', semi_finished: 'نصف تشطيب', red_brick: 'بناء أحمر', furnished: 'مفروش',
};

function deriveCategoryAndTag(props: Property[]): { category: DistrictExtendedInfo['category']; tag: string; tagColor: string; suitableFor: string } {
  const typeCounts: Record<string, number> = {};
  props.forEach(p => { const t = p.property_type || 'apartment'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'apartment';
  const rentCount = props.filter(p => p.operation_type === 'rent').length;
  const saleCount = props.filter(p => p.operation_type === 'sale').length;
  let category: DistrictExtendedInfo['category'] = 'central';
  let tag = '';
  let tagColor = 'bg-slate-100 text-slate-800 border-slate-200';
  if (topType === 'villa' || topType === 'duplex' || topType === 'penthouse' || topType === 'mansion') {
    category = 'luxury'; tag = topType === 'villa' ? 'فيلات وقصور فاخرة' : topType === 'duplex' ? 'دوبلكس راقية' : 'سكن فاخر';
    tagColor = 'bg-amber-100 text-amber-900 border-amber-200';
  } else if (topType === 'chalet') {
    category = 'coastal'; tag = 'شاطئي ومصيفي'; tagColor = 'bg-cyan-100 text-cyan-900 border-cyan-200';
  } else if (rentCount > saleCount * 2) {
    category = 'student'; tag = 'سكن طلابي نشط'; tagColor = 'bg-indigo-100 text-indigo-900 border-indigo-200';
  } else if (topType === 'apartment' && saleCount > rentCount) {
    category = 'compounds'; tag = 'كمبوندات سكنية'; tagColor = 'bg-orange-100 text-orange-900 border-orange-200';
  } else {
    category = 'central'; tag = 'منطقة سكنية نشطة'; tagColor = 'bg-blue-100 text-blue-900 border-blue-200';
  }
  const suitableParts: string[] = [];
  if (rentCount > 0) suitableParts.push(`${rentCount} إيجار`);
  if (saleCount > 0) suitableParts.push(`${saleCount} بيع`);
  const suitableFor = suitableParts.length > 0 ? `${suitableParts.join(' / ')} — ${typeCounts[topType] || 0} وحدة ${PROPERTY_TYPE_LABELS[topType] || topType}` : 'بيانات ديناميكية من العقارات المتاحة';
  return { category, tag, tagColor, suitableFor };
}

export const PlacesPage: React.FC<PlacesPageProps> = ({ districts: propDistricts, properties: propProperties }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'luxury' | 'student' | 'compounds' | 'coastal' | 'central'>('all');

  // Internal data state (fetched from backend API)
  const [districts, setDistricts] = useState<LocationDistrict[]>(propDistricts || []);
  const [properties, setProperties] = useState<Property[]>(propProperties || []);
  const [isLoading, setIsLoading] = useState(!propDistricts || propDistricts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [bestProperties, setBestProperties] = useState<Property[]>([]);
  const [isLoadingBest, setIsLoadingBest] = useState(false);

  // Fetch data from backend API on mount
  useEffect(() => {
    const fetchData = async () => {
      // If props already provide data, skip fetching
      if (propDistricts && propDistricts.length > 0 && propProperties && propProperties.length > 0) {
        setDistricts(propDistricts);
        setProperties(propProperties);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [rawLocations, rawProperties] = await Promise.allSettled([
          ApiService.getLocations(),
          ApiService.getProperties(),
        ]);

        // Process locations
        if (rawLocations.status === 'fulfilled' && Array.isArray(rawLocations.value) && rawLocations.value.length > 0) {
          const mappedDistricts: LocationDistrict[] = rawLocations.value.map((d: any) => ({
            id: String(d.id),
            name: d.name,
            available_count: Number(d.available_count) || 0,
            image_url: resolveImageUrl(d.image_url),
            description: d.address || d.description || '',
            coordinates: (d.latitude && d.longitude) ? { lat: Number(d.latitude), lng: Number(d.longitude) } : undefined,
          }));
          setDistricts(mappedDistricts);
        }

        // Process properties
        if (rawProperties.status === 'fulfilled' && Array.isArray(rawProperties.value) && rawProperties.value.length > 0) {
          const mappedProps: Property[] = rawProperties.value.map((p: any) => sanitizePropertyMedia({
            id: String(p.id),
            ref_id: p.ref_id || `SK-${p.id}`,
            title: p.title,
            description: p.description || '',
            price: Number(p.price) || 0,
            is_negotiable: Boolean(p.is_negotiable),
            rent_duration: p.rent_duration || 'monthly',
            operation_type: p.category?.slug === 'rent' || p.operation_type === 'rent' ? 'rent' : 'sale',
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
            status: p.status || 'available',
            featured: Boolean(p.featured),
            views: Number(p.views) || 0,
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
                  imageUrl: r.room_images?.[0]?.image_url || r.primary_image?.image_url || r.primary_image?.url || r.imageUrl,
                  images: r.room_images?.map((img: any) => img.image_url) || [],
                }))
              : [],
            created_at: p.created_at || new Date().toISOString(),
          }));
          setProperties(mappedProps);
        }
      } catch (err: any) {
        console.error('Failed to load places data:', err);
        setError('فشل تحميل البيانات من الخادم. تأكد من اتصالك بالإنترنت.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [propDistricts, propProperties]);

  // Fetch best/featured properties separately
  useEffect(() => {
    const fetchBest = async () => {
      try {
        setIsLoadingBest(true);
        const raw = await ApiService.getFeaturedProperties();
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped: Property[] = raw.map((p: any) => sanitizePropertyMedia({
            id: String(p.id),
            ref_id: p.ref_id || `SK-${p.id}`,
            title: p.title,
            description: p.description || '',
            price: Number(p.price) || 0,
            is_negotiable: Boolean(p.is_negotiable),
            rent_duration: p.rent_duration || 'monthly',
            operation_type: p.category?.slug === 'rent' || p.operation_type === 'rent' ? 'rent' : 'sale',
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
            status: p.status || 'available',
            featured: Boolean(p.featured),
            views: Number(p.views) || 0,
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
            detailed_rooms: [],
            created_at: p.created_at || new Date().toISOString(),
          }));
          setBestProperties(mapped);
        }
      } catch (err) {
        console.error('Failed to load best properties:', err);
      } finally {
        setIsLoadingBest(false);
      }
    };
    fetchBest();
  }, []);

  // Compute live property counts and ALL dynamic info from API data
  const enhancedDistricts = useMemo(() => {
    return districts.map((district) => {
      const matchingProps = properties.filter((p) => {
        const dId = String(district.id || '').toLowerCase();
        const dName = String(district.name || '').toLowerCase();
        const pLoc = String(p.location_id || '').toLowerCase();
        const pDist = String(p.district_name || '').toLowerCase();
        return pLoc === dId || pDist === dName || pDist.includes(dName) || dName.includes(pDist);
      });

      const rentProps = matchingProps.filter(p => p.operation_type === 'rent');
      const saleProps = matchingProps.filter(p => p.operation_type === 'sale');
      const rentCount = rentProps.length;
      const saleCount = saleProps.length;

      const rentPrices = rentProps.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
      const salePrices = saleProps.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);

      const avgRent = rentPrices.length > 0
        ? rentPrices.length === 1 ? `${formatPrice(rentPrices[0])} / شهر` : `${formatPrice(rentPrices[0])} - ${formatPrice(rentPrices[rentPrices.length - 1])} / شهر`
        : null;
      const avgSale = salePrices.length > 0
        ? salePrices.length === 1 ? formatPrice(salePrices[0]) : `${formatPrice(salePrices[0])} - ${formatPrice(salePrices[salePrices.length - 1])}`
        : null;

      const propertyTypes: Record<string, number> = {};
      matchingProps.forEach(p => { const t = p.property_type || 'apartment'; propertyTypes[t] = (propertyTypes[t] || 0) + 1; });
      const finishingTypes: Record<string, number> = {};
      matchingProps.forEach(p => { const f = p.finishing || 'super_lux'; finishingTypes[f] = (finishingTypes[f] || 0) + 1; });
      const areas = matchingProps.map(p => p.area).filter(a => a > 0);
      const roomsArr = matchingProps.map(p => p.rooms).filter(r => r > 0);
      const avgArea = areas.length > 0 ? Math.round(areas.reduce((s, a) => s + a, 0) / areas.length) : 0;
      const avgRooms = roomsArr.length > 0 ? Math.round(roomsArr.reduce((s, r) => s + r, 0) / roomsArr.length) : 0;

      const allAmenities = new Set<string>();
      matchingProps.forEach(p => {
        if (Array.isArray(p.amenities)) {
          p.amenities.forEach((a: any) => { const name = typeof a === 'string' ? a : (a.name || a.slug || ''); if (name) allAmenities.add(name); });
        }
      });
      const nearbyServices = Array.from(allAmenities).slice(0, 6);

      const { category, tag, tagColor, suitableFor } = deriveCategoryAndTag(matchingProps);

      const features: string[] = [];
      if (avgArea > 0) features.push(`مساحة متوسطة ${avgArea} م²`);
      if (avgRooms > 0) features.push(`${avgRooms} غرف في المتوسط`);
      const topFinishing = Object.entries(finishingTypes).sort((a, b) => b[1] - a[1])[0];
      if (topFinishing) features.push(`معظم التشطيبات: ${FINISHING_LABELS[topFinishing[0]] || topFinishing[0]}`);
      const furnishedCount = matchingProps.filter(p => p.furnishing === 'furnished').length;
      if (furnishedCount > 0) features.push(`${furnishedCount} وحدة مفروشة`);

      return {
        ...district,
        totalAvailable: matchingProps.length || district.available_count || 0,
        rentCount,
        saleCount,
        extra: {
          tag, tagColor, category,
          avgRent: avgRent || 'لا توجد بيانات',
          avgSale: avgSale || 'لا توجد بيانات',
          rentPrices, salePrices,
          suitableFor,
          landmarks: nearbyServices.length > 0 ? nearbyServices : ['بيانات المعالم من العقارات'],
          features, nearbyServices, propertyTypes, finishingTypes, avgArea, avgRooms,
        }
      };
    });
  }, [districts, properties]);

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    return enhancedDistricts.filter((dist) => {
      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchName = dist.name.toLowerCase().includes(term);
        const matchDesc = dist.description?.toLowerCase().includes(term);
        const matchLandmarks = dist.extra.landmarks.some(l => l.toLowerCase().includes(term));
        if (!matchName && !matchDesc && !matchLandmarks) return false;
      }

      // Category filter
      if (activeCategory !== 'all') {
        if (dist.extra.category !== activeCategory) return false;
      }

      return true;
    });
  }, [enhancedDistricts, searchTerm, activeCategory]);

  const { districtId } = useParams<{ districtId?: string }>();

  const currentDistrict = useMemo(() => {
    if (!districtId) return null;
    return districts.find(d => d.id === districtId || d.name === districtId);
  }, [districtId, districts]);

  const seoTitle = currentDistrict 
    ? `أحياء وعقارات ${currentDistrict.name} - دمياط الجديدة | سكني`
    : 'دليل أحياء ومناطق دمياط الجديدة - أسعار السكن والاستثمار | سكني';

  const seoDescription = currentDistrict
    ? `دليل ومواصفات السكن في ${currentDistrict.name} بدمياط الجديدة. تصفح كافة الشقق والعقارات المعروضة ومتوسط الأسعار عبر منصة سكني.`
    : 'استكشف أهم أحياء ومناطق دمياط الجديدة: المنطقة المركزية، منطقة 27، سكن مصر، دار مصر، والحي المتميز. دليلك الشامل لمتوسط الأسعار والخدمات.';

  const seoCanonical = currentDistrict
    ? `${SITE_BASE_URL}/places/${encodeURIComponent(currentDistrict.id)}`
    : `${SITE_BASE_URL}/places`;

  const categories = [
    { id: 'all', label: 'كافة الأحياء والمناطق', icon: Compass },
    { id: 'luxury', label: 'أحياء راقية وفيلات', icon: Sparkles },
    { id: 'student', label: 'سكن الطلبة والجامعات', icon: GraduationCap },
    { id: 'compounds', label: 'كمبوندات وإسكان متكامل', icon: TreePine },
    { id: 'coastal', label: 'ساحلي ومصيف', icon: Waves },
    { id: 'central', label: 'المناطق التجارية والمركزية', icon: Landmark },
  ];

  const locationSchemas = useMemo(() => {
    if (currentDistrict) {
      return [
        buildLocationSchema(currentDistrict),
        buildBreadcrumbsSchema([
          { name: 'الرئيسية', url: '/' },
          { name: 'دليل الأحياء والمناطق', url: '/places' },
          { name: currentDistrict.name, url: `/places/${currentDistrict.id}` },
        ]),
      ].filter(Boolean);
    }
    return [
      buildBreadcrumbsSchema([
        { name: 'الرئيسية', url: '/' },
        { name: 'دليل الأحياء والمناطق', url: '/places' },
      ]),
    ];
  }, [currentDistrict]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-20 pt-4" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <PageLoader 
            fullScreen={false}
            message="جاري تحميل دليل أحياء دمياط الجديدة..." 
            subMessage="نستعرض لك أفضل المناطق والفرص السكنية والاستثمارية 🏙️"
            stages={[
              'جاري الاتصال بقاعدة بيانات الأحياء والمناطق...',
              'جاري استخراج متوسط الأسعار وأحدث العقارات المتاحة...',
              'جاري تحضير الخرائط التفاعلية ومعاينات الأحياء...'
            ]}
          />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-20 pt-4" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center">
            <ModernStateFeedback
              type="error"
              title="خطأ في تحميل البيانات"
              description={error}
              actionText="إعادة المحاولة"
              onAction={() => { setError(null); setIsLoading(true); window.location.reload(); }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-4" dir="rtl">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
        schema={locationSchemas}
      />
      
      {/* ----------------- 1. HERO BANNER ----------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-[#0F172A] text-white p-6 sm:p-12 shadow-2xl border border-slate-800">
          
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-5 text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-[#8D6A28]/40 text-xs font-black text-[#D6A94E]">
              <MapPin className="w-4 h-4 text-[#D6A94E]" />
              <span>دليل وخريطة أحياء دمياط الجديدة</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              تعرّف على أحياء دمياط الجديدة واختر مكانك الأنسب
            </h1>

            <p className="text-xs sm:text-base text-slate-300 font-medium leading-relaxed">
              استكشف تفاصيل كل حي بالمدينة، من متوسط الأسعار وأهم المعالم إلى مدى قربه من الجامعات والشاطئ، مع إمكانية تصفح كافة الشقق والعقارات المعروضة في كل منطقة بنقرة واحدة.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pt-2 text-xs font-bold text-slate-200">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <Building2 className="w-3.5 h-3.5 text-[#D6A94E]" />
                {districts.length} أحياء ومناطق رئيسية
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {properties.length}+ عقار متاح ومفحوص
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث باسم الحي، المعالم (حورس، الشاطئ، المستشفى، سكن مصر)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-11 pl-4 py-3 sm:py-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs text-xs sm:text-sm font-bold text-slate-900 focus:border-[#8D6A28] focus:ring-2 focus:ring-[#8D6A28]/20 outline-none transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D6A94E]' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- 3. DISTRICTS GRID ----------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {filteredDistricts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
            <ModernStateFeedback
              type="empty"
              title="لم يتم العثور على أحياء مطابقة للبحث"
              description="جرب كتابة اسم مختلف أو اختر تصنيفاً آخر لمشاهدة باقي الأحياء والمناطق في دمياط الجديدة."
              actionText="عرض كافة الأحياء والمناطق"
              onAction={() => { setSearchTerm(''); setActiveCategory('all'); }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredDistricts.map((district) => {
              return (
                <div
                  key={district.id}
                  className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between text-right"
                >
                  <div>
                    {/* Image Header with Badges */}
                    <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                      <img
                        src={resolveImageUrl(district.image_url)}
                        alt={district.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border backdrop-blur-md shadow-xs ${district.extra.tagColor}`}>
                          {district.extra.tag}
                        </span>

                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/15">
                          {district.totalAvailable} عقار متاح
                        </span>
                      </div>

                      {/* District Title inside Image */}
                      <div className="absolute bottom-3 right-3 left-3 text-white">
                        <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-sm flex items-center gap-1.5">
                          <MapPin className="w-5 h-5 text-[#D6A94E] shrink-0" />
                          <span>{district.name}</span>
                        </h2>
                      </div>
                    </div>

                    {/* Card Body Content */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        {district.description}
                      </p>

                      {/* Dynamic Price Range Box */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-500">اسعار الايجار ({district.rentCount}):</span>
                          <span className="font-black text-[#8D6A28]">{district.extra.avgRent}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-1.5">
                          <span className="font-bold text-slate-500">اسعار البيع ({district.saleCount}):</span>
                          <span className="font-black text-slate-900">{district.extra.avgSale}</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-5 sm:p-6 pt-0 space-y-2 border-t border-slate-100 mt-2">
                    
                    {/* Primary Button: Browse All in this district */}
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/properties?district=${encodeURIComponent(district.id)}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-3 rounded-xl border-2 border-[#8D6A28]/30 bg-[#8D6A28]/5 hover:bg-[#8D6A28] hover:border-[#8D6A28] text-[#8D6A28] hover:text-white text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group/btn"
                    >
                      <Building2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                      <span>استعراض كافة العقارات</span>
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                    </button>

                    {/* Secondary Quick Operation Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/properties?operation=rent&district=${encodeURIComponent(district.id)}`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-[#8D6A28]" />
                        <span>شقق الإيجار ({district.rentCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/properties?operation=sale&district=${encodeURIComponent(district.id)}`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>عقارات البيع ({district.saleCount})</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------- 4. BEST PROPERTIES SECTION ----------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-semibold mb-2 border border-slate-200/80">
                <Sparkles className="w-3.5 h-3.5 text-[#8D6A28]" />
                <span>أفضل الفرص العقارية المتاحة</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                أفضل العقارات والخدمات المميزة
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1">
                أعلى العقارات تقييماً وأفضل الأسعار في دمياط الجديدة، محدّثة يومياً من قاعدة البيانات
              </p>
            </div>
            <button
              onClick={() => {
                navigate('/properties');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8D6A28] hover:text-[#AC7F2B] transition cursor-pointer self-start sm:self-auto"
            >
              <span>عرض جميع العقارات</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {isLoadingBest ? (
            <PropertyGridSkeleton count={6} />
          ) : bestProperties.length > 0 ? (
            <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 gap-4 sm:gap-6 snap-x sm:snap-none scrollbar-hide sm:grid-cols-2 lg:grid-cols-3 -mx-4 px-4 sm:mx-0 sm:px-0">
              {bestProperties.map((property) => (
                <div key={property.id} className="min-w-[285px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink w-[82vw] sm:w-auto">
                  <PropertyCard
                    property={property}
                    isFavorite={false}
                    onToggleFavorite={() => {}}
                    onSelectProperty={(p) => navigate(`/property/${p.id}`)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-500">لا توجد عقارات مميزة متاحة حالياً</p>
            </div>
          )}
        </div>
      </div>

      {/* ----------------- 5. BOTTOM ADVISORY CTA BANNER ----------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-right">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              محتار تختار أي حي يناسب ميزانيتك وعائلتك؟
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              تواصل مع مستشاري سكني العقاريين مجاناً لنساعدك في اختيار المنطقة الأنسب لك ولأبنائك أو للبدء في استثمار عقاري مضمون بدمياط الجديدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                navigate('/need-property');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 sm:px-8 py-3 rounded-xl bg-[#8D6A28] hover:bg-[#A07A2E] text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              طلب استشارة وبحث مخصص
            </button>
            <button
              onClick={() => {
                navigate('/properties');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 sm:px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/30 transition-all duration-300 cursor-pointer"
            >
              تصفح كافة العقارات
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
