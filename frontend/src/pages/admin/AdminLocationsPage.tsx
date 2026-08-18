import React, { useState, useEffect, useRef } from 'react';
import { LocationDistrict } from '../../types';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { AdminModal } from '../../components/AdminModal';
import { FALLBACK_PROPERTY_IMAGE } from '../../utils/media';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Pencil, 
  Upload,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { DashboardTableSkeleton, ModernStateFeedback } from '../../components/Skeletons';

export const AdminLocationsPage: React.FC = () => {
  const [districts, setDistricts] = useState<LocationDistrict[]>([]);
  const [properties, setProperties] = useState(StorageService.getProperties());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<LocationDistrict | null>(null);

  // Form states
  const [districtName, setDistrictName] = useState('');
  const [districtDesc, setDistrictDesc] = useState('');
  const [districtImage, setDistrictImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setDistricts(StorageService.getDistricts());
    setProperties(StorageService.getProperties());

    try {
      const res = await ApiService.getLocations();
      if (Array.isArray(res) && res.length > 0) {
        const mapped: LocationDistrict[] = res.map((loc: any) => ({
          id: String(loc.id),
          name: loc.name,
          description: loc.description || 'أحد أحياء ومناطق دمياط الجديدة',
          image_url: loc.image_url || loc.image || FALLBACK_PROPERTY_IMAGE,
          available_count: Number(loc.available_count || loc.properties_count) || 0,
        }));
        setDistricts(mapped);
      }
    } catch (e) {
      console.warn('Failed to load locations from API, using storage:', e);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingDistrict(null);
    setDistrictName('');
    setDistrictDesc('');
    setDistrictImage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (dist: LocationDistrict) => {
    setEditingDistrict(dist);
    setDistrictName(dist.name);
    setDistrictDesc(dist.description || '');
    setDistrictImage(dist.image_url || '');
    setModalOpen(true);
  };

  // Image Upload via Media Service
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingImage(true);

    try {
      const res = await ApiService.uploadMedia(file, 'sakani/locations');
      if (res?.url) {
        setDistrictImage(res.url);
      }
    } catch (err: any) {
      alert('فشل رفع الصورة: ' + (err.message || 'يرجى المحاولة مرة أخرى'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtName.trim()) return;

    setIsSaving(true);
    const finalImage = districtImage.trim() || FALLBACK_PROPERTY_IMAGE;

    if (editingDistrict) {
      // Edit existing
      const updated: LocationDistrict = {
        ...editingDistrict,
        name: districtName.trim(),
        description: districtDesc.trim() || 'أحد أحياء ومناطق دمياط الجديدة',
        image_url: finalImage,
      };

      StorageService.saveDistrict(updated);

      const numId = parseInt(editingDistrict.id.replace(/\D/g, ''), 10);
      if (numId) {
        try {
          await ApiService.updateLocation(numId, {
            name: updated.name,
            description: updated.description,
            image_url: updated.image_url,
          });
        } catch (e) {
          console.warn('API update failed, local storage saved:', e);
        }
      }
    } else {
      // Create new
      const newDist: LocationDistrict = {
        id: `dist-${Date.now()}`,
        name: districtName.trim(),
        description: districtDesc.trim() || 'أحد أحياء ومناطق دمياط الجديدة',
        image_url: finalImage,
        available_count: 0,
      };

      StorageService.saveDistrict(newDist);

      try {
        await ApiService.createLocation({
          name: newDist.name,
          description: newDist.description,
          image_url: newDist.image_url,
        });
      } catch (e) {
        console.warn('API create failed, local storage saved:', e);
      }
    }

    setIsSaving(false);
    setModalOpen(false);
    setEditingDistrict(null);
    loadData();
  };

  const handleDeleteDistrict = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف منطقة: "${name}"؟`)) {
      StorageService.deleteDistrict(id);
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (numId) {
        try {
          await ApiService.deleteLocation(numId);
        } catch (e) {}
      }
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              إدارة الأماكن والمناطق
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            إضافة وتعديل وحذف أحياء ومناطق دمياط الجديدة ورفع صور الواجهات ({districts.length} منطقة)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منطقة جديدة</span>
        </button>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <DashboardTableSkeleton rows={6} />
      ) : districts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs">
          <ModernStateFeedback
            type="empty"
            title="لا توجد مناطق أو أحياء مضافة"
            description="يمكنك البدء بإضافة أول حي أو منطقة بدمياط الجديدة ورفع صورة واجهته."
            actionText="إضافة منطقة جديدة"
            onAction={handleOpenAdd}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {districts.map((dist) => {
          const count = properties.filter(p => p.district_id === dist.id || p.location_id === dist.id).length;

          return (
            <div 
              key={dist.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
            >
              {/* Image Preview Banner */}
              <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                <img 
                  src={dist.image_url} 
                  alt={dist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', FALLBACK_PROPERTY_IMAGE);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-xs font-black shadow">
                    {dist.name}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                  <span className="font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#8D6A28]" />
                    {count} عقارات مسجلة
                  </span>
                </div>
              </div>

              {/* District Content */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base mb-1">
                    {dist.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {dist.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    ID: {dist.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(dist)}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8D6A28] transition cursor-pointer"
                      title="تعديل المنطقة والصورة"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDistrict(dist.id, dist.name)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="حذف المنطقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Viewport-Centered Add / Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDistrict ? 'تعديل بيانات وصورة المنطقة' : 'إضافة حي أو منطقة جديدة'}
        subtitle="حدد اسم الحي والوصف التعريفي وارفع صورة الواجهة"
        icon={<MapPin className="w-5 h-5 text-[#8D6A28]" />}
      >
        <form onSubmit={handleSaveDistrict} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحي / المنطقة *</label>
            <input
              type="text"
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              placeholder="مثال: الحي المتميز، الكورنيش، الحي الثاني..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوصف التعريفي والموقع</label>
            <textarea
              value={districtDesc}
              onChange={(e) => setDistrictDesc(e.target.value)}
              placeholder="اكتب نبذة عن موقع المنطقة والخدمات المحيطة..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#8D6A28] resize-none h-20"
            />
          </div>

          {/* Interactive Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">صورة واجهة المنطقة (رفع سحابي مباشر)</label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {districtImage ? (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                <img 
                  src={districtImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-amber-50 cursor-pointer shadow flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#8D6A28]" />
                    <span>استبدال الصورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistrictImage('')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#8D6A28] bg-slate-50/50 hover:bg-amber-50/20 rounded-2xl p-6 text-center cursor-pointer transition space-y-2"
              >
                {uploadingImage ? (
                  <div className="space-y-2">
                    <Loader2 className="w-8 h-8 text-[#8D6A28] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-700">جاري رفع الصورة إلى السحابة...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">اضغط لرفع صورة المنطقة من جهازك</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">يدعم JPG و PNG و WebP</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Direct URL input fallback */}
            <div className="pt-1">
              <input
                type="url"
                value={districtImage}
                onChange={(e) => setDistrictImage(e.target.value)}
                placeholder="أو أدخل رابط صورة مباشر https://..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700 outline-none focus:border-[#8D6A28]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving || uploadingImage}
              className="px-5 py-2 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{editingDistrict ? 'حفظ التعديلات' : 'إضافة المنطقة'}</span>
            </button>
          </div>
        </form>
      </AdminModal>

    </div>
  );
};
