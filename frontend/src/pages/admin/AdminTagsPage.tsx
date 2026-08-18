import React, { useState, useEffect } from 'react';
import { Tag, Plus, Search, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { AdminModal } from '../../components/AdminModal';

const DEFAULT_TAGS = [
  'فرصة استثمارية',
  'واجهة بحرية',
  'أقل من سعر السوق',
  'موقع حيوي',
  'استلام فوري',
  'تشطيب سوبر لوكس',
  'قريب من الجامعة',
  'حصة في الأرض',
  'عداد كهرباء قديم',
  'شارع رئيسي',
  'فيو حديقة',
  'مرخصة رسمياً',
  'تسهيلات في السداد',
  'قريب من البحر'
];

export const AdminTagsPage: React.FC = () => {
  const [tags, setTags] = useState<string[]>(() => {
    const saved = localStorage.getItem('sakani_admin_tags');
    return saved ? JSON.parse(saved) : DEFAULT_TAGS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    localStorage.setItem('sakani_admin_tags', JSON.stringify(tags));
  }, [tags]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedTag(null);
    setTagInput('');
  };

  const handleOpenEdit = (t: string) => {
    setModalMode('edit');
    setSelectedTag(t);
    setTagInput(t);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tagInput.trim();
    if (!clean) return;

    if (modalMode === 'create') {
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
    } else if (modalMode === 'edit' && selectedTag) {
      setTags(tags.map(t => t === selectedTag ? clean : t));
    }

    setModalMode(null);
    setTagInput('');
    setSelectedTag(null);
  };

  const handleDeleteTag = (t: string) => {
    if (window.confirm(`هل أنت متأكد من حذف وسم: "${t}"؟`)) {
      setTags(tags.filter((item) => item !== t));
    }
  };

  const filteredTags = tags.filter(t => 
    !searchTerm.trim() || t.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              إدارة التاجات والوسوم
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            إضافة وتعديل وحذف الوسوم المستخدمة لتمييز العقارات وتسهيل البحث ({tags.length} وسم مسجل)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة وسم جديد</span>
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
            placeholder="بحث في الوسوم..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-[#8D6A28]"
          />
        </div>

        <form onSubmit={handleSave} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setModalMode('create');
            }}
            placeholder="أدخل وسم سريع واضغط إضافة..."
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

      {/* Tags List Container */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            الوسوم المتاحة للاستخدام ({filteredTags.length}):
          </h3>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {filteredTags.map((t) => (
            <div
              key={t}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 text-xs font-bold shadow-2xs group hover:bg-amber-100/70 transition"
            >
              <span>{t}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-1 rounded-md text-slate-400 hover:text-[#8D6A28] hover:bg-amber-200 transition cursor-pointer"
                  title="تعديل الوسم"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTag(t)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  title="حذف الوسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredTags.length === 0 && (
            <p className="text-xs text-slate-400 py-4">لا توجد وسوم مطابقة لبحثك.</p>
          )}
        </div>
      </div>

      {/* Viewport-Centered Add / Edit Modal */}
      <AdminModal
        isOpen={modalMode !== null && Boolean(selectedTag || modalMode === 'create')}
        onClose={() => {
          setModalMode(null);
          setSelectedTag(null);
          setTagInput('');
        }}
        title={modalMode === 'create' ? 'إضافة وسم جديد' : 'تعديل الوسم'}
        subtitle="أدخل نص الوسم ليظهر في خيارات وفلاتر العقارات"
        icon={<Tag className="w-5 h-5 text-[#8D6A28]" />}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم الوسم / التاج *</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="مثال: بحري صريح، بالقرب من الخدمات..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setModalMode(null);
                setSelectedTag(null);
                setTagInput('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {modalMode === 'create' ? 'إضافة الوسم' : 'حفظ التعديل'}
            </button>
          </div>
        </form>
      </AdminModal>

    </div>
  );
};
