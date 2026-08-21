import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Property, PropertyReservation } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { evaluatePropertyOffer, formatArabicDate } from '../../utils/offerUtils';
import { AdminRoomManagementModal } from '../../components/AdminRoomManagementModal';
import { AdminOfferModal } from '../../components/AdminOfferModal';
import { AdminMediaManagementModal } from '../../components/AdminMediaManagementModal';
import { PropertyMultiVideoPlayer } from '../../components/PropertyMultiVideoPlayer';
import { PropertyLocationMap } from '../../components/PropertyLocationMap';
import { AdminPropertyDetailSkeleton, ModernStateFeedback } from '../../components/Skeletons';
import { FALLBACK_PROPERTY_IMAGE, resolveImageUrl, getVideoThumbnailUrl } from '../../utils/media';
import { getAmenityDisplay } from '../../utils/amenities';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Eye, 
  Pencil, 
  Flame, 
  DoorOpen, 
  ExternalLink, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Maximize2, 
  BedDouble, 
  Bath, 
  Users, 
  Phone, 
  MessageCircle, 
  Layers, 
  Star, 
  FileText, 
  Compass, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Play,
  Share2,
  QrCode,
  Copy,
  Check,
  Download,
  Printer,
  Navigation,
  User,
  Tag,
  Video,
  Globe,
  Info,
  CalendarDays,
  X,
  CloudUpload,
  Loader2,
  Image as ImageIcon,
  Plus
} from 'lucide-react';

