import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Property, PropertyVideo } from '../types';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { generateAndUploadVideoThumbnail, extractFirstFrameDataUrl, isYouTubeUrl, getYouTubeEmbedUrl, getVideoThumbnailUrl, resolveImageUrl, FALLBACK_PROPERTY_IMAGE } from '../utils/media';
import { PropertyVideoThumbnail } from './PropertyVideoThumbnail';
import { 
  X, 
  Upload, 
  Trash2, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  Video, 
  Image as ImageIcon, 
  Check, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  Link as LinkIcon, 
  ExternalLink,
  Film,
  Tag,
  Eye,
  RefreshCw,
  Layers,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MediaImageItem {
  id?: string | number;
  url: string;
  public_id?: string;
  is_primary: boolean;
  image_type?: string;
  caption?: string;
}

interface AdminMediaManagementModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedProperty: Property) => void;
}

const IMAGE_TYPES = [
  { value: 'property', label: 'عام (الرئيسي)' },
  { value: 'exterior', label: 'واجهة خارجية' },
  { value: 'living_room', label: 'غرفة المعيشة / الصالة' },
  { value: 'bedroom', label: 'غرف النوم' },
  { value: 'kitchen', label: 'المطبخ' },
  { value: 'bathroom', label: 'الحمام' },
  { value: 'balcony', label: 'البلكونة / الإطلالة' },
  { value: 'parking', label: 'موقف السيارات' },
  { value: 'other', label: 'أخرى' },
];

