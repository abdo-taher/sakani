import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Property, DetailedRoom } from '../types';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { AMENITIES_LIST } from '../data/mockData';
import { getAmenityDisplay } from '../utils/amenities';
import { PropertyLocationMap } from '../components/PropertyLocationMap';
import { PropertyMultiVideoPlayer } from '../components/PropertyMultiVideoPlayer';
import { PropertyVideoThumbnail } from '../components/PropertyVideoThumbnail';
import { PropertyDetailSkeleton, ModernStateFeedback } from '../components/Skeletons';
import { evaluatePropertyOffer } from '../utils/offerUtils';
import { FALLBACK_PROPERTY_IMAGE, sanitizePropertyMedia, resolveImageUrl } from '../utils/media';
import { SEOHead } from '../components/SEOHead';
import { 
  generatePropertyTitle, 
  generatePropertyDescription, 
  generatePropertyCanonicalUrl, 
  generatePropertyAltText, 
  buildRealEstateListingSchema, 
  buildBreadcrumbsSchema, 
  buildVideoSchema 
} from '../utils/seo';
import { 
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
  CheckCircle2, 
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
  Home,
  FileText,
  AlertCircle,
  Lock,
  Tag,
  Video,
  Play,
  X,
  Maximize
} from 'lucide-react';

