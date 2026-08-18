import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Property, DetailedRoom } from '../types';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { 
  X, 
  DoorOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Check, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon,
  Building2,
  DollarSign,
  Maximize2,
  Lock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface AdminRoomManagementModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const AdminRoomManagementModal: React.FC<AdminRoomManagementModalProps> = ({
  property,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [rooms, setRooms] = useState<DetailedRoom[]>([]);
  const [hasDetailedRooms, setHasDetailedRooms] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<string | null>(null); // roomId or null for create mode
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMsg, setSavingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'available' | 'reserved' | 'rented'>('available');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && property) {
      loadPropertyRooms();
    }
  }, [isOpen, property]);

  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!isOpen || !property) return null;

  const loadPropertyRooms = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Get from storage
      const currentProp = StorageService.getPropertyById(property.id) || property;
      const rawStoredRooms = currentProp.detailed_rooms || [];
      const storedSeen = new Set<string>();
      const initialRooms = rawStoredRooms.filter((r: any) => {
        const key = String(r.id || r.name);
        if (storedSeen.has(key)) return false;
        storedSeen.add(key);
        return true;
      });
      setRooms(initialRooms);
      setHasDetailedRooms(Boolean(currentProp.has_detailed_rooms));

      // 2. Fetch fresh from backend if numeric ID
      const numId = parseInt(property.id.replace(/\D/g, ''), 10);
      if (numId) {
        const fresh = await ApiService.getProperty(numId);
        if (fresh && fresh.detailed_rooms) {
          const freshSeen = new Set<string>();
          const mappedRooms: DetailedRoom[] = fresh.detailed_rooms
            .filter((r: any) => {
              const key = String(r.id || r.name);
              if (freshSeen.has(key)) return false;
              freshSeen.add(key);
              return true;
            })
            .map((r: any) => ({
              id: String(r.id),
              name: r.name,
              price: Number(r.price),
              area: r.area ? Number(r.area) : undefined,
              description: r.description || '',
              status: r.status || 'available',
              imageUrl: r.room_images?.[0]?.image_url || r.imageUrl,
              images: r.room_images?.map((img: any) => img.image_url) || [],
            }));
          setRooms(mappedRooms);
          setHasDetailedRooms(Boolean(fresh.has_detailed_rooms));
          // sync back to storage
          StorageService.saveProperty({
            ...currentProp,
            has_detailed_rooms: Boolean(fresh.has_detailed_rooms),
            detailed_rooms: mappedRooms,
          });
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const resetForm = () => {
    setIsEditing(null);
    setName('');
    setPrice('');
    setArea('');
    setDescription('');
    setStatus('available');
    setSelectedImages([]);
    setExistingImageUrl(undefined);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartEdit = (room: DetailedRoom) => {
    setIsEditing(room.id);
    setName(room.name);
    setPrice(String(room.price));
    setArea(room.area ? String(room.area) : '');
    setDescription(room.description || '');
    setStatus(room.status);
    setExistingImageUrl(room.imageUrl);
    setSelectedImages([]);
    setErrorMsg(null);
  };

  const handleToggleHasDetailedRooms = async (newVal: boolean) => {
    setHasDetailedRooms(newVal);
    const updated = { ...property, has_detailed_rooms: newVal };
    StorageService.saveProperty(updated);

    const numId = parseInt(property.id.replace(/\D/g, ''), 10);
    if (numId) {
      try {
        await ApiService.updateProperty(numId, { has_detailed_rooms: newVal });
      } catch {}
    }
    onUpdated();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم الغرفة');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg('يرجى إدخال سعر إيجار صحيح للغرفة');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSavingMsg(isEditing ? 'جاري تحديث بيانات الغرفة...' : 'جاري إنشاء الغرفة...');

    try {
      const propIdNumber = parseInt(property.id.replace(/\D/g, ''), 10) || 1;
      let finalImageUrl = existingImageUrl;
      let targetRoomId = isEditing;

      if (isEditing) {
        // Update existing room in backend
        const numRoomId = parseInt(isEditing.replace(/\D/g, ''), 10);
        if (numRoomId) {
          await ApiService.updateRoom(numRoomId, {
            name: name.trim(),
            price: Number(price),
            area: area ? Number(area) : null,
            description: description.trim(),
            status: status,
          });
        }
      } else {
        // Create new room in backend
        if (propIdNumber) {
          const createRes = await ApiService.createRoom(propIdNumber, {
            name: name.trim(),
            price: Number(price),
            area: area ? Number(area) : null,
            description: description.trim(),
          });
          if (createRes && createRes.id) {
            targetRoomId = String(createRes.id);
          }
        }
      }

      // Upload Images if any selected
      if (selectedImages.length > 0 && targetRoomId) {
        const numRoomId = parseInt(targetRoomId.replace(/\D/g, ''), 10);
        for (let i = 0; i < selectedImages.length; i++) {
          setSavingMsg(`جاري رفع الصور (${i + 1}/${selectedImages.length})...`);
          const uploaded = await uploadToCloudinary(selectedImages[i], 'sakani/rooms/images');
          finalImageUrl = uploaded.secure_url;

          if (numRoomId) {
            try {
              await ApiService.uploadRoomImage(numRoomId, {
                image_url: uploaded.secure_url,
                image_public_id: uploaded.public_id,
                media_type: 'image',
                is_primary: i === 0,
              });
            } catch {}
          }
        }

        if (numRoomId) {
          try {
            await ApiService.markRoomUploadComplete(numRoomId);
          } catch {}
        }
      }

      // Sync Local Storage
      const currentProp = StorageService.getPropertyById(property.id) || property;
      const currentRooms = currentProp.detailed_rooms || [];
      let updatedRoomsList: DetailedRoom[];

      if (isEditing) {
        updatedRoomsList = currentRooms.map(r => 
          r.id === isEditing ? {
            ...r,
            name: name.trim(),
            price: Number(price),
            area: area ? Number(area) : undefined,
            description: description.trim(),
            status: status,
            imageUrl: finalImageUrl || r.imageUrl,
          } : r
        );
      } else {
        const newRoomObj: DetailedRoom = {
          id: targetRoomId || `room-${Date.now()}`,
          name: name.trim(),
          price: Number(price),
          area: area ? Number(area) : undefined,
          description: description.trim(),
          status: status,
          imageUrl: finalImageUrl,
        };
        updatedRoomsList = [...currentRooms, newRoomObj];
      }

      // Auto-enable has_detailed_rooms = true on first room
      const willHaveDetailedRooms = updatedRoomsList.length > 0;
      StorageService.saveProperty({
        ...currentProp,
        has_detailed_rooms: willHaveDetailedRooms,
        detailed_rooms: updatedRoomsList,
      });

      setRooms(updatedRoomsList);
      setHasDetailedRooms(willHaveDetailedRooms);
      resetForm();
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err.message || 'حدث خطأ أثناء حفظ بيانات الغرفة');
    }

    setSaving(false);
  };

  const handleUpdateRoomStatus = async (roomId: string, newStatus: DetailedRoom['status']) => {
    // 1. Storage update
    const currentProp = StorageService.getPropertyById(property.id) || property;
    const updated = (currentProp.detailed_rooms || []).map(r => 
      r.id === roomId ? { ...r, status: newStatus } : r
    );
    StorageService.saveProperty({
      ...currentProp,
      detailed_rooms: updated,
    });
    setRooms(updated);

    // 2. API update
    const numRoomId = parseInt(roomId.replace(/\D/g, ''), 10);
    if (numRoomId) {
      try {
        await ApiService.updateRoom(numRoomId, { status: newStatus });
      } catch {}
    }
    onUpdated();
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الغرفة "${roomName}" نهائياً؟`)) return;

    // 1. API delete
    const numRoomId = parseInt(roomId.replace(/\D/g, ''), 10);
    if (numRoomId) {
      try {
        await ApiService.deleteRoom(numRoomId);
      } catch {}
    }

    // 2. Storage update
    const currentProp = StorageService.getPropertyById(property.id) || property;
    const updated = (currentProp.detailed_rooms || []).filter(r => r.id !== roomId);
    // Auto-disable has_detailed_rooms if no rooms left
    const willHaveRooms = updated.length > 0;

    StorageService.saveProperty({
      ...currentProp,
      has_detailed_rooms: willHaveRooms,
      detailed_rooms: updated,
    });

    setRooms(updated);
    setHasDetailedRooms(willHaveRooms);
    if (isEditing === roomId) resetForm();
    onUpdated();
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('ar-EG').format(p);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-4" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#8D6A28]/20 flex items-center justify-center text-[#8D6A28] shrink-0">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  إدارة غرف العقار: {property.title}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-amber-400">
                  {property.ref_id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                إضافة الغرف المنفصلة، تحديد الأسعار والمساحات، ورفع الصور لإتاحة الحجز المستقل ({rooms.length} غرف مسجلة)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content: 2-Column Split View */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                {isEditing ? <Edit3 className="w-4 h-4 text-[#8D6A28]" /> : <Plus className="w-4 h-4 text-[#8D6A28]" />}
                <span>{isEditing ? 'تعديل بيانات الغرفة' : 'إضافة غرفة جديدة للعقار'}</span>
              </h4>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoom} className="space-y-3.5 text-xs">
              
              {/* Room Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم الغرفة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: غرفة ماستر بحمام خاص"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#8D6A28] outline-none transition"
                />
              </div>

              {/* Price & Area in Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    سعر الإيجار (ج.م/شهر) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="مثال: 3500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#8D6A28] outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    المساحة (م²)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 20"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#8D6A28] outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Room Status Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  حالة الغرفة
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:border-[#8D6A28] outline-none transition"
                >
                  <option value="available">متاحة للحجز</option>
                  <option value="reserved">محجوزة حالياً</option>
                  <option value="rented">تم التأجير</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  وصف ومميزات الغرفة
                </label>
                <textarea
                  rows={2}
                  placeholder="مفروشة، مكيفة، تطل على الشارع الرئيسي، حمام مستقل..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#8D6A28] outline-none transition text-xs font-medium"
                ></textarea>
              </div>

              {/* Room Image Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  صورة الغرفة (Cloudinary)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-[#8D6A28] rounded-2xl p-4 text-center bg-white transition cursor-pointer">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="room-img-upload"
                  />
                  <label htmlFor="room-img-upload" className="cursor-pointer block space-y-1">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <span className="text-slate-600 font-bold block text-[11px]">
                      {selectedImages.length > 0 
                        ? `تم اختيار ${selectedImages.length} صور جديدة` 
                        : existingImageUrl 
                        ? 'انقر لتغيير الصورة الحالية' 
                        : 'انقر لرفع صورة الغرفة'}
                    </span>
                  </label>
                </div>

                {/* Existing / Selected Image Preview */}
                {(existingImageUrl || selectedImages.length > 0) && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={selectedImages.length > 0 ? URL.createObjectURL(selectedImages[0]) : existingImageUrl}
                      alt="معاينة"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                      {selectedImages.length > 0 ? selectedImages[0].name : 'الصورة الأساسية للغرفة'}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl gold-gradient gold-gradient-hover text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{savingMsg || 'جاري الحفظ...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? 'حفظ التعديلات' : 'إضافة الغرفة للعقار'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Rooms List (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Detailed Rooms Toggle Bar */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8D6A28]" />
                  <span>تفعيل وضع التأجير بالغرف المنفصلة</span>
                </h5>
                <p className="text-[11px] text-slate-600">
                  عند تفعيل هذا الخيار، سيتم عرض الغرف كخيارات حجز مستقلة للعملاء على صفحة العقار.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hasDetailedRooms}
                  onChange={(e) => handleToggleHasDetailedRooms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8D6A28]"></div>
              </label>
            </div>

            {/* Existing Rooms List */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                <span>قائمة الغرف الحالية ({rooms.length})</span>
                {rooms.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    {rooms.filter(r => r.status === 'available').length} متاحة للحجز
                  </span>
                )}
              </h4>

              {loading ? (
                <div className="p-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin text-[#8D6A28] mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">جاري تحميل الغرف...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="p-10 text-center space-y-2.5 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                  <DoorOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h5 className="font-extrabold text-xs text-slate-700">لم يتم إضافة أية غرف بعد</h5>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    استخدم النموذج على اليمين لإضافة الغرفة الأولى وسيبدأ نظام الغرف بالعمل تلقائياً.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isEditing === room.id 
                          ? 'border-[#8D6A28] bg-amber-50/40 shadow-xs' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={room.imageUrl || property.images[0]}
                          alt={room.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{room.name}</h5>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              room.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : room.status === 'reserved'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {room.status === 'available' ? 'متاحة' : room.status === 'reserved' ? 'محجوزة' : 'تم التأجير'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 font-mono">
                            <span className="text-[#8D6A28]">{formatPrice(room.price)} ج.م/شهر</span>
                            {room.area && <span>• {room.area} م²</span>}
                          </div>

                          {room.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {room.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Room Actions */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <select
                          value={room.status}
                          onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value as any)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 outline-none"
                        >
                          <option value="available">متاح</option>
                          <option value="reserved">محجوز</option>
                          <option value="rented">مؤجر</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(room)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="تعديل الغرفة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="حذف الغرفة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