export const AdminPropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [reservations, setReservations] = useState<PropertyReservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState<boolean>(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);

  // QR Code and Sharing States
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadPropertyData(id);
    }
  }, [id]);

  const loadPropertyData = async (propId: string) => {
    setIsLoading(true);
    // 1. Fallback from LocalStorage
    const localProp = StorageService.getPropertyById(propId);
    if (localProp) {
      setProperty(localProp);
    }

    // 2. Fetch from Backend API if valid database ID
    const isBackendId = !propId.startsWith('prop-') && (!isNaN(Number(propId)) ? Number(propId) < 100000000 : true);
    if (isBackendId) {
      try {
        const apiProp = await ApiService.getProperty(propId);
        if (apiProp) {
          const rawImgs: string[] = Array.isArray(apiProp.images) && apiProp.images.length > 0
            ? (() => {
                const sorted = [...apiProp.images].sort((a: any, b: any) => {
                  const aP = (typeof a === 'object' && (a?.is_primary || a?.isPrimary)) ? 1 : 0;
                  const bP = (typeof b === 'object' && (b?.is_primary || b?.isPrimary)) ? 1 : 0;
                  if (bP !== aP) return bP - aP;
                  return (a?.sort_order ?? 0) - (b?.sort_order ?? 0);
                });
                return sorted.map((img: any) => typeof img === 'string' ? img : (img.image_url || img.url || img.image_path)).filter(Boolean);
              })()
            : (apiProp.image_url ? [apiProp.image_url] : []);
          const uniqueImages = Array.from(new Set(rawImgs));

          const rawRooms = apiProp.detailed_rooms || apiProp.detailedRooms || [];
          const seenRoomKeys = new Set<string>();
          const uniqueRooms = rawRooms.filter((r: any) => {
            const key = String(r.id || r.name);
            if (seenRoomKeys.has(key)) return false;
            seenRoomKeys.add(key);
            return true;
          });

          const mapped: Property = {
            id: String(apiProp.id),
            ref_id: apiProp.ref_id || `SK-${apiProp.id}`,
            title: apiProp.title,
            description: apiProp.description || '',
            price: Number(apiProp.price) || 0,
            is_negotiable: Boolean(apiProp.is_negotiable),
            has_offer: Boolean(apiProp.has_offer),
            offer_price: apiProp.offer_price ? Number(apiProp.offer_price) : undefined,
            offer_discount_percentage: apiProp.offer_discount_percentage ? Number(apiProp.offer_discount_percentage) : undefined,
            offer_start_date: apiProp.offer_start_date || undefined,
            offer_end_date: apiProp.offer_end_date || undefined,
            offer_title: apiProp.offer_title || undefined,
            offer_badge: apiProp.offer_badge || undefined,
            rent_duration: apiProp.rent_duration || 'monthly',
            operation_type: apiProp.category?.slug === 'rent' || apiProp.operation_type === 'rent' ? 'rent' : 'sale',
            property_type: apiProp.property_type?.slug || apiProp.property_type || 'apartment',
            location_id: String(apiProp.location_id || apiProp.location?.id || ''),
            district_name: apiProp.location?.name || apiProp.district_name || 'دمياط الجديدة',
            address_detail: apiProp.address_detail || apiProp.address || '',
            owner_name: apiProp.owner_name || apiProp.contact_name || '',
            owner_phone: apiProp.owner_phone || apiProp.contact_phone || apiProp.phone || '',
            area: Number(apiProp.area) || 0,
            rooms: Number(apiProp.rooms) || 0,
            bathrooms: Number(apiProp.bathrooms) || 0,
            floor: Number(apiProp.floor) || 0,
            balconies: Number(apiProp.balconies) || 0,
            finishing: apiProp.finishing || 'super_lux',
            furnishing: apiProp.furnishing || 'unfurnished',
            audience_type: apiProp.audience_type || 'families',
            images: uniqueImages,
            video_url: apiProp.video_url || apiProp.video_file_path || apiProp.video || (Array.isArray(apiProp.videos) && apiProp.videos[0]?.url) || '',
            video_thumbnail_url: apiProp.video_thumbnail_url || '',
            videos: Array.isArray(apiProp.videos)
              ? apiProp.videos
              : (typeof apiProp.videos === 'string'
                ? (() => { try { return JSON.parse(apiProp.videos); } catch { return []; } })()
                : (apiProp.video_url ? [{ url: apiProp.video_url, title: 'فيديو الجولة الرئيسية', is_primary: true }] : [])),
            status: apiProp.status || 'available',
            featured: Boolean(apiProp.featured),
            is_uploading: Boolean(apiProp.is_uploading),
            views: apiProp.views || apiProp.cached_views || 0,
            amenities: Array.isArray(apiProp.amenities) ? apiProp.amenities.map((a: any) => typeof a === 'string' ? a : (a.slug || a.name || a.title)) : [],
            tags: Array.isArray(apiProp.tags) ? apiProp.tags.map((t: any) => typeof t === 'string' ? t : (t.name || t.tag)) : [],
            has_detailed_rooms: Boolean(apiProp.has_detailed_rooms),
            detailed_rooms: uniqueRooms,
            latitude: apiProp.latitude ? Number(apiProp.latitude) : undefined,
            longitude: apiProp.longitude ? Number(apiProp.longitude) : undefined,
            created_at: apiProp.created_at || new Date().toISOString(),
          };
          setProperty(mapped);
        }
      } catch (err) {
        // Fallback silently to local storage
      }
    }

    // 3. Load associated reservations & inquiries
    try {
      const allReservations = StorageService.getReservations();
      const related = allReservations.filter((r) => String(r.property_id) === String(propId));
      setReservations(related);
    } catch {}

    setIsLoading(false);
  };

  // Generate QR Code URL on load or change
  useEffect(() => {
    if (property?.id) {
      const publicUrl = `${window.location.origin}/#/properties/${property.id}`;
      QRCode.toDataURL(publicUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR:', err));
    }
  }, [property?.id]);

  const handleUpdateStatus = async (newStatus: Property['status']) => {
    if (!property) return;
    try {
      await ApiService.updateProperty(property.id, { status: newStatus });
      StorageService.updateProperty(property.id, { status: newStatus });
      setProperty({ ...property, status: newStatus });
    } catch (err) {
      alert('حدث خطأ أثناء تحديث حالة العقار');
    }
  };

  const handleToggleFeatured = async () => {
    if (!property) return;
    const nextFeatured = !property.featured;
    try {
      await ApiService.updateProperty(property.id, { featured: nextFeatured });
      StorageService.updateProperty(property.id, { featured: nextFeatured });
      setProperty({ ...property, featured: nextFeatured });
    } catch (err) {
      alert('حدث خطأ أثناء تعديل تمييز العقار');
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    if (window.confirm(`هل أنت متأكد من حذف العقار "${property.title}" (كود: ${property.ref_id}) نهائياً؟`)) {
      try {
        await ApiService.deleteProperty(property.id);
        StorageService.deleteProperty(property.id);
        navigate('/admin/properties');
      } catch (err) {
        alert('حدث خطأ أثناء حذف العقار');
      }
    }
  };

  const getPublicUrl = () => {
    if (!property) return '';
    return `${window.location.origin}/#/properties/${property.id}`;
  };

  const handleCopyPublicLink = async () => {
    const url = getPublicUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      prompt('انسخ رابط العقار:', url);
    }
  };

  const handleCopyRefCode = async () => {
    if (!property) return;
    try {
      await navigator.clipboard.writeText(property.ref_id || `SK-${property.id}`);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    } catch {}
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !property) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${property.ref_id || property.id}.png`;
    a.click();
  };

  const handlePrintQr = () => {
    if (!qrDataUrl || !property) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>رمز QR - عقار ${property.ref_id}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; }
            .card { border: 2px solid #8D6A28; border-radius: 24px; padding: 32px; max-width: 420px; margin: 0 auto; }
            h2 { color: #0F172A; margin-bottom: 8px; font-size: 20px; }
            p { color: #475569; margin: 4px 0; font-size: 14px; }
            .price { font-size: 22px; font-weight: bold; color: #8D6A28; margin: 12px 0; }
            img { width: 260px; height: 260px; margin: 16px 0; }
            .footer { font-size: 12px; color: #94a3b8; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>منصة سكني — دمياط الجديدة</h2>
            <p><strong>${property.title}</strong></p>
            <p>كود العقار: <strong>${property.ref_id}</strong> | ${property.district_name}</p>
            <div class="price">${property.price.toLocaleString()} ج.م</div>
            <img src="${qrDataUrl}" alt="QR Code" />
            <p>امسح الكود بكاميرا الموبايل لمعاينة كافة التفاصيل والصور فوراً</p>
            <div class="footer">www.sakani.com • هاتف: 01067725976</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWhatsAppShare = () => {
    if (!property) return;
    const url = getPublicUrl();
    const text = `عقار في سكني: ${property.title}
كود العقار: ${property.ref_id}
العملية: ${property.operation_type === 'rent' ? 'إيجار' : 'بيع'}
السعر: ${property.price.toLocaleString()} ج.م
المنطقة: ${property.district_name}
رابط المعاينة: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTelegramShare = () => {
    if (!property) return;
    const url = getPublicUrl();
    const text = `عقار في سكني: ${property.title} (كود: ${property.ref_id}) بسعر ${property.price.toLocaleString()} ج.م في ${property.district_name}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = getPublicUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (!property) return;
    const url = getPublicUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `عقار في سكني: ${property.title} (كود: ${property.ref_id})`,
          url: url,
        });
      } catch {}
    } else {
      handleCopyPublicLink();
    }
  };

  if (isLoading && !property) {
    return <AdminPropertyDetailSkeleton />;
  }

  if (!property) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs">
        <ModernStateFeedback
          type="not_found"
          title="لم يتم العثور على العقار في النظام"
          description="العقار المطلوب غير متوفر حالياً، ربما تم حذفه من قاعدة البيانات أو أن الكود المرجعي غير صحيح."
          actionText="العودة لجدول العقارات"
          onAction={() => navigate('/admin/properties')}
          secondaryActionText="لوحة التحكم الرئيسية"
          onSecondaryAction={() => navigate('/admin')}
        />
      </div>
    );
  }

  const offer = evaluatePropertyOffer(property);
  const rawImgs = property.images && property.images.length > 0 
    ? property.images 
    : [FALLBACK_PROPERTY_IMAGE];
  const images = Array.from(new Set(rawImgs.filter(Boolean)));

  // Unified Media Items (Videos + Photos combined seamlessly)
  const mediaItems = useMemo(() => {
    const list: Array<{
      type: 'video' | 'image';
      url: string;
      thumbnail: string;
      title: string;
      videoIndex?: number;
    }> = [];

    // 1. Collect all Videos
    const videosList: any[] = [];
    if (Array.isArray(property?.videos) && property.videos.length > 0) {
      videosList.push(...property.videos.filter((v: any) => Boolean(v && (v.url || v.video_url))));
    }
    if (property?.video_url && !videosList.some((v: any) => (v.url || v.video_url) === property.video_url)) {
      videosList.unshift({
        url: property.video_url,
        title: 'فيديو المعاينة والجولة الرئيسية',
        thumbnail_url: property.video_thumbnail_url,
        is_primary: true,
      });
    }

    const firstImage = property?.images?.[0] || FALLBACK_PROPERTY_IMAGE;

    videosList.forEach((v: any, idx: number) => {
      const vUrl = v.url || v.video_url;
      const vThumb = getVideoThumbnailUrl(vUrl, v.thumbnail_url || property?.video_thumbnail_url, firstImage);
      list.push({
        type: 'video',
        url: vUrl,
        thumbnail: vThumb || firstImage,
        title: v.title || `فيديو جولة ${idx + 1}`,
        videoIndex: idx,
      });
    });

    // 2. Collect all Photos
    const photosList = property?.images && property.images.length > 0 
      ? property.images 
      : (list.length === 0 ? [FALLBACK_PROPERTY_IMAGE] : []);
    const uniquePhotos = Array.from(new Set(photosList.filter(Boolean)));

    uniquePhotos.forEach((img: string, idx: number) => {
      list.push({
        type: 'image',
        url: img,
        thumbnail: img,
        title: `صورة ${idx + 1}`,
      });
    });

    return list.length > 0 ? list : [{
      type: 'image' as const,
      url: FALLBACK_PROPERTY_IMAGE,
      thumbnail: FALLBACK_PROPERTY_IMAGE,
      title: 'صورة العقار',
    }];
  }, [property?.images, property?.video_url, property?.video_thumbnail_url, property?.videos]);

  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0] || {
    type: 'image' as const,
    url: FALLBACK_PROPERTY_IMAGE,
    thumbnail: FALLBACK_PROPERTY_IMAGE,
    title: 'صورة العقار',
  };

  const effectivePrice = offer.isActive 
    ? (Number(offer.effectivePrice) || Number(offer.offerPrice) || Number(property.price) || 0)
    : (Number(property.price) || 0);

  const settings = StorageService.getSettings();
  const commissionPercentage = typeof settings.commission_percentage === 'number' 
    ? settings.commission_percentage 
    : (parseFloat(String(settings.commission_percentage || settings.commission_rate || '2.5')) || 2.5);

  const estimatedCommission = Math.round(effectivePrice * (commissionPercentage / 100)) || 0;

  return (
    <div className="space-y-6 pb-16 animate-fade-in font-['Cairo']" dir="rtl">
      
      {/* Upload In-Progress Banner */}
      {property.is_uploading && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <CloudUpload className="w-5 h-5 text-amber-700 animate-bounce shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold">جاري رفع ومعالجة وسائط العقار (الصور والفيديوهات) في الخلفية...</h4>
              <p className="text-[11px] text-amber-700">يتم معالجة الملفات تلقائياً وسيظهر العقار بكامل جودته بعد انتهاء الرفع</p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              StorageService.markPropertyUploadComplete(property.id);
              const numId = parseInt(property.id.replace(/\D/g, ''), 10);
              if (numId) {
                try {
                  await ApiService.markPropertyUploadComplete(numId);
                } catch {}
              }
              setProperty({ ...property, is_uploading: false });
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>اعتماد واكتمال الرفع الآن</span>
          </button>
        </div>
      )}

      {/* Top Breadcrumbs and Action Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/properties')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="الرجوع لقائمة العقارات"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyRefCode}
                className="px-2.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-[#8D6A28] border border-amber-200/80 font-mono text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="اضغط لنسخ كود العقار"
              >
                <span>{property.ref_id || `SK-${property.id}`}</span>
                {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                property.operation_type === 'rent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {property.operation_type === 'rent' ? 'إيجار' : 'بيع'}
              </span>
              {property.featured && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[#8D6A28] border border-amber-200/60 text-[11px] font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#8D6A28]" />
                  مميز
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 line-clamp-1">
              {property.title}
            </h1>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Quick Status Select */}
          <select
            value={property.status}
            onChange={(e) => handleUpdateStatus(e.target.value as Property['status'])}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#8D6A28] cursor-pointer shadow-2xs"
          >
            <option value="available">🟢 متاح للجمهور</option>
            <option value="reserved">🟡 محجوز حالياً</option>
            <option value="sold">🔴 تم البيع</option>
            <option value="rented">🔴 تم التأجير</option>
          </select>

          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="مشاركة العقار مع العملاء أو الشبكات"
          >
            <Share2 className="w-4 h-4 text-[#8D6A28]" />
            <span>مشاركة</span>
          </button>

          {/* QR Code Button */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="عرض وتحميل رمز الاستجابة السريعة QR"
          >
            <QrCode className="w-4 h-4 text-[#8D6A28]" />
            <span>رمز QR</span>
          </button>

          {/* Fast Media Manager Button */}
          <button
            onClick={() => setIsMediaModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs bg-amber-50 hover:bg-amber-100 text-[#8D6A28] border border-amber-200/80 hover:border-amber-300"
            title="تعديل سريع للصور والفيديو، إضافة صور جديدة، وتحديد الصورة الرئيسية"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8D6A28]" />
            <span>تعديل الوسائط ({images.length})</span>
          </button>

          {/* Edit Button */}
          <button
            onClick={() => navigate(`/admin/properties/edit/${property.id}`)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#8D6A28] text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>تعديل العقار</span>
          </button>

          {/* Offer Management Button */}
          <button
            onClick={() => setIsOfferModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs bg-amber-50 hover:bg-amber-100 text-[#8D6A28] border border-amber-200/60"
          >
            <Flame className="w-3.5 h-3.5 text-[#8D6A28]" />
            <span>{offer.isActive ? 'تعديل العرض' : 'إضافة عرض'}</span>
          </button>

          {/* Room Management Button (Rent only) */}
          {property.operation_type === 'rent' && (
            <button
              onClick={() => setIsRoomsModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                property.has_detailed_rooms
                  ? 'bg-amber-50 hover:bg-amber-100 text-[#8D6A28] border border-amber-200/60'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>إدارة الغرف ({property.detailed_rooms?.length || 0})</span>
            </button>
          )}

          {/* Public Preview Button */}
          <button
            onClick={() => window.open(`/#/properties/${property.id}`, '_blank')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="معاينة صفحة العقار في الموقع"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Featured Toggle */}
          <button
            onClick={handleToggleFeatured}
            className={`p-2 rounded-xl transition cursor-pointer ${
              property.featured ? 'bg-amber-50 text-[#8D6A28] border border-amber-200/60' : 'bg-slate-100 text-slate-400 hover:text-[#8D6A28]'
            }`}
            title={property.featured ? 'إلغاء التمييز' : 'تمييز العقار في الصفحة الرئيسية'}
          >
            <Star className={`w-4 h-4 ${property.featured ? 'text-[#8D6A28]' : ''}`} />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer"
            title="حذف العقار"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols on desktop): Photos, Specs, Description, Amenities, Video, Rooms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Offer Banner if configured */}
          {offer.isActive && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl sm:rounded-3xl p-5 shadow-2xs flex items-center justify-between flex-wrap gap-3 text-slate-900">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white text-[#8D6A28] text-xs font-semibold border border-amber-200">
                  <Flame className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>{offer.badgeText || 'عرض نشط وساري'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{property.offer_title || 'عرض خاص وتخفيض لفترة محدودة'}</h3>
                <p className="text-xs text-slate-600 font-normal">
                  وفر {offer.savingsAmount.toLocaleString()} ج.م ({offer.discountPercentage}%) • ينتهي خلال {offer.remainingDays} أيام ({formatArabicDate(property.offer_end_date)})
                </p>
              </div>
              <div className="text-left bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                <p className="text-xs text-slate-400 line-through font-mono">{(property.price || 0).toLocaleString()} ج.م</p>
                <p className="text-lg font-bold text-[#8D6A28] font-mono">{effectivePrice.toLocaleString()} ج.م</p>
              </div>
            </div>
          )}

          {/* Unified Media Carousel & Gallery (Photos + Videos) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <ImageIcon className="w-4 h-4 text-[#8D6A28]" />
                <h3 className="text-sm font-bold text-slate-900">
                  معرض وسائط العقار ({mediaItems.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  ({mediaItems.filter(m => m.type === 'image').length} صور
                  {mediaItems.filter(m => m.type === 'video').length > 0 ? ` • ${mediaItems.filter(m => m.type === 'video').length} فيديو` : ''})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8D6A28] border border-amber-200/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="تعديل سريع للصور والفيديوهات"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>إدارة وتعديل الصور والفيديو</span>
              </button>
            </div>

            {/* Main Media Viewport */}
            <div className="relative h-72 sm:h-96 md:h-[420px] rounded-2xl overflow-hidden bg-slate-950">
              {activeMedia.type === 'video' ? (
                <div className="w-full h-full">
                  <PropertyMultiVideoPlayer
                    videos={property.videos}
                    videoUrl={activeMedia.url}
                    videoThumbnailUrl={activeMedia.thumbnail}
                    fallbackPoster={mediaItems.find(m => m.type === 'image')?.url || FALLBACK_PROPERTY_IMAGE}
                    embedded={true}
                    autoPlay={false}
                    title={activeMedia.title}
                  />
                </div>
              ) : (
                <img
                  src={resolveImageUrl(activeMedia.url)}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                />
              )}

              {/* Prev / Next Arrows */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer transition z-10 shadow-md backdrop-blur-xs"
                    title="السابق"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer transition z-10 shadow-md backdrop-blur-xs"
                    title="التالي"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badge for Type & Counter */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-mono font-semibold px-3 py-1 rounded-full flex items-center gap-2 z-10">
                {activeMedia.type === 'video' ? (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Video className="w-3.5 h-3.5" />
                    <span>فيديو</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-300">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>صورة</span>
                  </span>
                )}
                <span>•</span>
                <span>{activeMediaIndex + 1} / {mediaItems.length}</span>
              </div>
            </div>

            {/* Thumbnails */}
            {mediaItems.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                {mediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer group ${
                      activeMediaIndex === idx 
                        ? 'border-[#8D6A28] shadow-md ring-2 ring-[#8D6A28]/30' 
                        : 'border-transparent opacity-75 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <img 
                      src={resolveImageUrl(item.thumbnail || item.url)} 
                      alt={item.title || `وسائط ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-amber-500/90 text-white flex items-center justify-center shadow-xs">
                          <Play className="w-3 h-3 fill-white translate-x-px" />
                        </div>
                      </div>
                    )}
                    {item.type === 'video' && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-amber-400 text-[9px] font-black px-1 rounded">
                        فيديو
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#8D6A28]" />
              <span>المواصفات الفنية والتفصيلية</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">المساحة</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{property.area} م²</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">عدد الغرف</span>
                <span className="text-sm font-bold text-slate-900">{property.rooms} غرف</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">الحمامات</span>
                <span className="text-sm font-bold text-slate-900">{property.bathrooms} حمام</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">الدور</span>
                <span className="text-sm font-bold text-slate-900">{property.floor === 0 ? 'أرضي' : `الدور ${property.floor}`}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">البلكونات</span>
                <span className="text-sm font-bold text-slate-900">{property.balconies !== undefined ? `${property.balconies} بلكونة` : 'غير محدد'}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">نوع التشطيب</span>
                <span className="text-sm font-bold text-slate-900">
                  {property.finishing === 'super_lux' ? 'سوبر لوكس' : property.finishing === 'ultra_lux' ? 'ألترا لوكس' : property.finishing === 'lux' ? 'لوكس' : 'نصف تشطيب'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">حالة الفرش</span>
                <span className="text-sm font-bold text-slate-900">
                  {property.furnishing === 'furnished' ? 'مفروش بالكامل' : property.furnishing === 'semi_furnished' ? 'نصف مفروش' : 'غير مفروش'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">الفئة المستهدفة</span>
                <span className="text-sm font-bold text-slate-900">
                  {property.audience_type === 'female_students' ? 'طالبات بنات' : property.audience_type === 'young_men' ? 'شباب وموظفون' : property.audience_type === 'families' ? 'عائلات فقط' : 'الجميع'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">طبيعة السعر</span>
                <span className="text-sm font-bold text-slate-900">{property.is_negotiable ? 'قابل للتفاوض' : 'سعر نهائي'}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">مدة الإيجار</span>
                <span className="text-sm font-bold text-slate-900">
                  {property.rent_duration === 'yearly' ? 'سنوي' : property.rent_duration === '6_months' ? '6 أشهر' : property.rent_duration === '3_months' ? '3 أشهر' : 'شهري'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">نوع العقار</span>
                <span className="text-sm font-bold text-slate-900">
                  {property.property_type === 'apartment' ? 'شقة سكنية' : property.property_type === 'villa' ? 'فيلا مستقلة' : property.property_type === 'duplex' ? 'دوبلكس' : property.property_type === 'shop' ? 'محل تجاري' : property.property_type === 'office' ? 'مكتب إداري' : property.property_type === 'studio' ? 'استوديو' : 'عقار'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">الحي / المنطقة</span>
                <span className="text-sm font-bold text-slate-900">{property.district_name}</span>
              </div>
            </div>
          </div>

          {/* Amenities & Features */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8D6A28]" />
                <span>المميزات والخدمات المتوفرة ({property.amenities.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {property.amenities.map((amenity, idx) => {
                  const display = getAmenityDisplay(amenity);
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800">
                      <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#8D6A28] shrink-0">
                        {display.icon}
                      </span>
                      <span className="truncate">{display.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#8D6A28]" />
              <span>الوصف الكامل للعقار</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              {property.description || 'لا يوجد وصف متاح للعقار حالياً.'}
            </p>
          </div>

          {/* Tags & Keywords */}
          {property.tags && property.tags.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#8D6A28]" />
                <span>الكلمات الدلالية والوسوم</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {property.tags.map((tag: any, idx) => {
                  const tagLabel = typeof tag === 'string' ? tag : (tag?.name || String(tag || ''));
                  if (!tagLabel) return null;
                  return (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/70">
                      #{tagLabel}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Full-Width Location Map */}
          <PropertyLocationMap
            latitude={property.latitude}
            longitude={property.longitude}
            locationName={property.district_name}
            propertyTitle={property.title}
            height="320px"
          />

          {/* Detailed Rooms List (if room rental) */}
          {property.has_detailed_rooms && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-[#8D6A28]" />
                  <span>الغرف المستقلة المسجلة ({property.detailed_rooms?.length || 0})</span>
                </h3>
                <button
                  onClick={() => setIsRoomsModalOpen(true)}
                  className="text-xs font-semibold text-[#8D6A28] hover:underline cursor-pointer"
                >
                  تعديل الغرف
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {property.detailed_rooms?.map((room) => (
                  <div key={room.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <img
                      src={resolveImageUrl(room.imageUrl)}
                      alt={room.name}
                      className="w-14 h-14 rounded-lg object-cover"
                      onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{room.name}</h4>
                      <p className="text-[11px] font-semibold text-[#8D6A28] mt-0.5">{room.price.toLocaleString()} ج.م / شهرياً</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block mt-1 ${
                        room.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {room.status === 'available' ? 'متاحة' : 'محجوزة'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Owner, Location Summary, QR Code, Analytics, Reservations */}
        <div className="space-y-6">
          
          {/* Price & Financial Box */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#8D6A28]" />
              <span>التسعير والبيانات المالية</span>
            </h3>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>السعر الإداري المعلن:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {property.price.toLocaleString()} ج.م
                </span>
              </div>

              {offer.isActive && (
                <>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#8D6A28]">
                    <span>سعر العرض الترويجي:</span>
                    <span className="font-mono font-bold text-base text-[#8D6A28]">
                      {effectivePrice.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span>قيمة الخصم والتوفير:</span>
                    <span className="font-mono font-bold">
                      {(offer.savingsAmount || 0).toLocaleString()} ج.م ({offer.discountPercentage || 0}%)
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 border-t border-slate-200/80">
                <span>عمولة سكني المقدرة ({commissionPercentage}%):</span>
                <span className="font-mono font-bold text-[#8D6A28]">
                  {estimatedCommission.toLocaleString()} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Owner / Lister Contact Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#8D6A28]" />
              <span>بيانات المالك وجهة الاتصال</span>
            </h3>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">اسم المالك / المعلن:</span>
                <span className="font-bold text-slate-900">{property.owner_name || 'إدارة منصة سكني'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">رقم الهاتف:</span>
                <span className="font-mono font-bold text-slate-900" dir="ltr">
                  {property.owner_phone || '01067725976'}
                </span>
              </div>

              {/* Action Buttons for Owner */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                <a
                  href={`tel:${property.owner_phone || '01067725976'}`}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>اتصال</span>
                </a>
                <a
                  href={`https://wa.me/${String(property.owner_phone || '201067725976').replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم بخصوص العقار "${property.title}" كود (${property.ref_id})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </a>
              </div>
            </div>
          </div>

          {/* Detailed Location & Coordinates Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8D6A28]" />
                <span>الموقع الجغرافي والعنوان</span>
              </h3>
              <a
                href={property.latitude && property.longitude ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.district_name + ' دمياط الجديدة')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#8D6A28] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium shrink-0">الحي والمنطقة:</span>
                <span className="font-bold text-slate-900 text-left">{property.district_name}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium shrink-0">العنوان التفصيلي:</span>
                <span className="font-semibold text-slate-800 text-left">
                  {property.address_detail || 'دمياط الجديدة — بالقرب من الخدمات الرئيسية'}
                </span>
              </div>

              {(property.latitude && property.longitude) && (
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>الإحداثيات:</span>
                  <span>{property.latitude.toFixed(5)}, {property.longitude.toFixed(5)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick QR Code & Sharing Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4 text-center">
            <div className="flex items-center justify-between text-right pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#8D6A28]" />
                <h3 className="text-sm font-bold text-slate-900">رمز QR ومشاركة العقار</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                مسح ومشاركة
              </span>
            </div>

            {qrDataUrl ? (
              <div className="space-y-3">
                <div 
                  className="p-2.5 bg-white border border-slate-200 rounded-2xl inline-block shadow-2xs cursor-pointer hover:border-[#8D6A28]/50 transition group relative"
                  onClick={() => setIsQrModalOpen(true)}
                  title="اضغط لتكبير كود الـ QR"
                >
                  <img src={qrDataUrl} alt="Property QR Code" className="w-32 h-32 mx-auto rounded-lg" />
                  <span className="absolute inset-0 bg-slate-950/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs">
                    تكبير الرمز
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 font-normal">
                  امسح الرمز بكاميرا الموبايل لفتح صفحة العقار أو شاركه مباشرة مع العملاء
                </p>

                {/* Main Action Buttons Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-[#8D6A28] text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>مشاركة سريعة</span>
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>عبر واتساب</span>
                  </button>
                </div>

                {/* Secondary Actions (Copy Link, Download PNG, Print) */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    onClick={handleCopyPublicLink}
                    className="py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="نسخ الرابط المباشر"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>

                  <button
                    onClick={handleDownloadQr}
                    className="py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="تحميل كود QR كصورة PNG"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>تحميل PNG</span>
                  </button>

                  <button
                    onClick={handlePrintQr}
                    className="py-1.5 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                    title="طباعة بطاقة المعاينة"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>طباعة</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">جاري إنشاء رمز QR...</div>
            )}
          </div>

          {/* Analytics & Views */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#8D6A28]" />
              <span>إحصائيات التفاعل والزيارات</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                <span className="text-xs font-medium text-slate-500 block">المشاهدات</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{property.views || 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                <span className="text-xs font-medium text-slate-500 block">طلبات المعاينة</span>
                <span className="text-lg font-bold text-[#8D6A28] font-mono">{reservations.length}</span>
              </div>
            </div>
          </div>

          {/* Associated Client Reservations History */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8D6A28]" />
              <span>طلبات الحجز والمعاينة المرتبطة ({reservations.length})</span>
            </h3>

            {reservations.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl border border-slate-100">
                لا توجد طلبات حجز مسجلة لهذا العقار بعد.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {reservations.map((res) => (
                  <div key={res.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900">{res.client_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-[#8D6A28] border border-amber-200'
                      }`}>
                        {res.status === 'confirmed' ? 'مؤكد' : 'قيد المتابعة'}
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">{res.client_phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata & System Info */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 space-y-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>تاريخ الإضافة:</span>
              <span className="font-mono text-slate-700">{property.created_at ? formatArabicDate(property.created_at) : 'غير مسجل'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>المعرف الرقمي:</span>
              <span className="font-mono text-slate-700">#{property.id}</span>
            </div>
          </div>

        </div>

      </div>

      {/* ----------------- SHARE MODAL ----------------- */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">مشاركة بيانات العقار</h3>
                  <p className="text-[11px] text-slate-500 font-normal">{property.ref_id} — {property.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Link Copy Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">رابط العقار المباشر</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getPublicUrl()}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700 outline-none select-all"
                />
                <button
                  onClick={handleCopyPublicLink}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#8D6A28] text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* Share Channels */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="block text-xs font-semibold text-slate-700">مشاركة سريعة عبر:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>واتساب</span>
                </button>

                <button
                  onClick={handleTelegramShare}
                  className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>تليجرام</span>
                </button>

                <button
                  onClick={handleFacebookShare}
                  className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>فيسبوك</span>
                </button>

                <button
                  onClick={handleNativeShare}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#8D6A28]" />
                  <span>تطبيقات الموبايل</span>
                </button>
              </div>
            </div>

            {/* QR Code Shortcut inside Share Modal */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">هل تريد طباعة كود QR؟</span>
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setIsQrModalOpen(true);
                }}
                className="text-xs font-bold text-[#8D6A28] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>فتح نافذة QR</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- QR CODE MODAL ----------------- */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up text-center">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-right">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">رمز QR التفاعلي للعقار</h3>
                  <p className="text-[11px] text-slate-500 font-normal">{property.ref_id} — {property.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Preview Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="Property QR" className="w-56 h-56 mx-auto rounded-xl shadow-xs" />
              )}
              <div className="mt-2 text-center space-y-0.5">
                <p className="text-xs font-bold text-slate-900">{property.title}</p>
                <p className="text-[11px] text-[#8D6A28] font-mono font-bold">{property.ref_id} • {property.price.toLocaleString()} ج.م</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-normal">
              يمكن مسح هذا الرمز بأي كاميرا موبايل لفتح تفاصيل العقار مباشرة بدون كتابة الرابط
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleDownloadQr}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>تحميل صورة PNG</span>
              </button>

              <button
                onClick={handlePrintQr}
                className="py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#8D6A28] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة بطاقة المعاينة</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Offer Modal */}
      {isOfferModalOpen && (
        <AdminOfferModal
          isOpen={isOfferModalOpen}
          property={property}
          onClose={() => setIsOfferModalOpen(false)}
          onOfferSaved={() => {
            setIsOfferModalOpen(false);
            if (id) loadPropertyData(id);
          }}
        />
      )}

      {/* Rooms Modal */}
      {isRoomsModalOpen && (
        <AdminRoomManagementModal
          isOpen={isRoomsModalOpen}
          property={property}
          onClose={() => setIsRoomsModalOpen(false)}
          onRoomsUpdated={() => {
            setIsRoomsModalOpen(false);
            if (id) loadPropertyData(id);
          }}
        />
      )}

      {/* Fast Media Management Modal */}
      {isMediaModalOpen && (
        <AdminMediaManagementModal
          isOpen={isMediaModalOpen}
          property={property}
          onClose={() => setIsMediaModalOpen(false)}
          onUpdated={(updated) => {
            setIsMediaModalOpen(false);
            setProperty(updated);
            if (id) loadPropertyData(id);
          }}
        />
      )}

    </div>
  );
};