export const AdminMediaManagementModal: React.FC<AdminMediaManagementModalProps> = ({
  property,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'video'>('images');
  const [mediaImages, setMediaImages] = useState<MediaImageItem[]>([]);
  const [mediaVideos, setMediaVideos] = useState<PropertyVideo[]>([]);
  
  // Direct inputs
  const [directImageUrl, setDirectImageUrl] = useState('');
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [selectedPreviewVideoIndex, setSelectedPreviewVideoIndex] = useState<number>(0);

  // Uploading States
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Save State
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from property when opened
  useEffect(() => {
    if (isOpen && property) {
      setErrorMsg(null);
      setSuccessMsg(null);

      // Images
      const rawImgs = property.images && property.images.length > 0 ? property.images : [];
      const formattedImgs: MediaImageItem[] = rawImgs.map((url, idx) => ({
        url,
        public_id: url,
        is_primary: idx === 0,
        image_type: 'property',
      }));
      setMediaImages(formattedImgs);

      // Videos
      const initialVideos: PropertyVideo[] = [];
      if (Array.isArray(property.videos) && property.videos.length > 0) {
        initialVideos.push(...property.videos);
      } else if (property.video_url) {
        initialVideos.push({
          url: property.video_url,
          title: 'فيديو الجولة الرئيسية',
          thumbnail_url: property.video_thumbnail_url,
          is_primary: true,
        });
      }
      setMediaVideos(initialVideos);
      setSelectedPreviewVideoIndex(0);
    }
  }, [isOpen, property]);

  // Lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!isOpen || !property) return null;

  // 1. Batch Image Upload handler
  const handleBatchImageUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    setUploadingImages(true);
    setUploadProgress({ current: 0, total: fileList.length });
    setErrorMsg(null);

    const newUploaded: MediaImageItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const res = await ApiService.uploadMedia(file, 'sakani/properties/images');
        if (res?.url) {
          newUploaded.push({
            url: res.url,
            public_id: res.key || res.public_id || res.url,
            is_primary: mediaImages.length === 0 && newUploaded.length === 0,
            image_type: 'property',
          });
        }
      } catch (err: any) {
        console.error('Image upload failed:', err);
      } finally {
        setUploadProgress({ current: i + 1, total: fileList.length });
      }
    }

    if (newUploaded.length > 0) {
      setMediaImages(prev => [...prev, ...newUploaded]);
      setSuccessMsg(`تم رفع ${newUploaded.length} صور بنجاح!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg('فشل رفع بعض أو كل الصور المحددة. تأكد من حجم الملفات واتصال الإنترنت.');
    }

    setUploadingImages(false);
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
  };

  // 2. Add Direct Image URL
  const handleAddDirectUrl = () => {
    if (!directImageUrl.trim()) return;
    const url = directImageUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorMsg('يرجى إدخال رابط صورة صالح يبدأ بـ http:// أو https://');
      return;
    }

    setMediaImages(prev => [
      ...prev,
      {
        url,
        public_id: url,
        is_primary: prev.length === 0,
        image_type: 'property',
      }
    ]);
    setDirectImageUrl('');
    setShowDirectUrlInput(false);
    setErrorMsg(null);
  };

  // 3. Set Primary Image
  const handleSetPrimaryImage = (index: number) => {
    setMediaImages(prev => {
      const target = prev[index];
      const others = prev.filter((_, i) => i !== index);
      const reordered = [{ ...target, is_primary: true }, ...others.map(img => ({ ...img, is_primary: false }))];
      return reordered;
    });
  };

  // 4. Move Image position
  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= mediaImages.length) return;
    setMediaImages(prev => {
      const updated = [...prev];
      const item = updated.splice(fromIdx, 1)[0];
      updated.splice(toIdx, 0, item);
      return updated.map((img, i) => ({ ...img, is_primary: i === 0 }));
    });
  };

  // 5. Remove Image
  const handleRemoveImage = (index: number) => {
    setMediaImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(img => img.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  };

  // 6. Update Image metadata
  const handleUpdateImageMeta = (index: number, key: 'image_type' | 'caption', val: string) => {
    setMediaImages(prev => prev.map((img, i) => i === index ? { ...img, [key]: val } : img));
  };

  // 7. Video Upload (Direct file)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg('حجم ملف الفيديو كبير جداً (أكثر من 100 ميجابايت). يُرجى وضع رابط الفيديو أو ضغط الملف.');
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      return;
    }

    // ⚡ Instant Client-Side Extraction: Grab first frame immediately
    let initialThumb = '';
    try {
      const extracted = await extractFirstFrameDataUrl(file);
      if (extracted) initialThumb = extracted;
    } catch (extractErr) {
      console.warn('Instant frame extraction warning:', extractErr);
    }

    setUploadingVideo(true);
    setErrorMsg(null);

    try {
      const res = await ApiService.uploadMedia(file, 'sakani/properties/videos');
      if (res?.url) {
        let thumbUrl = initialThumb;
        try {
          const thumbRes = await generateAndUploadVideoThumbnail(file);
          if (thumbRes?.url) {
            thumbUrl = thumbRes.url;
          }
        } catch (thumbErr) {
          console.warn('Auto video thumbnail warning:', thumbErr);
        }

        const newVideo: PropertyVideo = {
          url: res.url,
          title: `فيديو جولة ${mediaVideos.length + 1}`,
          thumbnail_url: thumbUrl || initialThumb,
          is_primary: mediaVideos.length === 0,
          type: 'walkthrough',
        };

        setMediaVideos(prev => [...prev, newVideo]);
        setSelectedPreviewVideoIndex(mediaVideos.length);
        setSuccessMsg('تم رفع الفيديو وتوليد صورة المعاينة بنجاح!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setErrorMsg('فشل رفع الفيديو: ' + (err.message || 'تأكد من الاتصال وسعة السيرفر'));
    } finally {
      setUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // 8. Add Video by Direct / YouTube URL
  const handleAddVideoByUrl = () => {
    if (!newVideoUrl.trim()) return;
    const url = newVideoUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorMsg('يرجى إدخال رابط فيديو صالح يبدأ بـ http:// أو https://');
      return;
    }

    const title = newVideoTitle.trim() || `فيديو ${mediaVideos.length + 1}`;
    const thumbUrl = getVideoThumbnailUrl(url);
    const newVid: PropertyVideo = {
      url,
      title,
      thumbnail_url: thumbUrl || undefined,
      is_primary: mediaVideos.length === 0,
      type: 'walkthrough',
    };

    setMediaVideos(prev => [...prev, newVid]);
    setSelectedPreviewVideoIndex(mediaVideos.length);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setShowAddVideoForm(false);
    setErrorMsg(null);
  };

  // 9. Set Primary Video
  const handleSetPrimaryVideo = (index: number) => {
    setMediaVideos(prev => prev.map((v, i) => ({ ...v, is_primary: i === index })));
  };

  // 10. Remove Video
  const handleRemoveVideo = (index: number) => {
    setMediaVideos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(v => v.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
    if (selectedPreviewVideoIndex >= index && selectedPreviewVideoIndex > 0) {
      setSelectedPreviewVideoIndex(prev => prev - 1);
    }
  };

  // 11. Update Video Title
  const handleUpdateVideoTitle = (index: number, title: string) => {
    setMediaVideos(prev => prev.map((v, i) => i === index ? { ...v, title } : v));
  };

  // 12. Save All Media Changes
  const handleSaveMedia = async () => {
    if (mediaImages.length === 0) {
      setErrorMsg('يجب أن يحتوي العقار على صورة واحدة على الأقل');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const imageUrls = mediaImages.map(img => img.url);
    const uploadedImagesPayload = mediaImages.map((img, idx) => ({
      image_url: img.url,
      image_public_id: img.public_id || img.url,
      media_type: 'image',
      sort_order: idx,
      image_type: img.image_type || 'property',
      caption: img.caption || undefined,
      is_primary: idx === 0,
    }));

    const primaryVideo = mediaVideos.find(v => v.is_primary) || mediaVideos[0];
    const primaryVideoUrl = primaryVideo?.url || '';
    const primaryVideoThumb = primaryVideo?.thumbnail_url || '';

    const payload: any = {
      replace_images: true,
      images: imageUrls,
      uploaded_images: uploadedImagesPayload,
      videos: mediaVideos,
      video_url: primaryVideoUrl || undefined,
      video_public_id: primaryVideoUrl || undefined,
      video_thumbnail_url: primaryVideoThumb || undefined,
    };

    try {
      const isBackendId = !property.id.startsWith('prop-') && (!isNaN(Number(property.id)) ? Number(property.id) < 100000000 : true);
      let updatedProp: Property = {
        ...property,
        images: imageUrls,
        videos: mediaVideos,
        video_url: primaryVideoUrl,
        video_thumbnail_url: primaryVideoThumb,
        is_uploading: false,
      };

      if (isBackendId) {
        const res = await ApiService.updateProperty(property.id, payload);
        if (res?.data) {
          const apiData = res.data;
          updatedProp = {
            ...updatedProp,
            ...apiData,
            images: imageUrls,
            videos: mediaVideos,
            video_url: primaryVideoUrl,
          };
        }
      }

      // Sync to local storage
      StorageService.saveProperty(updatedProp);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      onUpdated(updatedProp);
    } catch (err: any) {
      console.error('Failed to save media changes:', err);
      setErrorMsg('حدث خطأ أثناء حفظ التعديلات: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setSaving(false);
    }
  };

  const previewVideo = mediaVideos[selectedPreviewVideoIndex] || mediaVideos[0];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-[#D4AF37] flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                إدارة وتعديل وسائط العقار
              </h3>
              <p className="text-xs text-slate-300">
                {property.title} <span className="text-amber-400 font-mono">({property.ref_id})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'images'
                ? 'border-[#8D6A28] text-[#8D6A28] bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>معرض الصور ({mediaImages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'video'
                ? 'border-[#8D6A28] text-[#8D6A28] bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>فيديوهات المعاينة ({mediaVideos.length})</span>
            {mediaVideos.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              
              {/* Image Upload Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    صور العقار الحالية ({mediaImages.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    الصورة الأولى ذات الإطار الذهبي هي صورة الغلاف الرئيسية للعقار
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleBatchImageUpload(e.target.files)}
                  />

                  <button
                    type="button"
                    disabled={uploadingImages}
                    onClick={() => imageFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#8D6A28] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {uploadingImages ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري الرفع ({uploadProgress.current}/{uploadProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صور جديدة</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDirectUrlInput(!showDirectUrlInput)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>إضافة برابط</span>
                  </button>
                </div>
              </div>

              {/* Direct Image URL input dropdown */}
              {showDirectUrlInput && (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2 animate-fade-in">
                  <input
                    type="url"
                    placeholder="https://example.com/property-image.jpg"
                    value={directImageUrl}
                    onChange={(e) => setDirectImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#8D6A28]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDirectUrl}
                    className="px-4 py-2 rounded-xl bg-[#8D6A28] text-white text-xs font-bold hover:bg-[#73541D] transition cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              )}

              {/* Images Grid */}
              {mediaImages.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">لا توجد صور مضافة لهذا العقار</p>
                  <p className="text-[11px] text-slate-400 mt-1">اضغط على زر "رفع صور جديدة" لإضافة الصور</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaImages.map((img, idx) => (
                    <div 
                      key={idx}
                      className={`relative bg-white rounded-2xl border-2 transition-all p-2.5 flex flex-col gap-2.5 shadow-2xs ${
                        img.is_primary
                          ? 'border-[#8D6A28] ring-4 ring-[#8D6A28]/10 bg-amber-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Image Preview Container */}
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 group">
                        <img 
                          src={resolveImageUrl(img.url)} 
                          alt={`صورة ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
                        />

                        {/* Primary Badge */}
                        {img.is_primary && (
                          <div className="absolute top-2 right-2 bg-[#8D6A28] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                            <Star className="w-3 h-3 fill-current" />
                            <span>الصورة الرئيسية</span>
                          </div>
                        )}

                        {/* Order Number Badge */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                          #{idx + 1}
                        </div>

                        {/* Zoom Preview Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewZoomImage(img.url)}
                          className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                          title="معاينة وتكبير"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Controls Toolbar */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                        
                        {/* Set Primary Button */}
                        {!img.is_primary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="text-[11px] font-bold text-slate-600 hover:text-[#8D6A28] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 text-[#8D6A28]" />
                            <span>تعيين كرئيسية</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-[#8D6A28] flex items-center gap-1 px-2 py-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>الغلاف الرئيسي</span>
                          </span>
                        )}

                        {/* Move Position Buttons & Delete */}
                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx - 1)}
                              className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition cursor-pointer"
                              title="تحريك للأمام"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          {idx < mediaImages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx + 1)}
                              className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition cursor-pointer"
                              title="تحريك للخلف"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 transition cursor-pointer"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image Type Tag Selection */}
                      <div className="space-y-1">
                        <select
                          value={img.image_type || 'property'}
                          onChange={(e) => handleUpdateImageMeta(idx, 'image_type', e.target.value)}
                          className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#8D6A28]"
                        >
                          {IMAGE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Image Caption */}
                      <input
                        type="text"
                        placeholder="وصف الصورة (اختياري)..."
                        value={img.caption || ''}
                        onChange={(e) => handleUpdateImageMeta(idx, 'caption', e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-[#8D6A28]"
                      />

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: MULTI-VIDEO */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              
              {/* Video Header & Add Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      فيديوهات العقار المسجلة ({mediaVideos.length})
                    </h4>
                    {mediaVideos.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {mediaVideos.length} فيديو متاح
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    يمكنك رفع عدة فيديوهات (جولة عامة، تفاصيل الغرف، فيديو خارجي، روابط يوتيوب أو ملفات MP4)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />

                  <button
                    type="button"
                    disabled={uploadingVideo}
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#8D6A28] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {uploadingVideo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري رفع الفيديو...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع فيديو من الجهاز</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddVideoForm(!showAddVideoForm)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8D6A28] border border-amber-200/80 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة رابط فيديو / يوتيوب</span>
                  </button>
                </div>
              </div>

              {/* Add Video by URL Form */}
              {showAddVideoForm && (
                <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3 animate-fade-in">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#8D6A28]" />
                    <span>إضافة فيديو برابط مباشر أو يوتيوب</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="url"
                        placeholder="https://youtu.be/... أو https://storage.../video.mp4"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-medium text-slate-900 outline-none focus:border-[#8D6A28]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="عنوان الفيديو (مثال: جولة عامة)..."
                        value={newVideoTitle}
                        onChange={(e) => setNewVideoTitle(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#8D6A28]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddVideoForm(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white text-xs font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVideoByUrl}
                      className="px-4 py-1.5 rounded-lg bg-[#8D6A28] text-white text-xs font-bold hover:bg-[#73541D] transition cursor-pointer"
                    >
                      إضافة الفيديو للقائمة
                    </button>
                  </div>
                </div>
              )}

              {/* Videos List */}
              {mediaVideos.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Film className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">لا توجد فيديوهات مسجلة لهذا العقار حالياً</p>
                  <p className="text-[11px] text-slate-400 mt-1">اضغط على "رفع فيديو من الجهاز" أو "إضافة رابط فيديو" لإضافة جولة مرئية</p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Video Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mediaVideos.map((vid, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPreviewVideoIndex(idx)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                          selectedPreviewVideoIndex === idx
                            ? 'border-[#8D6A28] bg-amber-50/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-12 h-9 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                              <PropertyVideoThumbnail
                                videoUrl={vid.url}
                                thumbnailUrl={vid.thumbnail_url}
                                playBadgeSize="sm"
                                className="w-full h-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <input
                                type="text"
                                value={vid.title || ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleUpdateVideoTitle(idx, e.target.value)}
                                className="text-xs font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#8D6A28] outline-none w-full truncate"
                              />
                              <p className="text-[10px] text-slate-400 truncate font-mono">
                                {vid.url}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {vid.is_primary ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#8D6A28] text-[10px] font-bold">
                                الرئيسي ⭐
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryVideo(idx)}
                                className="text-[10px] text-slate-500 hover:text-[#8D6A28] font-bold px-2 py-0.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
                              >
                                تعيين كرئيسي
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="حذف هذا الفيديو"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live Video Preview Box */}
                  {previewVideo && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Film className="w-4 h-4 text-[#8D6A28]" />
                          <span>معاينة مشغل الفيديو المحدد: {previewVideo.title}</span>
                        </h4>
                        <a
                          href={previewVideo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#8D6A28] hover:underline flex items-center gap-1"
                        >
                          <span>فتح الرابط</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
                        {isYouTubeUrl(previewVideo.url) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(previewVideo.url) || previewVideo.url}
                            title="Property Video Preview"
                            className="w-full h-full border-0"
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        ) : (
                          <video 
                            key={previewVideo.url}
                            src={previewVideo.url} 
                            poster={previewVideo.thumbnail_url || mediaImages[0]?.url}
                            controls 
                            playsInline
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-500 font-bold">
            الإجمالي: <span className="text-[#8D6A28]">{mediaImages.length}</span> صور • 
            الفيديوهات: <span className={mediaVideos.length > 0 ? 'text-emerald-600' : 'text-slate-400'}>{mediaVideos.length} فيديو</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              disabled={saving || uploadingImages || uploadingVideo}
              onClick={handleSaveMedia}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#8D6A28] hover:opacity-95 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>جاري الحفظ والاعتماد...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>حفظ واعتماد الوسائط الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Fullscreen Zoom Image Modal */}
      {previewZoomImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewZoomImage(null)}
        >
          <button
            onClick={() => setPreviewZoomImage(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={resolveImageUrl(previewZoomImage)} 
            alt="تكبير الصورة" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.currentTarget.src = FALLBACK_PROPERTY_IMAGE; }}
          />
        </div>
      )}
    </div>,
    document.body
  );
};
