import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationDistrict, Property } from '../types';
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
  Loader2,
  RefreshCw
} from 'lucide-react';
import { ModernStateFeedback, LocationSectionSkeleton, PropertyGridSkeleton } from '../components/Skeletons';
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
  suitableFor: string;
  landmarks: string[];
  features: string[];
}

const DISTRICT_EXTRAS: Record<string, DistrictExtendedInfo> = {
  'district-5': {
    tag: 'سكن فاخر وراقي',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-200',
    category: 'luxury',
    avgRent: '4,500 - 9,000 ج.م / شهر',
    avgSale: '2.5 - 5.5 مليون ج.م',
    suitableFor: 'العائلات، الأطباء، والمهندسين والباحثين عن هدوء ورقي',
    landmarks: ['نادي المستقبل الرياضي', 'الحديقة الدولية', 'مجمع المدارس الدولية', 'على بُعد 5 دقائق من الشاطئ'],
    features: ['شوارع عريضة وتشجير كثيف', 'مباني حديثة ومصاعد حديثة', 'هدوء تام وخصوصية عالية', 'قرب الخدمات ومراكز التسوق']
  },
  'district-4': {
    tag: 'هادئ ومثالي للعائلات',
    tagColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    category: 'luxury',
    avgRent: '4,000 - 8,000 ج.م / شهر',
    avgSale: '2.2 - 4.8 مليون ج.م',
    suitableFor: 'العائلات الكبيرة والأسر الباحثة عن سكن متكامل قريب من المدارس',
    landmarks: ['مدرسة دمياط التجريبية', 'المجمع الطبي التخصصي', 'مسجد التوحيد', 'حدائق ومساحات لعب للأطفال'],
    features: ['مساحات خضراء واسعة', 'قريب من قلب المدينة والشاطئ', 'أمان عالي ومداخل ميسرة', 'توافر كافة الخدمات اليومية']
  },
  'district-central': {
    tag: 'القلب التجاري والإداري',
    tagColor: 'bg-blue-100 text-blue-900 border-blue-200',
    category: 'central',
    avgRent: '3,500 - 7,500 ج.م / شهر',
    avgSale: '2.0 - 4.5 مليون ج.م',
    suitableFor: 'التجار، أصحاب الشركات، العيادات، والموظفين',
    landmarks: ['جهاز تنمية مدينة دمياط الجديدة', 'مجمع البنوك والشركات', 'سيتي مول والمول التجاري', 'موقف المواصلات الرئيسي'],
    features: ['شريان الحركة والنشاط بالمدينة', 'أعلى كثافة تجارية وحركة زبائن', 'مواصلات مباشرة لكافة الأحياء', 'بنوك ومصالح حكومية']
  },
  'district-distinguished': {
    tag: 'فيلات وقصور دوبلكس',
    tagColor: 'bg-purple-100 text-purple-900 border-purple-200',
    category: 'luxury',
    avgRent: '6,000 - 15,000 ج.م / شهر',
    avgSale: '4.5 - 12.0 مليون ج.م',
    suitableFor: 'رجال الأعمال، صفوة المجتمع، وعشاق الفخامة والاستقلالية',
    landmarks: ['منطقة الفيلات الفاخرة', 'طريق الكورنيش الشمالي', 'نوادي خاصة', 'حدائق خاصة مستقلة'],
    features: ['تصميمات معمارية فخمة', 'أقصى درجات الخصوصية والأمان', 'إطلالات بحرية وخضراء مفتوحة', 'مساحات أراضي واسعة']
  },
  'district-chalets': {
    tag: 'شاطئي وسياحي مصيفي',
    tagColor: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    category: 'coastal',
    avgRent: '5,000 - 12,000 ج.م / شهر',
    avgSale: '3.0 - 7.0 مليون ج.م',
    suitableFor: 'المصطافين، الإيجار الموسمي، والاستثمار السياحي عالي العائد',
    landmarks: ['شاطئ دمياط الجديدة العام والخاص', 'كورنيش البحر الأبيض المتوسط', 'مطاعم وكافيهات شاطئية', 'ممشى الدراجات الرياضي'],
    features: ['مواجهة للبحر مباشرة', 'عائد إيجاري صيفي ممتاز', 'إطلالات بحرية خلابة', 'أجواء مصيفية راقية طوال العام']
  },
  'district-sakan-misr': {
    tag: 'كمبوندات سكنية متكاملة',
    tagColor: 'bg-orange-100 text-orange-900 border-orange-200',
    category: 'compounds',
    avgRent: '3,000 - 6,000 ج.م / شهر',
    avgSale: '1.4 - 2.8 مليون ج.م',
    suitableFor: 'الشباب المتزوجين حديثاً، طلبة جامعة دمياط وحورس، والمستثمرين',
    landmarks: ['بوابات أمن وحراسة 24 ساعة', 'جامعة حورس الخاصة', 'جامعة دمياط الجديدة', 'مول ومسجد سكن مصر'],
    features: ['مجمعات مسورة بحراسة أمنية', 'تشطيبات حديثة ومساحات موحدة', 'قرب فائق من الجامعات والمواصلات', 'سوق إيجار نشط جداً للطلبة']
  },
  'district-dar-misr': {
    tag: 'كمبوند راقي مغلق',
    tagColor: 'bg-rose-100 text-rose-900 border-rose-200',
    category: 'compounds',
    avgRent: '3,800 - 7,000 ج.م / شهر',
    avgSale: '1.8 - 3.4 مليون ج.م',
    suitableFor: 'العائلات والمهندسين وأساتذة الجامعات',
    landmarks: ['موقع 1 و 2 دار مصر', 'حدائق مركزية داخل الكمبوند', 'مراكز خدمات تجارية', 'مصاعد وسياج شجري'],
    features: ['لاندسكيب ومساحات خضراء واسعة', 'بوابات إلكترونية ومصاعد', 'خصوصية عائلية ممتازة', 'عمارات نموذجية راقية']
  },
  'district-university': {
    tag: 'منطقة الجامعات وسكن الطلاب',
    tagColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    category: 'student',
    avgRent: '1,500 - 4,000 ج.م / غرفة',
    avgSale: '1.6 - 3.2 مليون ج.م',
    suitableFor: 'طلبة وطالبات جامعة دمياط وجامعة حورس والمغتربين',
    landmarks: ['جامعة دمياط المجمعة', 'جامعة حورس الدولية', 'المكتبات والمطاعم الطلابية', 'محطة السرفيس الجامعي'],
    features: ['سير على الأقدام إلى الكليات', 'شقق مقسمة لغرف مستقلة ومفروشة', 'إنترنت سريع وخدمات طلابية', 'أمان عالي ومباني مخصصة']
  }
};

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

  // Compute live property counts and dynamic info for each district
  const enhancedDistricts = useMemo(() => {
    return districts.map((district) => {
      // Find matching properties
      const matchingProps = properties.filter((p) => {
        const dId = String(district.id || '').toLowerCase();
        const dName = String(district.name || '').toLowerCase();
        const pLoc = String(p.location_id || '').toLowerCase();
        const pDist = String(p.district_name || '').toLowerCase();
        return pLoc === dId || pDist === dName || pDist.includes(dName) || dName.includes(pDist);
      });

      const rentCount = matchingProps.filter(p => p.operation_type === 'rent').length;
      const saleCount = matchingProps.filter(p => p.operation_type === 'sale').length;

      const extra = DISTRICT_EXTRAS[district.id] || {
        tag: 'منطقة سكنية متميزة',
        tagColor: 'bg-slate-100 text-slate-800 border-slate-200',
        category: 'luxury' as const,
        avgRent: '3,000 - 7,000 ج.م / شهر',
        avgSale: '1.8 - 4.5 مليون ج.م',
        suitableFor: 'العائلات والمستثمرين',
        landmarks: ['شوارع رئيسية ومساحات خضراء', 'قريب من الخدمات العامة والمحلات'],
        features: ['بيئة سكنية هادئة', 'خدمات متكاملة']
      };

      return {
        ...district,
        totalAvailable: matchingProps.length || district.available_count || 0,
        rentCount,
        saleCount,
        extra
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

  const categories = [
    { id: 'all', label: 'كافة الأحياء والمناطق', icon: Compass },
    { id: 'luxury', label: 'أحياء راقية وفيلات', icon: Sparkles },
    { id: 'student', label: 'سكن الطلبة والجامعات', icon: GraduationCap },
    { id: 'compounds', label: 'كمبوندات وإسكان متكامل', icon: TreePine },
    { id: 'coastal', label: 'ساحلي ومصيف', icon: Waves },
    { id: 'central', label: 'المناطق التجارية والمركزية', icon: Landmark },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-20 pt-4" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <LocationSectionSkeleton />
          <div className="flex flex-col items-center justify-center gap-4 mt-8">
            <Loader2 className="w-8 h-8 text-[#8D6A28] animate-spin" />
            <p className="text-sm font-bold text-slate-500">جاري تحميل بيانات الأحياء والعقارات...</p>
          </div>
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
                      
                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        {district.description}
                      </p>

                      {/* Estimated Price Range Box */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-500">متوسط الإيجار:</span>
                          <span className="font-black text-[#8D6A28]">{district.extra.avgRent}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-1.5">
                          <span className="font-bold text-slate-500">متوسط سعر البيع:</span>
                          <span className="font-black text-slate-900">{district.extra.avgSale}</span>
                        </div>
                      </div>

                      {/* Suitable For */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#8D6A28]" />
                          <span>الفئة الأكثر ملائمة:</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium bg-amber-50/60 text-amber-950 p-2.5 rounded-xl border border-amber-200/50">
                          {district.extra.suitableFor}
                        </p>
                      </div>

                      {/* Key Landmarks */}
                      {district.extra.landmarks.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                            <Landmark className="w-3.5 h-3.5 text-[#8D6A28]" />
                            <span>أهم المعالم والخدمات القريبة:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {district.extra.landmarks.map((landmark, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                              >
                                • {landmark}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

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