interface PropertyDetailsPageProps {
  favorites: string[];
  onToggleFavorite: (id: string) => void;
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

export const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({
  favorites,
  onToggleFavorite,
  onOpenInquiry,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mediaMode, setMediaMode] = useState<'photos' | 'video'>('photos');
  const [autoPlayVideo, setAutoPlayVideo] = useState<boolean>(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [previewRoomImage, setPreviewRoomImage] = useState<string | null>(null);

  // Auto-switch to video if query param or hash requests it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      if (params.get('view') === 'video' || params.get('media') === 'video' || hash.includes('video')) {
        setMediaMode('video');
        setAutoPlayVideo(true);
      }
    }
  }, [id]);

  // Mortgage / Installment Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanYears, setLoanYears] = useState<number>(5);

  // Client reservation state tracking
  const [hasClientReservedProperty, setHasClientReservedProperty] = useState<boolean>(() => {
    return id ? StorageService.hasClientReservedProperty(id) : false;
  });
  const [clientReservedRoomIds, setClientReservedRoomIds] = useState<string[]>(() => {
    if (!id) return [];
    return StorageService.getClientReservations()
      .filter(r => String(r.property_id) === String(id) && r.room_id)
      .map(r => String(r.room_id));
  });

  // Listen for instant reservation creation events
  useEffect(() => {
    const handleReservationEvent = (e: any) => {
      if (e.detail && String(e.detail.propertyId) === String(id)) {
        if (e.detail.roomId) {
          setClientReservedRoomIds(prev => [...prev, String(e.detail.roomId)]);
        } else {
          setHasClientReservedProperty(true);
        }
      }
    };

    window.addEventListener('sakani_reservation_created', handleReservationEvent);
    return () => {
      window.removeEventListener('sakani_reservation_created', handleReservationEvent);
    };
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial render from local cache if available
    const prop = StorageService.getPropertyById(id);
    if (prop) {
      StorageService.incrementViews(prop.id);
      setProperty(prop);
      setLoading(false); // If cached locally, show instantly without waiting
    } else {
      setLoading(true); // Keep skeleton active until API finishes
    }
    setAllProperties(StorageService.getProperties());

    // Sync client reservation status
    if (StorageService.hasClientReservedProperty(id)) {
      setHasClientReservedProperty(true);
    }
    const reservedRooms = StorageService.getClientReservations()
      .filter(r => String(r.property_id) === String(id) && r.room_id)
      .map(r => String(r.room_id));
    if (reservedRooms.length > 0) {
      setClientReservedRoomIds(reservedRooms);
    }

    // Check with backend if phone exists
    const savedPhone = StorageService.getClientPhone();
    const numId = parseInt(id.replace(/\D/g, ''), 10);
    if (numId && savedPhone) {
      ApiService.checkReservation(numId, savedPhone).then(res => {
        if (isMounted && (res?.reserved || res?.is_same_customer)) {
          setHasClientReservedProperty(true);
        }
      }).catch(() => {});
    }

    // 2. Fetch live data from backend API
    const loadLiveProperty = async () => {
      if (!numId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        ApiService.recordPropertyView(numId).catch(() => {});
        const liveProp = await ApiService.getProperty(numId);
        if (liveProp && isMounted) {
          const mapped: Property = sanitizePropertyMedia({
            id: String(liveProp.id),
            ref_id: liveProp.ref_id || `SK-${liveProp.id}`,
            title: liveProp.title,
            description: liveProp.description || '',
            price: Number(liveProp.price) || 0,
            is_negotiable: Boolean(liveProp.is_negotiable),
            has_offer: Boolean(liveProp.has_offer),
            offer_price: liveProp.offer_price ? Number(liveProp.offer_price) : undefined,
            offer_discount_percentage: liveProp.offer_discount_percentage ? Number(liveProp.offer_discount_percentage) : undefined,
            offer_start_date: liveProp.offer_start_date || undefined,
            offer_end_date: liveProp.offer_end_date || undefined,
            offer_title: liveProp.offer_title || undefined,
            offer_badge: liveProp.offer_badge || undefined,
            rent_duration: liveProp.rent_duration || 'monthly',
            operation_type: liveProp.category?.slug === 'rent' || liveProp.operation_type === 'rent' ? 'rent' : 'sale',
            property_type: liveProp.property_type?.slug || liveProp.property_type || 'apartment',
            location_id: String(liveProp.location_id || liveProp.location?.id || 'district-5'),
            district_name: liveProp.location?.name || liveProp.district_name || 'دمياط الجديدة',
            address_detail: liveProp.address_detail || liveProp.address || '',
            owner_name: liveProp.owner_name || liveProp.contact_name || '',
            owner_phone: liveProp.owner_phone || liveProp.contact_phone || liveProp.phone || '',
            area: Number(liveProp.area) || 120,
            rooms: Number(liveProp.rooms) || 3,
            bathrooms: Number(liveProp.bathrooms) || 2,
            floor: Number(liveProp.floor) || 1,
            balconies: Number(liveProp.balconies) || 1,
            finishing: liveProp.finishing || 'super_lux',
            furnishing: liveProp.furnishing || 'unfurnished',
            audience_type: liveProp.audience_type || 'families',
            status: liveProp.status || 'available',
            featured: Boolean(liveProp.featured),
            views: Number(liveProp.views) || 0,
            images: Array.isArray(liveProp.images) && liveProp.images.length > 0
              ? (() => {
                  const sorted = [...liveProp.images].sort((a: any, b: any) => {
                    const aP = (typeof a === 'object' && (a?.is_primary || a?.isPrimary)) ? 1 : 0;
                    const bP = (typeof b === 'object' && (b?.is_primary || b?.isPrimary)) ? 1 : 0;
                    if (bP !== aP) return bP - aP;
                    return (a?.sort_order ?? 0) - (b?.sort_order ?? 0);
                  });
                  const urls = sorted.map((img: any) => typeof img === 'string' ? img : (img.image_url || img.url || img.image_path)).filter(Boolean);
                  return Array.from(new Set(urls));
                })()
              : (liveProp.image_url ? [liveProp.image_url] : [FALLBACK_PROPERTY_IMAGE]),
            video_url: liveProp.video_url || liveProp.video_file_path || liveProp.video || (Array.isArray(liveProp.videos) && liveProp.videos[0]?.url) || (typeof liveProp.videos === 'string' ? (() => { try { const p = JSON.parse(liveProp.videos); return p[0]?.url; } catch { return undefined; } })() : undefined),
            video_thumbnail_url: liveProp.video_thumbnail_url,
            videos: Array.isArray(liveProp.videos)
              ? liveProp.videos
              : (typeof liveProp.videos === 'string'
                ? (() => { try { return JSON.parse(liveProp.videos); } catch { return []; } })()
                : (liveProp.video_url ? [{ url: liveProp.video_url, title: 'فيديو الجولة الرئيسية', is_primary: true }] : [])),
            amenities: Array.isArray(liveProp.amenities)
              ? liveProp.amenities.map((a: any) => typeof a === 'string' ? a : a.slug || a.name || a.id)
              : [],
            tags: Array.isArray(liveProp.tags)
              ? liveProp.tags.map((t: any) => typeof t === 'string' ? t : t.name)
              : [],
            has_detailed_rooms: Boolean(liveProp.has_detailed_rooms),
            detailed_rooms: Array.isArray(liveProp.detailed_rooms || liveProp.detailedRooms)
              ? (() => {
                  const rawR = liveProp.detailed_rooms || liveProp.detailedRooms;
                  const seen = new Set<string>();
                  return rawR
                    .filter((r: any) => {
                      const key = String(r.id || r.name);
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    })
                    .map((r: any) => {
                      const media = Array.isArray(r.room_images) ? r.room_images : (r.media || []);
                      const roomImages = media.filter((item: any) => (item.media_type || 'image') === 'image');
                      const roomVideos = media.filter((item: any) => item.media_type === 'video');
                      return {
                        id: String(r.id),
                        property_id: String(liveProp.id),
                        name: r.name || '',
                        price: Number(r.price) || 0,
                        area: r.area == null ? undefined : Number(r.area),
                        description: r.description || '',
                        status: r.status || 'available',
                        media,
                        imageUrl: roomImages.find((item: any) => item.is_primary)?.image_url || roomImages[0]?.image_url || r.imageUrl,
                        images: roomImages.map((item: any) => item.image_url).filter(Boolean),
                        videos: roomVideos.map((item: any) => item.image_url).filter(Boolean),
                      };
                    });
                })()
              : [],
            created_at: liveProp.created_at || new Date().toISOString(),
          });
          setProperty(mapped);
          StorageService.saveProperty(mapped);
        }
      } catch (err) {
        console.warn('Live property fetch error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLiveProperty();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Lightbox keyboard listener
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') prevImage();
      if (e.key === 'ArrowLeft') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, property]);

  if (loading) {
    return <PropertyDetailSkeleton />;
  }

  if (!property) {
    return (
      <ModernStateFeedback
        type="not_found"
        title="عفواً، العقار المطلوب غير متوفر"
        description="قد يكون تم بيع أو تأجير هذا العقار مؤخراً، أو أن الرابط غير متاح حالياً. يمكنك تصفح العشرات من العقارات المتاحة الأخرى في دمياط الجديدة."
        actionText="تصفح جميع العقارات المتاحة"
        onAction={() => navigate('/properties')}
        secondaryActionText="العودة للرئيسية"
        onSecondaryAction={() => navigate('/')}
      />
    );
  }

  const isFavorite = favorites.includes(property.id);
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
    const settings = StorageService.getSettings();
    const phone = property.owner_phone || settings.phone || settings.company_phone || '01067725976';
    window.location.href = `tel:${phone}`;
  };

  const offerInfo = property ? evaluatePropertyOffer(property) : null;

  const handleWhatsApp = () => {
    const settings = StorageService.getSettings();
    const rawWhatsapp = settings.whatsapp || settings.company_whatsapp || property.owner_phone || '201067725976';
    const whatsappNum = String(rawWhatsapp).replace(/\D/g, '');
    const priceText = offerInfo?.isActive 
      ? `بسعر العرض الخاص ${formatPrice(offerInfo.offerPrice)} ج.م (بدلاً من ${formatPrice(offerInfo.originalPrice)} ج.م - وفر ${offerInfo.discountPercentage}%)`
      : `بسعر ${formatPrice(property.price)} ج.م`;
    const text = encodeURIComponent(
      `السلام عليكم، أود الاستفسار وحجز موعد معاينة للعقار كود (${property.ref_id}): "${property.title}" ${priceText} في ${property.district_name}. الرابط: ${window.location.href}`
    );
    window.open(`https://wa.me/${whatsappNum}?text=${text}`, '_blank');
  };

  // Calculator calculations
  const effectivePrice = offerInfo?.isActive ? offerInfo.offerPrice : property.price;
  const downPaymentAmount = (effectivePrice * downPaymentPercent) / 100;
  const remainingAmount = effectivePrice - downPaymentAmount;
  const totalMonths = loanYears * 12;
  const interestRate = 0.10;
  const totalWithInterest = remainingAmount * (1 + interestRate * loanYears);
  const monthlyInstallment = totalMonths > 0 ? Math.round(totalWithInterest / totalMonths) : 0;

  // Similar properties
  const similarProperties = allProperties
    .filter((p) => p.id !== property.id && (p.location_id === property.location_id || p.operation_type === property.operation_type))
    .slice(0, 3);

  const getStatusBadge = () => {
    if (property.status === 'sold') {
      return { text: 'تم البيع', bg: 'bg-rose-700 text-white' };
    }
    if (property.status === 'rented') {
      return { text: 'تم التأجير', bg: 'bg-purple-700 text-white' };
    }
    if (property.status === 'reserved') {
      return { text: 'محجوز حالياً', bg: 'bg-amber-600 text-white' };
    }
    return { text: 'متاح للحجز', bg: 'bg-emerald-600 text-white' };
  };

  const statusBadge = getStatusBadge();
  const isReservable = property.status === 'available';

  // Structured Data & Breadcrumb schemas for SEO
  const breadcrumbItems = [
    { name: 'الرئيسية', url: '/' },
    { name: property.operation_type === 'rent' ? 'شقق للإيجار' : 'عقارات للبيع', url: `/properties?operation=${property.operation_type}` },
    { name: property.district_name || 'دمياط الجديدة', url: `/places/${property.location_id}` },
    { name: property.title, url: generatePropertyCanonicalUrl(property) },
  ];

  const propertySchemas = [
    buildRealEstateListingSchema(property),
    buildBreadcrumbsSchema(breadcrumbItems),
    buildVideoSchema(property),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-28 sm:pb-16" dir="rtl">
      <SEOHead
        title={generatePropertyTitle(property)}
        description={generatePropertyDescription(property)}
        canonical={generatePropertyCanonicalUrl(property)}
        image={property.images?.[0] ? resolveImageUrl(property.images[0]) : undefined}
        type="article"
        schema={propertySchemas}
      />
      
      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-2 text-xs">
          <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-slate-500 overflow-x-auto">
            <Link to="/" className="hover:text-[#8D6A28] flex items-center gap-1 shrink-0 transition">
              <Home className="w-3.5 h-3.5" />
              <span>الرئيسية</span>
            </Link>
            <span>/</span>
            <Link to={`/properties?operation=${property.operation_type}`} className="hover:text-[#8D6A28] shrink-0 transition">
              {property.operation_type === 'rent' ? 'شقق للإيجار' : 'عقارات للبيع'}
            </Link>
            <span>/</span>
            <Link to={`/places/${property.location_id}`} className="hover:text-[#8D6A28] shrink-0 transition">
              {property.district_name || 'دمياط الجديدة'}
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate max-w-xs" aria-current="page">{property.title}</span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="مشاركة"
            >
              {copiedLink ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs font-bold">{copiedLink ? 'تم النسخ!' : 'مشاركة'}</span>
            </button>

            <button
              onClick={() => onToggleFavorite(property.id)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
              title="المفضلة"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline text-xs font-bold">{isFavorite ? 'محفوظ' : 'حفظ'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left / Main Column: Gallery & Details (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Image Gallery Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
              
              {/* Media Mode Switcher (Photos vs Video Walkthrough) */}
              {(property.video_url || (property.videos && property.videos.length > 0)) && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setMediaMode('photos')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
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
                    {mediaMode === 'video' ? 'جولة فيديو ميدانية عالية الدقة' : 'معرض الصور الفوتوغرافية'}
                  </span>
                </div>
              )}

              {/* Viewport: Either Video Player or Photo Carousel */}
              {mediaMode === 'video' && (property.video_url || (property.videos && property.videos.length > 0)) ? (
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-950 overflow-hidden">
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
                <div 
                  className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-900 overflow-hidden group cursor-pointer"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <img
                    src={resolveImageUrl(images[currentImageIndex])}
                    alt={generatePropertyAltText(property, undefined, currentImageIndex)}
                    width={1200}
                    height={675}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                    loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                    onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-[#0F172A] text-white text-xs font-black shadow">
                      {property.operation_type === 'sale' ? 'للبيع' : 'للإيجار'}
                    </span>
                    {property.audience_type && property.audience_type !== 'all' && (
                      <span className="px-3 py-1 rounded-xl bg-[#8D6A28] text-white text-xs font-black shadow">
                        {property.audience_type === 'female_students'
                          ? 'مناسب للطالبات'
                          : property.audience_type === 'young_men'
                          ? 'مناسب للشباب'
                          : 'مناسب للعائلات'}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-xl text-xs font-black shadow ${statusBadge.bg}`}>
                      {statusBadge.text}
                    </span>
                  </div>

                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    {property.featured && (
                      <span className="bg-[#8D6A28] text-white px-3 py-1 rounded-xl text-xs font-black shadow flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        مميز
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLightboxOpen(true);
                      }}
                      className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition"
                      title="عرض الشاشة الكاملة"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 hover:scale-110 active:scale-95 transition cursor-pointer z-10"
                        aria-label="الصورة السابقة"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 hover:scale-110 active:scale-95 transition cursor-pointer z-10"
                        aria-label="الصورة التالية"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter Badge & Quick Video Trigger */}
                  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow">
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
                        className="px-3 py-1 rounded-full bg-[#8D6A28] hover:bg-[#73541D] text-white text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs transition hover:scale-105 cursor-pointer"
                        title="تشغيل فيديو الجولة"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>شاهد الفيديو ({property.videos?.length || 1})</span>
                      </button>
                    )}
                  </div>

                  {/* Ref code on image */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <span className="font-mono text-xs font-bold text-white bg-black/60 backdrop-blur-xs px-3 py-1 rounded-lg">
                      كود: {property.ref_id}
                    </span>
                  </div>
                </div>
              )}

              {/* Thumbnails row (Photos + Video Thumbnails) */}
              {(images.length > 1 || Boolean(property.video_url || (property.videos && property.videos.length > 0))) && (
                <div className="flex gap-2 p-3 bg-slate-50 border-t border-slate-200/80 overflow-x-auto">
                  {/* Dedicated Video Thumbnail Buttons */}
                  {Array.isArray(property.videos) && property.videos.length > 0 ? (
                    property.videos.filter(v => Boolean(v && (v.url || (v as any).video_url))).map((vid, idx) => (
                      <button
                        key={`video-thumb-${idx}`}
                        type="button"
                        onClick={() => {
                          setMediaMode('video');
                          setAutoPlayVideo(true);
                        }}
                        className={`relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer group/vid ${
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
                      className={`relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer group/vid ${
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
                      className={`relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
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
            </div>

            {/* 2. Key Details & Title Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#8D6A28] bg-[#8D6A28]/10 px-3 py-1 rounded-lg">
                    رقم الكود: {property.ref_id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    تم النشر: {new Date(property.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono mr-auto">
                    {property.views} مشاهدة
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                  {property.title}
                </h1>

                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-[#8D6A28] shrink-0" />
                  <span>{property.district_name}</span>
                  {property.address_detail && (
                    <span className="text-slate-400">({property.address_detail})</span>
                  )}
                </div>
              </div>

              {/* Special Offer Hero Banner if Active */}
              {offerInfo?.isActive && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white shadow-xl space-y-4 relative overflow-hidden animate-fade-in border border-amber-300/30">
                  <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between gap-3 flex-wrap relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-black flex items-center gap-1.5 border border-white/30 shadow-xs">
                        <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
                        {offerInfo.badgeText}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-amber-100">
                        {property.offer_title || 'عرض خاص وتخفيض لفترة محدودة'}
                      </span>
                    </div>
                    {offerInfo.remainingText && (
                      <span className="text-xs font-black bg-black/30 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 flex items-center gap-1.5 text-white">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span>{offerInfo.remainingText}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-4 flex-wrap pt-3 border-t border-white/20 relative z-10">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-100 font-bold">السعر الأصلي:</span>
                        <span className="line-through text-sm sm:text-base font-bold text-white/70 font-mono">
                          {formatPrice(offerInfo.originalPrice)} ج.م
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-white">سعر العرض:</span>
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                          {formatPrice(offerInfo.offerPrice)}
                        </span>
                        <span className="text-sm font-black text-amber-200">ج.م</span>
                        {property.operation_type === 'rent' && (
                          <span className="text-xs font-bold text-amber-100">/ شهرياً</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right bg-white/15 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/25">
                      <span className="text-xs text-amber-100 block font-bold">إجمالي التوفير:</span>
                      <span className="text-xl font-black text-amber-300 font-mono">
                        {formatPrice(offerInfo.savingsAmount)} ج.م
                      </span>
                      <span className="text-xs text-white/90 block font-black">
                        (خصم {offerInfo.discountPercentage}%)
                      </span>
                    </div>
                  </div>

                  {offerInfo.endDateFormatted && (
                    <div className="text-xs text-amber-100/95 flex items-center gap-1.5 pt-1 relative z-10 font-bold">
                      <CalendarCheck className="w-4 h-4 text-amber-300" />
                      <span>فترة العرض سارية حتى: {offerInfo.endDateFormatted}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Price Banner */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  {offerInfo?.isActive ? (
                    <div className="flex flex-col">
                      <span className="line-through text-sm font-bold text-slate-400 font-mono">
                        {formatPrice(offerInfo.originalPrice)} ج.م
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-rose-600 font-mono">
                          {formatPrice(offerInfo.offerPrice)}
                        </span>
                        <span className="text-base sm:text-lg font-black text-rose-600">
                          ج.م
                        </span>
                        {property.operation_type === 'rent' && (
                          <span className="text-xs sm:text-sm text-slate-500 font-bold">/ شهرياً</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl font-black text-[#0F172A]">
                        {formatPrice(property.price)}
                      </span>
                      <span className="text-base sm:text-lg font-black text-[#8D6A28]">
                        ج.م
                      </span>
                      {property.operation_type === 'rent' && (
                        <span className="text-xs sm:text-sm text-slate-500 font-bold">/ شهرياً</span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {property.is_negotiable && !offerInfo?.isActive && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                      السعر قابل للتفاوض
                    </span>
                  )}
                  {property.operation_type === 'sale' && (
                    <button
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="text-xs font-bold text-[#8D6A28] bg-[#8D6A28]/10 hover:bg-[#8D6A28]/20 px-3.5 py-2 rounded-xl border border-[#8D6A28]/30 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>{showCalculator ? 'إخفاء الحاسبة' : 'حاسبة الأقساط'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Mortgage / Installment Calculator */}
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
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
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

              {/* Key Specs Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3">المواصفات الرئيسية</h3>
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

              {/* Additional Specs Grid */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-500">تفاصيل الوحدة والتشطيب</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">نوع العقار</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">
                      {property.property_type === 'apartment' ? 'شقة سكنية' : property.property_type === 'villa' ? 'فيلا مستقلة' : property.property_type === 'duplex' ? 'دوبلكس' : property.property_type === 'shop' ? 'محل تجاري' : property.property_type === 'office' ? 'مكتب إداري' : 'أرض / أخرى'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">نوع التشطيب</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">
                      {property.finishing === 'super_lux' ? 'سوبر لوكس' : property.finishing === 'lux' ? 'لوكس' : property.finishing === 'semi_finished' ? 'نصف تشطيب' : 'طوب أحمر'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">الفرش والأجهزة</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">
                      {property.furnishing === 'furnished' ? 'مفروش بالكامل' : 'غير مفروش'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">عدد البلكونات</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{property.balconies || 1}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">حالة التسليم</span>
                    <span className="font-extrabold text-emerald-700 mt-0.5 block">جاهزة للتسليم الفوري</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">توثيق العقار</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">عقد مسجل / مرخص</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8D6A28]" />
                  <span>الوصف الشامل للعقار</span>
                </h3>
                <p className={`text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line ${
                  isDescExpanded ? '' : 'line-clamp-4'
                }`}>
                  {property.description}
                </p>
                {property.description.length > 140 && (
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-xs font-bold text-[#8D6A28] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isDescExpanded ? 'عرض أقل ↑' : 'قراءة الوصف كاملاً ↓'}
                  </button>
                )}
              </div>

              {/* Detailed Rooms (If applicable) */}
              {property.has_detailed_rooms && property.detailed_rooms && property.detailed_rooms.length > 0 && (
                <div id="rooms-section" className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-[#8D6A28]/10 text-[#8D6A28] flex items-center justify-center shrink-0">
                        <DoorOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          الغرف المتاحة للحجز والتأجير المستقل
                        </h3>
                        <p className="text-xs text-slate-500">
                          يمكنك اختيار غرفة منفردة لحجزها ومعاينتها مباشرة
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#8D6A28] text-xs font-bold font-mono">
                      {property.detailed_rooms.filter(r => r.status === 'available').length} من {property.detailed_rooms.length} غرف متاحة
                    </span>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    {property.detailed_rooms.map((room) => {
                      const roomImg = room.imageUrl || room.images?.[0] || (room as any).image_url || (property.images && property.images.length > 0 ? property.images[0] : FALLBACK_PROPERTY_IMAGE);
                      const isAvail = room.status === 'available';
                      const isReserved = room.status === 'reserved';
                      const isRented = room.status === 'rented';

                      return (
                        <div 
                          key={room.id}
                          className={`p-4 rounded-3xl border transition-all space-y-3 bg-white shadow-xs ${
                            isAvail 
                              ? 'border-slate-200 hover:border-[#8D6A28] hover:shadow-md' 
                              : 'border-slate-100 bg-slate-50/70 opacity-90'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              onClick={() => setPreviewRoomImage(roomImg || FALLBACK_PROPERTY_IMAGE)}
                              className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group"
                            >
                              <img 
                                src={roomImg || FALLBACK_PROPERTY_IMAGE} 
                                alt={room.name || 'غرفة متاحة'}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-extrabold text-sm text-slate-900 truncate">{room.name}</h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                  isAvail 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : isReserved
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {isAvail ? 'متاح للحجز' : isReserved ? 'محجوزة' : 'تم التأجير'}
                                </span>
                              </div>

                              {room.area && (
                                <p className="text-[11px] text-slate-500 font-medium">المساحة: {room.area} م²</p>
                              )}

                              <p className="text-sm font-black text-[#8D6A28] font-mono">
                                {formatPrice(room.price)} ج.م <span className="text-[10px] font-normal text-slate-500">/ شهر</span>
                              </p>
                            </div>
                          </div>

                          {room.description && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed">
                              {room.description}
                            </p>
                          )}

                          {room.videos?.[0] && (
                            <video
                              src={room.videos[0]}
                              poster={roomImg || FALLBACK_PROPERTY_IMAGE}
                              controls
                              preload="metadata"
                              className="w-full max-h-56 rounded-2xl bg-black border border-slate-200"
                            />
                          )}

                          <div className="pt-1">
                            {clientReservedRoomIds.includes(String(room.id)) ? (
                              <div className="space-y-1.5">
                                <button
                                  disabled
                                  className="w-full py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black flex items-center justify-center gap-1.5 cursor-not-allowed shadow-2xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                                  <span>تم إرسال طلب الحجز</span>
                                </button>
                                <button
                                  onClick={() => {
                                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                                    navigate('/my-reservations');
                                  }}
                                  className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <CalendarCheck className="w-3 h-3 text-[#8D6A28]" />
                                  <span>متابعة الحجز</span>
                                  <ArrowRight className="w-3 h-3 rotate-180 text-slate-400" />
                                </button>
                              </div>
                            ) : isAvail ? (
                              <button
                                onClick={() => onOpenInquiry(property, room)}
                                className="w-full py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CalendarCheck className="w-3.5 h-3.5" />
                                <span>احجز الغرفة</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>{isReserved ? 'محجوزة' : 'تم التأجير'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-900">المميزات والمرافق</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map((rawAmenity, idx) => {
                      const display = getAmenityDisplay(rawAmenity);

                      return (
                        <div 
                          key={display.id || idx}
                          className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-slate-100 transition-colors text-xs sm:text-sm font-bold text-slate-800"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[#8D6A28]/10 flex items-center justify-center shrink-0">
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
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h3 className="text-xs font-bold text-slate-500">الكلمات الدلالية</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.tags.map((tag: any, i) => {
                      const tagLabel = typeof tag === 'string' ? tag : (tag?.name || String(tag || ''));
                      if (!tagLabel) return null;
                      return (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold"
                        >
                          #{tagLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Right Column: Sticky Reservation & Contact Box (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 space-y-5 relative lg:sticky lg:top-24">
              
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    {property.has_detailed_rooms && property.detailed_rooms && property.detailed_rooms.length > 0
                      ? 'أسعار إيجار الغرف'
                      : offerInfo?.isActive 
                      ? 'سعر العرض المخفض' 
                      : 'السعر الإجمالي المطلوب'}
                  </span>
                  {offerInfo?.isActive && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                      {offerInfo.badgeText}
                    </span>
                  )}
                </div>
                
                {offerInfo?.isActive && !property.has_detailed_rooms ? (
                  <div className="mt-1">
                    <span className="line-through text-xs font-bold text-slate-400 font-mono">
                      {formatPrice(offerInfo.originalPrice)} ج.م
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-rose-600 font-mono">
                        {formatPrice(offerInfo.offerPrice)}
                      </span>
                      <span className="text-base font-black text-rose-600">ج.م</span>
                      {property.operation_type === 'rent' && (
                        <span className="text-xs text-slate-500 font-bold">/ شهر</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-[#0F172A]">
                      {property.has_detailed_rooms && property.detailed_rooms && property.detailed_rooms.length > 0
                        ? `يبدأ من ${formatPrice(Math.min(...property.detailed_rooms.map(r => r.price).filter(p => p > 0)))}`
                        : formatPrice(property.price)}
                    </span>
                    <span className="text-base font-black text-[#8D6A28]">ج.م</span>
                    {property.operation_type === 'rent' && (
                      <span className="text-xs text-slate-500 font-bold">/ شهر</span>
                    )}
                  </div>
                )}
              </div>

              {/* Status Notice */}
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                property.status === 'available' 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                  : property.status === 'reserved'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {property.status === 'available' ? (
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>
                  {property.has_detailed_rooms && property.detailed_rooms && property.detailed_rooms.length > 0
                    ? `تأجير بنظام الغرف المستقلة (${property.detailed_rooms.filter(r => r.status === 'available').length} من ${property.detailed_rooms.length} غرف متاحة)`
                    : property.status === 'available' 
                    ? 'العقار متاح حالياً للمعاينة والحجز الفوري'
                    : property.status === 'reserved'
                    ? 'هذا العقار محجوز حالياً وبانتظار إنهاء المعاينة'
                    : property.status === 'sold'
                    ? 'تم بيع هذا العقار ولم يعد متاحاً'
                    : 'تم تأجير هذا العقار ولم يعد متاحاً'}
                </span>
              </div>

              {/* Main Booking Button */}
              {hasClientReservedProperty ? (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-not-allowed shadow-xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    <span>تم إرسال طلب الحجز بنجاح</span>
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                      navigate('/my-reservations');
                    }}
                    className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4 text-[#8D6A28]" />
                    <span>متابعة حالة الحجز في حجوزاتي</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              ) : property.has_detailed_rooms && property.detailed_rooms && property.detailed_rooms.length > 0 ? (
                <button
                  onClick={() => {
                    const el = document.getElementById('rooms-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="w-full py-4 rounded-2xl text-white gold-gradient gold-gradient-hover font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-98 transition cursor-pointer"
                >
                  <DoorOpen className="w-5 h-5" />
                  <span>استعراض وحجز الغرف المتاحة</span>
                </button>
              ) : isReservable ? (
                <button
                  onClick={() => onOpenInquiry(property)}
                  className="w-full py-4 rounded-2xl text-white gold-gradient gold-gradient-hover font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-98 transition cursor-pointer"
                >
                  <CalendarCheck className="w-5 h-5" />
                  <span>طلب معاينة / حجز العقار</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-slate-200 text-slate-500 font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Lock className="w-5 h-5" />
                  <span>{statusBadge.text} (غير متاح للحجز)</span>
                </button>
              )}

              {/* Quick Communication Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleWhatsApp}
                  className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>واتساب مباشر</span>
                </button>

                <button
                  onClick={handleCall}
                  className="py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#8D6A28]" />
                  <span>اتصال هاتفي</span>
                </button>
              </div>

              {/* Trust badges */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>معاينة حقيقية موثقة ومعتمدة من فريق سكني</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{StorageService.getSettings().commission_text || `عمولة وساطة ${StorageService.getSettings().commission_percentage !== undefined ? StorageService.getSettings().commission_percentage : 2.5}% تدفع عند التعاقد فقط، والمعاينة مجانية`}</span>
                </div>
              </div>

            </div>

            {/* Related Properties Column */}
            {similarProperties.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-black text-slate-900">عقارات مشابهة قد تناسبك</h3>
                <div className="space-y-3">
                  {similarProperties.map((simProp) => (
                    <Link
                      key={simProp.id}
                      to={`/properties/${simProp.id}`}
                      className="flex gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition border border-slate-100 group"
                    >
                      <img
                        src={resolveImageUrl(simProp.images[0])}
                        alt={simProp.title}
                        className="w-20 h-16 rounded-xl object-cover shrink-0"
                        onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                      />
                      <div className="min-w-0 flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#8D6A28] transition">
                          {simProp.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">{simProp.district_name}</p>
                        <p className="text-xs font-black text-[#8D6A28]">
                          {formatPrice(simProp.price)} ج.م
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-fade-in"
          dir="rtl"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Top Bar */}
          <div className="flex items-center justify-between text-white z-10 px-2 py-1">
            <span className="text-xs font-bold font-mono bg-white/10 px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </span>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Image Container */}
          <div 
            className="relative flex-1 flex items-center justify-center max-h-[85vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={resolveImageUrl(images[currentImageIndex])}
              alt={property.title}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          <div 
            className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 max-w-2xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                  idx === currentImageIndex ? 'border-[#D6A94E] scale-105' : 'border-transparent opacity-50 hover:opacity-100'
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
        </div>
      )}

      {/* Room Image Preview Lightbox */}
      {previewRoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewRoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewRoomImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer z-10"
              title="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={resolveImageUrl(previewRoomImage)} 
              alt="معاينة الغرفة" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-3xl"
              onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
