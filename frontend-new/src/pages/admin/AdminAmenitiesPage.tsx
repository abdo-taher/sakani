import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, CheckCircle2, Trash2, Pencil, Search } from 'lucide-react';
import { getAmenityDisplay } from '../../utils/amenities';
import { AdminModal } from '../../components/AdminModal';

const DEFAULT_AMENITIES = [
  'مصعد كهربائي',
  'غاز طبيعي',
  'تشطيب سوبر لوكس',
  'حراسة وأمن 24/7',
  'موقف سيارات / جراج',
  'تكييف ومكيفات',
  'حمام سباحة',
  'حديقة ومساحات خضراء',
  'إطلالة بحرية',
  'مطبخ مجهز بالكامل',
  'بلكونة وشرفة',
  'إنترنت فائق السرعة',
  'كهرباء مستقرة',
  'خزان وعداد مياه',
  'نادي صحي وجيم',
  'محلات تجارية قريبة',
  'مسجد قريب',
  'مدارس وجامعات قريبة',
  'غسالة أوتوماتيك',
  'شاشة وتلفزيون',
  'كاميرات مراقبة'
];

export const AdminAmenitiesPage: React.FC = () => {
  const [amenities, setAmenities] = useState<string[]>(() => {
    const saved = localStorage.getItem('sakani_admin_amenities');
    return saved ? JSON.parse(saved) : DEFAULT_AMENITIES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    localStorage.setItem('sakani_admin_amenities', JSON.stringify(amenities));
  }, [amenities]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedAmenity(null);
    setAmenityInput('');
  };

  const handleOpenEdit = (a: string) => {
    setModalMode('edit');
    setSelectedAmenity(a);
    setAmenityInput(a);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = amenityInput.trim();
    if (!clean) return;

    if (modalMode === 'create') {
      if (!amenities.includes(clean)) {
        setAmenities([...amenities, clean]);
      }
    } else if (modalMode === 'edit' && selectedAmenity) {
      setAmenities(amenities.map(a => a === selectedAmenity ? clean : a));
    }

    setModalMode(null);
    setAmenityInput('');
    setSelectedAmenity(null);
  };

  const handleDelete = (item: string) => {
    if (window.confirm(`هل أنت متأكد من حذف ميزة: "${item}"؟`)) {
      setAmenities(amenities.filter((a) => a !== item));
    }
  };

  const filteredAmenities = amenities.filter(a =>
    !searchTerm.trim() || a.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              إدارة المميزات والمرافق
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            إضافة وتعديل وحذف المميزات والخدمات المتاحة لاختيارها في نماذج العقارات ({amenities.length} ميزة مسجلة)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ميزة جديدة</span>
        </button>
      </div>

      {/* Quick Add & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في المميزات..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-[#8D6A28]"
          />
        </div>

        <form onSubmit={handleSave} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => {
              setAmenityInput(e.target.value);
              setModalMode('create');
            }}
            placeholder="أدخل ميزة جديدة واضغط إضافة..."
            className="flex-1 md:w-64 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-[#8D6A28]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة</span>
          </button>
        </form>
      </div>

      {/* Amenities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAmenities.map((item) => {
          const display = getAmenityDisplay(item);

          return (
            <div
              key={item}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 hover:border-[#8D6A28] transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#8D6A28] flex items-center justify-center shrink-0 shadow-2xs">
                  {display.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {display.name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    أيقونة ذكية مفعلة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#8D6A28] hover:bg-amber-50 transition cursor-pointer"
                  title="تعديل الميزة"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="حذف الميزة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredAmenities.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            لا توجد مميزات مطابقة للبحث.
          </div>
        )}
      </div>

      {/* Viewport-Centered Add / Edit Modal */}
      <AdminModal
        isOpen={modalMode !== null && Boolean(selectedAmenity || modalMode === 'create')}
        onClose={() => {
          setModalMode(null);
          setSelectedAmenity(null);
          setAmenityInput('');
        }}
        title={modalMode === 'create' ? 'إضافة ميزة أو مرفق جديد' : 'تعديل الميزة'}
        subtitle="أدخل مسمى الميزة ليتم التعرف على الأيقونة تلقائياً وإضافتها لخيارات العقارات"
        icon={<Sparkles className="w-5 h-5 text-[#8D6A28]" />}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم الميزة أو المرفق *</label>
            <input
              type="text"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              placeholder="مثال: طاقة شمسية، إنتركم مرئي، دش مركزي..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
              required
              autoFocus
            />
          </div>

          {amenityInput.trim() && (
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#8D6A28] flex items-center justify-center shadow-xs shrink-0">
                {getAmenityDisplay(amenityInput).icon}
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">معاينة الأيقونة التلقائية:</span>
                <span className="text-[11px] text-slate-600">{getAmenityDisplay(amenityInput).name}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setModalMode(null);
                setSelectedAmenity(null);
                setAmenityInput('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {modalMode === 'create' ? 'إضافة الميزة' : 'حفظ التعديل'}
            </button>
          </div>
        </form>
      </AdminModal>

    </div>
  );
};
