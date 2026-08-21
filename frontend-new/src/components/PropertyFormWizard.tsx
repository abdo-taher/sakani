import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Property, 
  OperationType, 
  PropertyType, 
  FinishingType, 
  FurnishingType, 
  AudienceType,
  DetailedRoom, 
  LocationDistrict 
} from '../types';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { getAmenityDisplay } from '../utils/amenities';
import { validatePropertyStep, normalizeEgyptianPhone } from '../utils/validation';
import { LocationMapPicker } from './LocationMapPicker';
import { PropertyVideoThumbnail } from './PropertyVideoThumbnail';
import { PropertyMultiVideoPlayer } from './PropertyMultiVideoPlayer';
import { generateAndUploadVideoThumbnail, resolveImageUrl, FALLBACK_PROPERTY_IMAGE } from '../utils/media';
import { PropertyFormSkeleton } from './Skeletons';
import { evaluatePropertyOffer, getTodayDateString } from '../utils/offerUtils';
import confetti from 'canvas-confetti';
import {
  Building2,
  Home as HomeIcon,
  Store,
  Briefcase,
  Sparkles,
  MapPin,
  DollarSign,
  Upload,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Star,
  Users,
  Film,
  Layers,
  Plus,
  AlertCircle,
  Play,
  Check,
  MoveUp,
  MoveDown,
  Loader2,
  Flame,
  Tag,
  Calendar,
  Percent
} from 'lucide-react';

interface PropertyFormWizardProps {
  initialPropertyId?: string;
  isAdmin?: boolean;
  onSuccess?: (property: Property) => void;
  onCancel?: () => void;
}

const PROPERTY_TYPES: { type: PropertyType; label: string; icon: any }[] = [
  { type: 'apartment', label: 'شقة سكنية', icon: Building2 },
  { type: 'villa', label: 'فيلا مستقلة', icon: HomeIcon },
  { type: 'duplex', label: 'دوبلكس / بنتهاوس', icon: Building2 },
  { type: 'chalet', label: 'شاليه', icon: Sparkles },
  { type: 'studio', label: 'استوديو', icon: HomeIcon },
  { type: 'shop', label: 'محل تجاري', icon: Store },
  { type: 'office', label: 'مكتب / مقر إداري', icon: Briefcase },
  { type: 'land', label: 'أرض / موقع', icon: MapPin },
  { type: 'building', label: 'عمارة كاملة', icon: Building2 },
];

const AUDIENCE_OPTIONS: { type: AudienceType; label: string; desc: string; badge: string }[] = [
  { type: 'families', label: 'عائلات', desc: 'مناسب للأسر والعائلات', badge: 'مناسب للعائلات' },
  { type: 'young_men', label: 'شباب', desc: 'مناسب للشباب والمهندسين والعمال', badge: 'مناسب للشباب' },
  { type: 'female_students', label: 'طلبة بنات', desc: 'سكن مخصص للطالبات والمغتربات', badge: 'مناسب للطالبات' },
  { type: 'all', label: 'عام / الكل', desc: 'متاح لكافة الفئات', badge: 'متاح للجميع' },
];

export const FINISHING_LABELS: Record<FinishingType, string> = {
  super_lux: 'سوبر لوكس',
  lux: 'لوكس',
  semi_finished: 'نصف تشطيب',
  red_brick: 'طوب أحمر / هيكل',
};

export const FURNISHING_LABELS: Record<FurnishingType, string> = {
  unfurnished: 'غير مفروش',
  furnished: 'مفروش بالكامل',
};

export const normalizeFinishing = (val: any): FinishingType => {
  if (!val) return 'super_lux';
  const str = String(val).toLowerCase().trim();
  if (str === 'super_lux' || str.includes('سوبر')) return 'super_lux';
  if (str === 'lux' || str.includes('لوكس')) return 'lux';
  if (str === 'semi_finished' || str.includes('نصف') || str.includes('محارة')) return 'semi_finished';
  if (str === 'red_brick' || str.includes('طوب') || str.includes('هيكل')) return 'red_brick';
  return 'super_lux';
};

export const normalizeFurnishing = (val: any): FurnishingType => {
  if (!val) return 'unfurnished';
  const str = String(val).toLowerCase().trim();
  if ((str.includes('مفروش') && !str.includes('غير')) || str === 'furnished') return 'furnished';
  return 'unfurnished';
};

const WIZARD_STEPS = [
  { step: 1, title: 'المعلومات والتصنيف', subtitle: 'النوع والفئة المستهدفة' },
  { step: 2, title: 'الموقع والخريطة', subtitle: 'الحي والإحداثيات' },
  { step: 3, title: 'المواصفات', subtitle: 'المساحة والغرف والتشطيب' },
  { step: 4, title: 'التسعير والإيجار', subtitle: 'نظام البيع أو غرف الإيجار' },
  { step: 5, title: 'المميزات والوسوم', subtitle: 'الخدمات المتوفرة' },
  { step: 6, title: 'الصور والفيديو', subtitle: 'معاينة الوسائط والغلاف' },
  { step: 7, title: 'المراجعة والحفظ', subtitle: 'التأكيد والاعتماد' },
];

export const PropertyFormWizard: React.FC<PropertyFormWizardProps> = ({
  initialPropertyId,
  isAdmin = true,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = Boolean(initialPropertyId);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const stepsBarRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the steps bar on mobile to center the active step button
  useEffect(() => {
    if (stepsBarRef.current) {
      const activeBtn = stepsBarRef.current.querySelector(`[data-step="${currentStep}"]`) as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentStep]);

  // Lists
  const [districtsList, setDistrictsList] = useState<LocationDistrict[]>([]);
  const [availableAmenities, setAvailableAmenities] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [operationType, setOperationType] = useState<OperationType>('sale');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [audienceType, setAudienceType] = useState<AudienceType>('families');

  // Location
  const [locationId, setLocationId] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [latitude, setLatitude] = useState<string>('31.4385');
  const [longitude, setLongitude] = useState<string>('31.6705');

  // Specs
  const [area, setArea] = useState<string>('120');
  const [rooms, setRooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('2');
  const [floor, setFloor] = useState<string>('2');
  const [balconies, setBalconies] = useState<string>('1');
  const [finishing, setFinishing] = useState<FinishingType>('super_lux');
  const [furnishing, setFurnishing] = useState<FurnishingType>('unfurnished');
  const [status, setStatus] = useState<Property['status']>('available');
  const [featured, setFeatured] = useState(false);

  // Pricing & Renting
  const [price, setPrice] = useState<string>('1500000');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [rentalMode, setRentalMode] = useState<'full' | 'rooms'>('full');
  const [rentDuration, setRentDuration] = useState<'monthly' | '3_months' | '6_months' | 'yearly'>('monthly');
  const [detailedRooms, setDetailedRooms] = useState<DetailedRoom[]>([]);
  const [uploadingRoomIndex, setUploadingRoomIndex] = useState<number | null>(null);

  // Offers & Promotions
  const [hasOffer, setHasOffer] = useState<boolean>(false);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerDiscountPercentage, setOfferDiscountPercentage] = useState<string>('');
  const [offerStartDate, setOfferStartDate] = useState<string>('');
  const [offerEndDate, setOfferEndDate] = useState<string>('');
  const [offerTitle, setOfferTitle] = useState<string>('');
  const [offerBadge, setOfferBadge] = useState<string>('خصم خاص');

  // Amenities & Tags
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'elevator', 'natural_gas', 'super_lux', 'security'
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>(['فرصة استثمارية', 'واجهة بحرية']);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string>('');
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);

  // Owner / Submitter
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // 1. Initial Load & Edit Data Resolution
  useEffect(() => {
    loadAuxiliaryData();
    if (initialPropertyId) {
      loadExistingProperty(initialPropertyId);
    }
  }, [initialPropertyId]);

  const loadAuxiliaryData = async () => {
    try {
      const locs = await ApiService.getLocations();
      if (Array.isArray(locs) && locs.length > 0) {
        const mapped = locs.map((l: any) => ({
          id: String(l.id),
          name: l.name,
          description: l.description || '',
          available_count: Number(l.available_count || l.properties_count) || 0,
          image_url: l.image_url || '',
          coordinates: { lat: Number(l.latitude) || 31.4385, lng: Number(l.longitude) || 31.6705 }
        }));
        setDistrictsList(mapped);
        if (!locationId && mapped.length > 0) {
          setLocationId(mapped[0].id);
        }
      }
    } catch (e) {
      const fallback = StorageService.getDistricts();
      setDistrictsList(fallback);
      if (!locationId && fallback.length > 0) setLocationId(fallback[0].id);
    }

    try {
      const [amenities, tags] = await Promise.all([
        ApiService.getAmenities(),
        ApiService.getTags(),
      ]);

      if (Array.isArray(amenities)) {
        setAvailableAmenities(
          Array.from(new Set(amenities
            .map((amenity: any) => typeof amenity === 'string' ? amenity : amenity?.name)
            .filter(Boolean))) as string[]
        );
      }

      if (Array.isArray(tags)) {
        setAvailableTags(
          Array.from(new Set(tags
            .map((tag: any) => typeof tag === 'string' ? tag : tag?.name)
            .filter(Boolean))) as string[]
        );
      }
    } catch {
      const savedTags = localStorage.getItem('sakani_admin_tags');
      if (savedTags) setAvailableTags(JSON.parse(savedTags));
      const savedAmenities = localStorage.getItem('sakani_admin_amenities');
      if (savedAmenities) setAvailableAmenities(JSON.parse(savedAmenities));
    }
  };

  const loadExistingProperty = async (id: string) => {
    setIsLoadingExisting(true);
    try {
      // 1. Fetch live backend property
      const res = await ApiService.getProperty(id);
      const prop: any = res?.data || res;

      if (prop) {
        setTitle(String(prop.title || ''));
        setDescription(String(prop.description || ''));
        
        // Operation type
        const op = typeof prop.operation_type === 'string' ? prop.operation_type : (prop.category?.slug === 'rent' ? 'rent' : 'sale');
        setOperationType(op === 'sale' ? 'sale' : 'rent');

        // Property type
        let resolvedType: PropertyType = 'apartment';
        if (typeof prop.property_type === 'string') {
          resolvedType = prop.property_type as PropertyType;
        } else if (prop.property_type && typeof prop.property_type === 'object') {
          const typeName = prop.property_type.name || prop.property_type.slug || '';
          if (typeName.includes('شقة') || typeName.includes('apartment')) resolvedType = 'apartment';
          else if (typeName.includes('فيلا') || typeName.includes('villa')) resolvedType = 'villa';
          else if (typeName.includes('دوبلكس') || typeName.includes('duplex')) resolvedType = 'duplex';
          else if (typeName.includes('محل') || typeName.includes('shop')) resolvedType = 'shop';
          else if (typeName.includes('مكتب') || typeName.includes('office')) resolvedType = 'office';
          else if (typeName.includes('شاليه') || typeName.includes('chalet')) resolvedType = 'chalet';
          else resolvedType = (prop.property_type.slug as PropertyType) || 'apartment';
        }
        setPropertyType(resolvedType);

        // Audience
        const aud = typeof prop.audience_type === 'string' ? prop.audience_type : (prop.audience_type?.slug || 'families');
        setAudienceType(aud as AudienceType);

        // Location
        const locId = prop.location_id || (prop.location && typeof prop.location === 'object' ? prop.location.id : prop.location);
        setLocationId(String(locId || ''));
        setAddressDetail(String(prop.address_detail || prop.address || ''));
        setLatitude(String(prop.latitude || '31.4385'));
        setLongitude(String(prop.longitude || '31.6705'));

        setArea(String(prop.area ?? prop.area_sqm ?? ''));
        const roomsCount = prop.rooms ?? (Array.isArray(prop.detailed_rooms || prop.detailedRooms) ? (prop.detailed_rooms || prop.detailedRooms).length : 3);
        setRooms(String(roomsCount));
        setBathrooms(String(prop.bathrooms ?? 2));
        setFloor(String(prop.floor ?? 1));
        setBalconies(String(prop.balconies ?? 1));

        setFinishing(normalizeFinishing(prop.finishing));
        setFurnishing(normalizeFurnishing(prop.furnishing));

        setStatus(String(prop.status || 'available'));
        setFeatured(Boolean(prop.featured));

        setPrice(String(prop.price || ''));
        setIsNegotiable(Boolean(prop.is_negotiable));
        setHasOffer(Boolean(prop.has_offer));
        setOfferPrice(prop.offer_price ? String(prop.offer_price) : '');
        setOfferDiscountPercentage(prop.offer_discount_percentage ? String(prop.offer_discount_percentage) : '');
        setOfferStartDate(prop.offer_start_date ? prop.offer_start_date.split('T')[0] : '');
        setOfferEndDate(prop.offer_end_date ? prop.offer_end_date.split('T')[0] : '');
        setOfferTitle(prop.offer_title || '');
        setOfferBadge(prop.offer_badge || 'خصم خاص');

        setRentDuration(typeof prop.rent_duration === 'string' ? prop.rent_duration : 'monthly');
        setRentalMode(prop.has_detailed_rooms ? 'rooms' : 'full');

        // Media (Deduplicated)
        if (Array.isArray(prop.images)) {
          const rawImgs: string[] = prop.images
            .map((img: any) => typeof img === 'string' ? img : (img.image_url || img.url || img.image_path))
            .filter(Boolean);
          const uniqueImgs = Array.from(new Set(rawImgs));
          setImages(uniqueImgs);
          const primaryIdx = prop.images.findIndex((img: any) => img.is_primary);
          if (primaryIdx >= 0 && primaryIdx < uniqueImgs.length) {
            setPrimaryImageIndex(primaryIdx);
          } else {
            setPrimaryImageIndex(0);
          }
        }

        setVideoUrl(prop.video_url || '');
        setVideoThumbnailUrl(prop.video_thumbnail_url || '');
        setIsVideoPreviewOpen(false);

        // Amenities
        if (Array.isArray(prop.amenities)) {
          const mappedAmenities = prop.amenities.map((a: any) => typeof a === 'string' ? a : (a.name || a.slug || String(a.id)));
          setSelectedAmenities(Array.from(new Set(mappedAmenities.filter(Boolean))));
        }

        // Tags
        if (Array.isArray(prop.tags)) {
          const mappedTags = prop.tags.map((t: any) => typeof t === 'string' ? t : (t.name || t.slug || String(t.id)));
          setSelectedTags(Array.from(new Set(mappedTags.filter(Boolean))));
        }

        // Detailed Rooms (Deduplicated by ID or Name)
        if (Array.isArray(prop.detailed_rooms || prop.detailedRooms)) {
          const rawRooms = prop.detailed_rooms || prop.detailedRooms;
          const seenKeys = new Set<string>();
          const uniqueRooms = rawRooms
            .filter((r: any) => {
              const key = String(r.id || r.name);
              if (seenKeys.has(key)) return false;
              seenKeys.add(key);
              return true;
            })
            .map((r: any) => {
              const media = Array.isArray(r.room_images) ? r.room_images : (r.media || []);
              const roomImages = media.filter((item: any) => (item.media_type || 'image') === 'image');
              const roomVideos = media.filter((item: any) => item.media_type === 'video');
              return {
                id: String(r.id),
                name: r.name || '',
                price: Number(r.price) || 0,
                area: r.area == null ? undefined : Number(r.area),
                description: r.description || '',
                status: r.status || 'available',
                media,
                imageUrl: roomImages.find((item: any) => item.is_primary)?.image_url || roomImages[0]?.image_url,
                images: roomImages.map((item: any) => item.image_url).filter(Boolean),
                videos: roomVideos.map((item: any) => item.image_url).filter(Boolean),
              };
            });
          setDetailedRooms(uniqueRooms);
        }

        setOwnerName(prop.submitter_name || prop.owner_name || '');
        setOwnerPhone(prop.submitter_phone || prop.owner_phone || '');
        setAdminNotes(prop.admin_notes || '');
      }
    } catch (e) {
      console.error('Failed to load property for edit:', e);
      setGeneralError('تعذر تحميل بيانات العقار للتعديل');
    } finally {
      setIsLoadingExisting(false);
    }
  };

  // 2. Validate current step before moving forward
  const handleNextStep = () => {
    const dataToValidate = {
      title,
      description,
      operation_type: operationType,
      property_type: propertyType,
      location_id: locationId,
      latitude,
      longitude,
      area,
      rooms,
      bathrooms,
      floor,
      price,
      rental_mode: rentalMode,
      detailed_rooms: detailedRooms,
      images,
      is_edit: isEditMode,
    };

    const validation = validatePropertyStep(currentStep, dataToValidate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, 7));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Image Upload to Cloudflare R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files) as File[];
    setUploadingImage(true);

    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const res = await ApiService.uploadMedia(file, 'sakani/properties/images');
        if (res?.url) {
          newUrls.push(res.url);
        }
      }
      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert('فشل رفع بعض الصور إلى السحابة: ' + (err.message || ''));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 4. Video Upload to Cloudflare R2 + Auto Thumbnail
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Max 100MB client validation
    if (file.size > 100 * 1024 * 1024) {
      alert('حجم ملف الفيديو كبير جداً (أكثر من 100 ميجابايت). يُرجى استخدام فيديو أصغر أو وضع رابط الفيديو المباشر في الحقل المخصص.');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    setUploadingVideo(true);

    try {
      // 1. Upload Video directly to R2
      const res = await ApiService.uploadMedia(file, 'sakani/properties/videos');
      if (res?.url) {
        setVideoUrl(res.url);
        setIsVideoPreviewOpen(false);

        // 2. Generate and upload video thumbnail automatically
        try {
          const thumbRes = await generateAndUploadVideoThumbnail(file);
          if (thumbRes?.url) {
            setVideoThumbnailUrl(thumbRes.url);
            setImages((prev) => prev.length === 0 ? [thumbRes.url] : prev);
          }
        } catch (thumbErr) {
          console.warn('Auto video thumbnail warning:', thumbErr);
        }
      }
    } catch (err: any) {
      console.error('Video upload failed:', err);
      alert('فشل رفع الفيديو: ' + (err.message || 'تأكد من اتصال الإنترنت وحجم الملف'));
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // 5. Image Management
  const handleSetPrimary = (index: number) => {
    setPrimaryImageIndex(index);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex >= index && primaryImageIndex > 0) {
      setPrimaryImageIndex((prev) => prev - 1);
    }
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === images.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newImgs = [...images];
    const temp = newImgs[index];
    newImgs[index] = newImgs[targetIndex];
    newImgs[targetIndex] = temp;
    setImages(newImgs);

    if (primaryImageIndex === index) setPrimaryImageIndex(targetIndex);
    else if (primaryImageIndex === targetIndex) setPrimaryImageIndex(index);
  };

  // 6. Detailed Rooms Management
  const handleAddRoom = () => {
    const newRoom: DetailedRoom = {
      id: `room-${Date.now()}`,
      name: `غرفة ${detailedRooms.length + 1}`,
      price: Number(price) ? Math.round(Number(price) / Math.max(detailedRooms.length + 1, 1)) : 1500,
      area: 20,
      description: 'غرفة مفروشة ومكيفة',
      status: 'available',
      images: [],
      videos: [],
      media: [],
    };
    setDetailedRooms([...detailedRooms, newRoom]);
  };

  const handleRemoveRoom = (index: number) => {
    setDetailedRooms(detailedRooms.filter((_, i) => i !== index));
  };

  const handleUpdateRoom = (index: number, field: keyof DetailedRoom, value: any) => {
    setDetailedRooms(detailedRooms.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleRoomMediaUpload = async (index: number, files: FileList | null) => {
    if (!files?.length) return;
    setUploadingRoomIndex(index);
    try {
      const additions: NonNullable<DetailedRoom['media']> = [];
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        if (isVideo && file.size > 100 * 1024 * 1024) {
          throw new Error('حجم فيديو الغرفة أكبر من 100 ميجابايت');
        }
        const uploaded = await ApiService.uploadMedia(
          file,
          isVideo ? 'sakani/rooms/videos' : 'sakani/rooms/images'
        );
        if (uploaded?.url) {
          additions.push({
            image_url: uploaded.url,
            image_public_id: uploaded.public_id || uploaded.file_path || uploaded.url,
            media_type: isVideo ? 'video' : 'image',
          });
        }
        if (isVideo) {
          try {
            const thumbnail = await generateAndUploadVideoThumbnail(file);
            if (thumbnail?.url) {
              additions.push({
                image_url: thumbnail.url,
                image_public_id: thumbnail.public_id || thumbnail.url,
                media_type: 'image',
              });
            }
          } catch (error) {
            console.warn('Room video thumbnail could not be generated:', error);
          }
        }
      }
      setDetailedRooms((rooms) => rooms.map((room, roomIndex) => {
        if (roomIndex !== index) return room;
        const media = [...(room.media || []), ...additions].map((item, mediaIndex) => ({
          ...item,
          is_primary: item.media_type === 'image' && mediaIndex === 0,
        }));
        return {
          ...room,
          media,
          images: media.filter((item) => item.media_type === 'image').map((item) => item.image_url),
          videos: media.filter((item) => item.media_type === 'video').map((item) => item.image_url),
        };
      }));
    } catch (error: any) {
      alert('فشل رفع وسائط الغرفة: ' + (error?.message || 'خطأ غير معروف'));
    } finally {
      setUploadingRoomIndex(null);
    }
  };

  const handleRemoveRoomMedia = (roomIndex: number, mediaIndex: number) => {
    setDetailedRooms((rooms) => rooms.map((room, index) => {
      if (index !== roomIndex) return room;
      const media = (room.media || []).filter((_, index) => index !== mediaIndex).map((item, index) => ({
        ...item,
        is_primary: item.media_type === 'image' && index === 0,
      }));
      return {
        ...room,
        media,
        images: media.filter((item) => item.media_type === 'image').map((item) => item.image_url),
        videos: media.filter((item) => item.media_type === 'video').map((item) => item.image_url),
      };
    }));
  };

  // 7. Final Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(null);

    const finalRooms = (operationType === 'rent' && rentalMode === 'rooms')
      ? Math.max(detailedRooms.length, Number(rooms) || 0)
      : (Number(rooms) || 0);
    const persistedImages = Array.from(new Set(
      images.filter((url) => /^https?:\/\//i.test(url))
    ));

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      is_negotiable: isNegotiable,
      has_offer: hasOffer,
      offer_price: hasOffer && offerPrice ? Number(offerPrice) : null,
      offer_discount_percentage: hasOffer && offerDiscountPercentage ? Number(offerDiscountPercentage) : null,
      offer_start_date: hasOffer && offerStartDate ? offerStartDate : null,
      offer_end_date: hasOffer && offerEndDate ? offerEndDate : null,
      offer_title: hasOffer ? offerTitle : null,
      offer_badge: hasOffer ? offerBadge : null,
      operation_type: operationType,
      property_type: propertyType,
      location_id: locationId ? (parseInt(locationId.replace(/\D/g, ''), 10) || 1) : 1,
      address_detail: addressDetail.trim() || null,
      latitude: Number(latitude) || 31.4385,
      longitude: Number(longitude) || 31.6705,
      area: Number(area) || 0,
      rooms: finalRooms,
      bathrooms: Number(bathrooms) || 0,
      floor: Number(floor) || 0,
      balconies: Number(balconies) || 0,
      finishing,
      furnishing,
      audience_type: audienceType,
      status,
      featured,
      amenities: selectedAmenities,
      tags: selectedTags,
      rent_duration: operationType === 'rent' ? rentDuration : null,
      has_detailed_rooms: operationType === 'rent' && rentalMode === 'rooms',
      video_url: videoUrl ? videoUrl.trim() : null,
      video_public_id: videoUrl ? videoUrl.trim() : null,
      video_thumbnail_url: (videoUrl && videoThumbnailUrl) ? videoThumbnailUrl.trim() : null,
      replace_images: true,
      replace_rooms: true,
      images: (() => {
        const raw = persistedImages;
        if (primaryImageIndex >= 0 && primaryImageIndex < raw.length) {
          const primaryImg = raw[primaryImageIndex];
          const remaining = raw.filter((_, i) => i !== primaryImageIndex);
          return [primaryImg, ...remaining];
        }
        return raw;
      })(),
      uploaded_images: (() => {
        const raw = persistedImages;
        let ordered = raw;
        if (primaryImageIndex >= 0 && primaryImageIndex < raw.length) {
          const primaryImg = raw[primaryImageIndex];
          const remaining = raw.filter((_, i) => i !== primaryImageIndex);
          ordered = [primaryImg, ...remaining];
        }
        return ordered.map((url, idx) => ({
          image_url: url,
          image_public_id: url,
          media_type: 'image',
          sort_order: idx,
          is_primary: idx === 0,
        }));
      })(),
      rooms_data: operationType === 'rent' && rentalMode === 'rooms' ? detailedRooms.map(r => ({
        id: (r.id && !String(r.id).startsWith('room-') && !isNaN(Number(r.id))) ? Number(r.id) : undefined,
        name: r.name,
        description: r.description,
        price: r.price,
        area: r.area,
        status: r.status || 'available',
        media: r.media || [],
      })) : [],
      submitter_name: ownerName ? ownerName.trim() : null,
      submitter_phone: ownerPhone ? normalizeEgyptianPhone(ownerPhone) : null,
      admin_notes: adminNotes.trim() || null,
    };

    try {
      let savedProp: Property;
      if (isEditMode && initialPropertyId) {
        const res = await ApiService.updateProperty(initialPropertyId, payload);
        savedProp = res?.data || res;
      } else {
        const res = await ApiService.createProperty(payload);
        savedProp = res?.data || res;
      }

      // Also sync to local StorageService for offline resilience
      if (savedProp && savedProp.id) {
        StorageService.saveProperty(savedProp);
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onSuccess) {
        onSuccess(savedProp);
      } else {
        navigate('/admin/properties');
      }
    } catch (err: any) {
      console.error('Failed to submit property wizard:', err);
      setGeneralError(err.message || 'حدث خطأ أثناء حفظ العقار، يرجى مراجعة البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExisting) {
    return <PropertyFormSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto" dir="rtl">
      
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              {isEditMode ? 'تعديل بيانات العقار' : 'إضافة عقار جديد'}
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            معالج منظم من 7 خطوات لتسجيل كافة مواصفات وتفاصيل العقار والوسائط بدقة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
          )}
          <span className="text-xs font-black text-[#8D6A28] bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200">
            الخطوة {currentStep} من {WIZARD_STEPS.length}
          </span>
        </div>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Step Navigation Bar (Smooth Horizontal Scroll on Mobile) */}
      <div 
        ref={stepsBarRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-4 lg:grid-cols-7 flex-nowrap sm:flex-wrap scroll-smooth"
      >
        {WIZARD_STEPS.map((s) => {
          const isActive = currentStep === s.step;
          const isCompleted = currentStep > s.step;

          return (
            <button
              key={s.step}
              data-step={s.step}
              type="button"
              onClick={() => {
                if (isCompleted || isEditMode) setCurrentStep(s.step);
              }}
              disabled={!isCompleted && !isEditMode && currentStep !== s.step}
              className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer min-w-[130px] sm:min-w-0 shrink-0 sm:shrink ${
                isActive
                  ? 'border-[#8D6A28] bg-amber-50/70 shadow-xs ring-2 ring-[#8D6A28]/20'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:bg-emerald-50'
                  : 'border-slate-200 bg-white text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  isActive ? 'bg-[#8D6A28] text-white' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {s.step}
                </span>
                {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div>
                <h4 className={`text-xs font-black line-clamp-1 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                  {s.title}
                </h4>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {s.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        
        {/* ================= STEP 1: Basic Information & Audience ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">1. المعلومات الأساسية والتصنيف</h2>
              <p className="text-xs text-slate-500 mt-0.5">حدد عنوان العقار، نوع العملية العقارية، نوع العقار، والفئة المستهدفة</p>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الإعلان للعقار *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: شقة سوبر لوكس للبيع في الحي المتميز واجهة بحرية صريحة"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-[#8D6A28] ${
                    errors.title ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.title && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.title}</p>}
              </div>

              {/* Operation Type (Sale vs Rent) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العملية العقارية (بيع أو إيجار) *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOperationType('sale')}
                    className={`py-3 px-4 rounded-2xl border text-center font-black text-xs sm:text-sm transition cursor-pointer ${
                      operationType === 'sale'
                        ? 'gold-gradient text-white border-transparent shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    عقار للبيع (تمليك)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperationType('rent')}
                    className={`py-3 px-4 rounded-2xl border text-center font-black text-xs sm:text-sm transition cursor-pointer ${
                      operationType === 'rent'
                        ? 'gold-gradient text-white border-transparent shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    عقار للإيجار
                  </button>
                </div>
              </div>

              {/* Property Type Grid (Horizontal Scroll on Mobile) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العقار *</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-5 flex-nowrap sm:flex-wrap">
                  {PROPERTY_TYPES.map((pt) => {
                    const Icon = pt.icon;
                    const isSel = propertyType === pt.type;
                    return (
                      <button
                        key={pt.type}
                        type="button"
                        onClick={() => setPropertyType(pt.type)}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition cursor-pointer min-w-[100px] sm:min-w-0 shrink-0 sm:shrink ${
                          isSel
                            ? 'border-[#8D6A28] bg-amber-50 text-[#8D6A28] font-black ring-1 ring-[#8D6A28]'
                            : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 font-bold'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{pt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audience Classification */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users className="w-4 h-4 text-[#8D6A28]" />
                  <label className="block text-xs font-black text-slate-900">
                    تصنيف الفئة المستهدفة (مناسب لـ) *
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {AUDIENCE_OPTIONS.map((aud) => {
                    const isSel = audienceType === aud.type;
                    return (
                      <button
                        key={aud.type}
                        type="button"
                        onClick={() => setAudienceType(aud.type)}
                        className={`p-4 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between ${
                          isSel
                            ? 'border-[#8D6A28] bg-amber-50/80 shadow-xs ring-1 ring-[#8D6A28]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                            isSel ? 'bg-[#8D6A28] text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {aud.badge}
                          </span>
                          {isSel && <CheckCircle2 className="w-4 h-4 text-[#8D6A28]" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{aud.label}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{aud.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف التفصيلي للعقار *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً للعقار ومميزاته وموقعه والتجهيزات..."
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-medium text-slate-900 outline-none transition focus:border-[#8D6A28] resize-none h-28 ${
                    errors.description ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {errors.description && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Location & Map ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">2. الموقع والحي والخريطة التفاعلية</h2>
              <p className="text-xs text-slate-500 mt-0.5">حدد الحي في دمياط الجديدة وثبّت الموقع بالخريطة التفاعلية (يتم حفظ الإحداثيات تلقائياً)</p>
            </div>

            <div className="space-y-5">
              {/* District Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الحي / المنطقة بدمياط الجديدة *</label>
                <select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                    const selLoc = districtsList.find(d => d.id === e.target.value);
                    if (selLoc?.coordinates) {
                      setLatitude(String(selLoc.coordinates.lat));
                      setLongitude(String(selLoc.coordinates.lng));
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                >
                  {districtsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.description ? `(${d.description})` : ''}
                    </option>
                  ))}
                </select>
                {errors.location_id && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.location_id}</p>}
              </div>

              {/* Address detail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان التفصيلي والمعالم القريبة</label>
                <input
                  type="text"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="مثال: المجاورة الثالثة - بجوار مدرسة الكفراوي والخدمات"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              {/* Interactive Map Picker (Automatic Lat/Lng fill without manual numbers) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-slate-900">تثبيت موقع العقار على الخريطة التفاعلية</label>
                  <span className="text-[11px] font-bold text-[#8D6A28] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                    يتم تحديد خطوط الطول والعرض وحفظها تلقائياً
                  </span>
                </div>
                
                <LocationMapPicker
                  latitude={Number(latitude) || 31.4357}
                  longitude={Number(longitude) || 31.6708}
                  onChange={(coords) => {
                    setLatitude(String(coords.lat));
                    setLongitude(String(coords.lng));
                  }}
                  height="340px"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Specs & Details ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">3. المواصفات والتفاصيل</h2>
              <p className="text-xs text-slate-500 mt-0.5">المساحة، الغرف، الحمامات، الطابق، حالة التشطيب والفرش</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المساحة الإجمالية (م²) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="120"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28] ${
                    errors.area ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.area && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.area}</p>}
              </div>

              {/* Rooms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الغرف</label>
                <input
                  type="number"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  placeholder="3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الحمامات</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  placeholder="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              {/* Floor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الدور / الطابق</label>
                <input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              {/* Balconies */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الشرفات / البلكونات</label>
                <input
                  type="number"
                  min="0"
                  value={balconies}
                  onChange={(e) => setBalconies(e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                />
              </div>

              {/* Finishing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مستوى التشطيب</label>
                <select
                  value={finishing}
                  onChange={(e) => setFinishing(e.target.value as FinishingType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                >
                  <option value="super_lux">سوبر لوكس</option>
                  <option value="lux">لوكس</option>
                  <option value="semi_finished">نصف تشطيب</option>
                  <option value="red_brick">طوب أحمر / هيكل</option>
                </select>
              </div>

              {/* Furnishing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">حالة الفرش</label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                >
                  <option value="unfurnished">غير مفروش</option>
                  <option value="furnished">مفروش بالكامل</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: Pricing & Renting ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">4. التسعير وخيارات الدفع</h2>
              <p className="text-xs text-slate-500 mt-0.5">حدد سعر البيع الإجمالي أو قيمة الإيجار ونظام تأجير الغرف المنفصلة</p>
            </div>

            <div className="space-y-4">
              {/* Main Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {operationType === 'sale' ? 'سعر البيع الإجمالي (بالجنيه المصري) *' : 'سعر الإيجار الإجمالي (بالجنيه المصري) *'}
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1500000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black text-slate-900 outline-none focus:border-[#8D6A28]"
                />
                {errors.price && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.price}</p>}
              </div>

              <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-700">السعر قابل للتفاوض</span>
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 accent-[#8D6A28]"
                />
              </label>

              {/* If Rent: Rental Mode and Period */}
              {operationType === 'rent' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نظام الإيجار *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRentalMode('full')}
                        className={`p-3.5 rounded-2xl border font-bold text-xs sm:text-sm transition cursor-pointer ${
                          rentalMode === 'full'
                            ? 'gold-gradient text-white border-transparent shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        إيجار العقار بالكامل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRentalMode('rooms');
                          if (detailedRooms.length === 0) handleAddRoom();
                        }}
                        className={`p-3.5 rounded-2xl border font-bold text-xs sm:text-sm transition cursor-pointer ${
                          rentalMode === 'rooms'
                            ? 'gold-gradient text-white border-transparent shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        إيجار غرف منفصلة (سكن شباب / طلبة)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">مدة الإيجار</label>
                    <select
                      value={rentDuration}
                      onChange={(e) => setRentDuration(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                    >
                      <option value="monthly">شهري</option>
                      <option value="3_months">كل 3 أشهر</option>
                      <option value="6_months">كل 6 أشهر</option>
                      <option value="yearly">سنوي</option>
                    </select>
                  </div>

                  {/* Room Configuration if rentalMode === 'rooms' */}
                  {rentalMode === 'rooms' && (
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-slate-900">
                          قائمة الغرف المتاحة للتأجير ({detailedRooms.length} غرف)
                        </label>
                        <button
                          type="button"
                          onClick={handleAddRoom}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8D6A28] text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة غرفة</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {detailedRooms.map((room, idx) => (
                          <div key={room.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800">غرفة #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRoom(idx)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={room.name}
                                onChange={(e) => handleUpdateRoom(idx, 'name', e.target.value)}
                                placeholder="اسم الغرفة (مثال: غرفة ماستر)"
                                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                              />
                              <input
                                type="number"
                                value={room.price}
                                onChange={(e) => handleUpdateRoom(idx, 'price', Number(e.target.value))}
                                placeholder="سعر الغرفة شهرياً"
                                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                              />
                              <input
                                type="number"
                                value={room.area || ''}
                                onChange={(e) => handleUpdateRoom(idx, 'area', Number(e.target.value))}
                                placeholder="المساحة م²"
                                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <textarea
                                value={room.description || ''}
                                onChange={(e) => handleUpdateRoom(idx, 'description', e.target.value)}
                                placeholder="وصف ومميزات الغرفة"
                                rows={2}
                                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 resize-none"
                              />
                              <select
                                value={room.status || 'available'}
                                onChange={(e) => handleUpdateRoom(idx, 'status', e.target.value)}
                                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                              >
                                <option value="available">متاحة</option>
                                <option value="reserved">محجوزة</option>
                                <option value="rented">تم التأجير</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-dashed border-[#8D6A28]/50 text-[#8D6A28] text-xs font-black cursor-pointer">
                                {uploadingRoomIndex === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span>{uploadingRoomIndex === idx ? 'جاري الرفع إلى R2...' : 'إضافة صور أو فيديو للغرفة'}</span>
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  multiple
                                  disabled={uploadingRoomIndex !== null}
                                  onChange={(e) => {
                                    void handleRoomMediaUpload(idx, e.target.files);
                                    e.currentTarget.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                              {(room.media || []).length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {(room.media || []).map((item, mediaIdx) => (
                                    <div key={`${item.image_url}-${mediaIdx}`} className="relative shrink-0 w-20 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                                      {item.media_type === 'video' ? (
                                        <video src={item.image_url} controls preload="metadata" className="w-full h-full object-cover" />
                                      ) : (
                                        <img src={resolveImageUrl(item.image_url)} alt="وسائط الغرفة" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }} />
                                      )}
                                      <button type="button" onClick={() => handleRemoveRoomMedia(idx, mediaIdx)} className="absolute top-1 end-1 p-1 rounded-full bg-black/70 text-white" aria-label="حذف الوسائط">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= SPECIAL OFFER & DISCOUNT SECTION ================= */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>تفعيل عرض ترويجي وتخفيض خاص</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black">جديد</span>
                      </h3>
                      <p className="text-xs text-slate-600">حدد سعر مخفض وفترة سريان لعرض العقار في قسم العروض وشارات التخفيض</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOffer}
                      onChange={(e) => {
                        setHasOffer(e.target.checked);
                        if (e.target.checked && !offerStartDate) {
                          setOfferStartDate(getTodayDateString());
                          const d = new Date();
                          d.setDate(d.getDate() + 14);
                          setOfferEndDate(d.toISOString().split('T')[0]);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#8D6A28]"></div>
                  </label>
                </div>

                {hasOffer && (
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-[#8D6A28]" />
                          <span>سعر العرض بعد التخفيض (ج.م) *</span>
                        </label>
                        <input
                          type="number"
                          value={offerPrice}
                          onChange={(e) => {
                            setOfferPrice(e.target.value);
                            const orig = Number(price);
                            const off = Number(e.target.value);
                            if (orig > 0 && off > 0 && off < orig) {
                              const pct = Math.round(((orig - off) / orig) * 100);
                              setOfferDiscountPercentage(String(pct));
                              if (!offerBadge || offerBadge.startsWith('خصم')) {
                                setOfferBadge(`خصم ${pct}%`);
                              }
                            }
                          }}
                          placeholder="مثال: 1350000"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-black text-rose-600 outline-none focus:border-[#8D6A28]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-[#8D6A28]" />
                          <span>نسبة الخصم (%)</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={offerDiscountPercentage}
                          onChange={(e) => {
                            setOfferDiscountPercentage(e.target.value);
                            const orig = Number(price);
                            const pct = Number(e.target.value);
                            if (orig > 0 && pct > 0 && pct < 100) {
                              const calculated = Math.round(orig * (1 - pct / 100));
                              setOfferPrice(String(calculated));
                              if (!offerBadge || offerBadge.startsWith('خصم')) {
                                setOfferBadge(`خصم ${pct}%`);
                              }
                            }
                          }}
                          placeholder="10"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-black text-slate-900 outline-none focus:border-[#8D6A28]"
                        />
                      </div>
                    </div>

                    {/* Date Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8D6A28]" />
                          <span>تاريخ بداية سريان العرض</span>
                        </label>
                        <input
                          type="date"
                          value={offerStartDate}
                          onChange={(e) => setOfferStartDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#8D6A28]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8D6A28]" />
                          <span>تاريخ نهاية العرض (تاريخ الانتهاء)</span>
                        </label>
                        <input
                          type="date"
                          value={offerEndDate}
                          onChange={(e) => setOfferEndDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#8D6A28]"
                        />
                      </div>
                    </div>

                    {/* Badge & Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">نص شارة الخصم المعروضة</label>
                        <input
                          type="text"
                          value={offerBadge}
                          onChange={(e) => setOfferBadge(e.target.value)}
                          placeholder="مثال: خصم 15%"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان / وصف العرض الترويجي</label>
                        <input
                          type="text"
                          value={offerTitle}
                          onChange={(e) => setOfferTitle(e.target.value)}
                          placeholder="مثال: عرض الصيف الحصري لفترة محدودة"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
                        />
                      </div>
                    </div>

                    {/* Quick Badge Selection */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1.5">نماذج سريعة لشارات الخصم:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['خصم 5%', 'خصم 10%', 'خصم 15%', 'خصم 20%', 'خصم 25%', 'عرض الصيف', 'عرض حصري'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setOfferBadge(b);
                              const match = b.match(/(\d+)%/);
                              if (match && match[1]) {
                                const pct = Number(match[1]);
                                setOfferDiscountPercentage(String(pct));
                                const orig = Number(price);
                                if (orig > 0) setOfferPrice(String(Math.round(orig * (1 - pct / 100))));
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                              offerBadge === b ? 'bg-[#8D6A28] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: Amenities & Tags ================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">5. المميزات والوسوم</h2>
              <p className="text-xs text-slate-500 mt-0.5">حدد المميزات والخدمات المتوفرة والكلمات الدلالية</p>
            </div>

            {/* Amenities Grid */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-900">المميزات والمرافق المتوفرة:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {(availableAmenities.length > 0 ? availableAmenities : [
                  'مصعد كهربائي', 'غاز طبيعي', 'تشطيب سوبر لوكس', 'حراسة وأمن 24/7',
                  'موقف سيارات / جراج', 'تكييف ومكيفات', 'حمام سباحة', 'حديقة ومساحات خضراء',
                  'إطلالة بحرية', 'بلكونة وشرفة', 'إنترنت فائق السرعة'
                ]).map((amenity) => {
                  const isSel = selectedAmenities.includes(amenity);
                  const display = getAmenityDisplay(amenity);

                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => {
                        setSelectedAmenities(
                          isSel ? selectedAmenities.filter((a) => a !== amenity) : [...selectedAmenities, amenity]
                        );
                      }}
                      className={`p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition cursor-pointer ${
                        isSel
                          ? 'border-[#8D6A28] bg-amber-50/70 font-bold text-slate-900 ring-1 ring-[#8D6A28]'
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-lg bg-white text-[#8D6A28] flex items-center justify-center shrink-0 shadow-2xs">
                          {display.icon}
                        </div>
                        <span className="text-xs truncate">{amenity}</span>
                      </div>
                      {isSel && <Check className="w-3.5 h-3.5 text-[#8D6A28] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Grid */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-black text-slate-900">الوسوم والكلمات الدلالية:</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(availableTags.length > 0 ? availableTags : [
                  'فرصة استثمارية', 'واجهة بحرية', 'أقل من سعر السوق', 'موقع حيوي',
                  'استلام فوري', 'تشطيب سوبر لوكس', 'قريب من الجامعة', 'حصة في الأرض'
                ]).map((tag) => {
                  const isSel = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTags(
                          isSel ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                        isSel
                          ? 'border-amber-400 bg-amber-100 text-amber-950 font-black'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{tag}</span>
                      {isSel && <Check className="w-3 h-3 text-[#8D6A28]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: Media (Images & Video with Thumbnails) ================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">6. الصور والفيديو وغلاف العقار</h2>
              <p className="text-xs text-slate-500 mt-0.5">ارفع صور العقار، حدد صورة الغلاف الرئيسية، وارفع فيديو المعاينة</p>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-900">
                  صور العقار ({images.length} صور مرفوعة)
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-4 py-2 rounded-xl gold-gradient text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploadingImage ? 'جاري الرفع...' : 'رفع صور جديدة'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Images Grid */}
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((imgUrl, idx) => {
                    const isPrimary = idx === primaryImageIndex;
                    return (
                      <div
                        key={idx}
                        className={`relative rounded-2xl border overflow-hidden group bg-slate-100 aspect-[4/3] ${
                          isPrimary ? 'border-[#8D6A28] ring-2 ring-[#8D6A28]' : 'border-slate-200'
                        }`}
                      >
                        <img 
                          src={resolveImageUrl(imgUrl)} 
                          alt={`صورة ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                        />
                        
                        {/* Primary Badge */}
                        {isPrimary && (
                          <span className="absolute top-2 right-2 bg-[#8D6A28] text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span>الغلاف الرئيسي</span>
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className="px-2 py-1 rounded-lg bg-white text-slate-800 text-[10px] font-black hover:bg-amber-400 cursor-pointer"
                              title="تعيين كصورة غلاف رئيسية"
                            >
                              تعيين كغلاف
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                              title="حذف الصورة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Reorder controls */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-900 disabled:opacity-30 cursor-pointer"
                              title="تحريك للأمام"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'down')}
                              disabled={idx === images.length - 1}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-900 disabled:opacity-30 cursor-pointer"
                              title="تحريك للخلف"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center cursor-pointer hover:border-[#8D6A28] transition bg-slate-50/50"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">اضغط لرفع صور العقار مباشرة إلى السحابة</p>
                  <p className="text-[10px] text-slate-400 mt-1">يدعم JPG و PNG و WebP</p>
                </div>
              )}
            </div>

            {/* Video Upload Area */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#8D6A28]" />
                  <label className="block text-xs font-black text-slate-900">
                    فيديو المعاينة وتوليد الغلاف التلقائي (اختياري)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{uploadingVideo ? 'جاري رفع الفيديو وتوليد الغلاف...' : 'رفع ملف فيديو من الجهاز'}</span>
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Direct Video URL Input Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">أو أدخل رابط الفيديو المباشر (YouTube / Vimeo / MP4 / Cloudflare):</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setVideoUrl(newUrl);
                    setVideoThumbnailUrl('');
                    setIsVideoPreviewOpen(false);
                  }}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#8D6A28]"
                />
              </div>

              {videoUrl ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <PropertyVideoThumbnail
                      videoUrl={videoUrl}
                      thumbnailUrl={videoThumbnailUrl || undefined}
                      fallbackImage={images[primaryImageIndex] || FALLBACK_PROPERTY_IMAGE}
                      className="w-24 h-16 shrink-0 rounded-xl border border-slate-200 bg-slate-900"
                      playBadgeSize="sm"
                      label="تشغيل"
                      onClick={() => setIsVideoPreviewOpen(true)}
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">تم تعيين الفيديو بنجاح</h4>
                      <p className="text-[11px] text-slate-500 font-mono line-clamp-1">{videoUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVideoPreviewOpen((open) => !open)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isVideoPreviewOpen ? 'إخفاء المشغل' : 'تشغيل الفيديو'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl('');
                        setVideoThumbnailUrl('');
                        setIsVideoPreviewOpen(false);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="إزالة الفيديو"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              {videoUrl && isVideoPreviewOpen && (
                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner animate-fade-in">
                  <PropertyMultiVideoPlayer
                    videoUrl={videoUrl}
                    videoThumbnailUrl={videoThumbnailUrl || undefined}
                    fallbackPoster={images[primaryImageIndex] || FALLBACK_PROPERTY_IMAGE}
                    title="معاينة الفيديو قبل حفظ العقار"
                    autoPlay
                    embedded
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 7: Review & Final Submit ================= */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">7. مراجعة وتأكيد بيانات العقار</h2>
              <p className="text-xs text-slate-500 mt-0.5">راجع ملخص العقار قبل الحفظ النهائي والنشر في المنصة</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">البيانات الأساسية</h4>
                <p className="text-sm font-black text-slate-900">{title}</p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-[#8D6A28] text-xs font-bold">
                    {operationType === 'sale' ? 'للبيع' : 'للإيجار'}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold">
                    {PROPERTY_TYPES.find(p => p.type === propertyType)?.label || (typeof propertyType === 'object' ? ((propertyType as any)?.name || (propertyType as any)?.slug) : String(propertyType))}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">
                    {AUDIENCE_OPTIONS.find(a => a.type === audienceType)?.badge || (typeof audienceType === 'object' ? ((audienceType as any)?.badge || (audienceType as any)?.name) : String(audienceType))}
                  </span>
                </div>
              </div>

              {/* Box 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">الموقع والتسعير</h4>
                <p className="text-base font-black text-[#8D6A28]">
                  {Number(price).toLocaleString('ar-EG')} جنيه مصري
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8D6A28]" />
                  <span>{districtsList.find(d => d.id === locationId)?.name || 'دمياط الجديدة'}</span>
                </p>
              </div>
            </div>

            {/* Specifications Recap */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">المساحة:</span>
                <span className="font-black text-slate-900">{area || 0} م²</span>
              </div>
              <div>
                <span className="text-slate-400 block">الغرف:</span>
                <span className="font-black text-slate-900">{rooms || 0} غرف</span>
              </div>
              <div>
                <span className="text-slate-400 block">الحمامات:</span>
                <span className="font-black text-slate-900">{bathrooms || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 block">التشطيب:</span>
                <span className="font-black text-slate-900">{FINISHING_LABELS[finishing] || finishing}</span>
              </div>
            </div>

            {/* Media Recap */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>تم تجهيز {images.length} صور</span>
              {videoUrl && <span>• مرفق فيديو معاينة</span>}
            {detailedRooms.length > 0 && <span>• {detailedRooms.length} غرف مفصلة</span>}
            </div>

            {isAdmin && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-700">بيانات المالك والنشر الإداري</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="اسم مالك العقار"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#8D6A28]"
                  />
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="رقم هاتف المالك"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#8D6A28]"
                  />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Property['status'])}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#8D6A28]"
                  >
                    <option value="available">متاح</option>
                    <option value="reserved">محجوز</option>
                    <option value="sold">تم البيع</option>
                    <option value="rented">تم التأجير</option>
                  </select>
                  <label className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                    <span className="text-xs font-bold text-slate-700">عقار مميز</span>
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[#8D6A28]"
                    />
                  </label>
                </div>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="ملاحظات الإدارة الداخلية"
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#8D6A28] resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>الخطوة السابقة</span>
              </button>
            )}
          </div>

          <div>
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <span>المتابعة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl gold-gradient gold-gradient-hover text-white text-sm font-black flex items-center gap-2 shadow-lg shadow-[#8D6A28]/25 transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري حفظ العقار...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isEditMode ? 'حفظ وتحديث العقار' : 'نشر واعتماد العقار'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
