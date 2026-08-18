import React, { useState, useEffect } from 'react';
import { PropertyType } from '../../types';
import { StorageService } from '../../services/storageService';
import { AdminModal } from '../../components/AdminModal';
import { 
  Layers, 
  Building2, 
  Home as HomeIcon, 
  Store, 
  LandPlot, 
  Briefcase, 
  Building,
  Sparkles,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2
} from 'lucide-react';

interface CategoryItem {
  type: string;
  label: string;
  desc: string;
  iconName: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { type: 'apartment', label: 'شقق سكنية', desc: 'شقق استلام فوري ونصف تشطيب وتشطيب كامل', iconName: 'Building2' },
  { type: 'villa', label: 'فيلات مستقلة', desc: 'فيلات فاخرة، تاون هاوس، وتوين هاوس', iconName: 'HomeIcon' },
  { type: 'duplex', label: 'دوبلكس وبنتهاوس', desc: 'وحدات دوبلكس وبنتهاوس بأسطح وحدائق خاصة', iconName: 'Building' },
  { type: 'chalet', label: 'شاليهات', desc: 'شاليهات مصيفية قريبة من البحر', iconName: 'Sparkles' },
  { type: 'studio', label: 'استوديو', desc: 'استوديوهات سكنية للطلاب والمهندسين', iconName: 'HomeIcon' },
  { type: 'shop', label: 'محلات تجارية', desc: 'محلات ومساحات تجارية في المولات والأسواق', iconName: 'Store' },
  { type: 'office', label: 'مكاتب ومقرات إدارية', desc: 'مكاتب وعيادات ومقرات شركات جاهزة للعمل', iconName: 'Briefcase' },
  { type: 'land', label: 'أراضي ومواقع بناء', desc: 'أراضي مميزة بالحي المتميز وبيت الوطن والمنطقة الصناعية', iconName: 'LandPlot' },
  { type: 'building', label: 'عمارات ومباني كاملة', desc: 'عمارات استثمارية قائمة ومباني تجارية وإدارية', iconName: 'Building2' },
];

export const AdminCategoriesPage: React.FC = () => {
  const [properties, setProperties] = useState(StorageService.getProperties());
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('sakani_admin_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    localStorage.setItem('sakani_admin_categories', JSON.stringify(categories));
  }, [categories]);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Building2': return Building2;
      case 'HomeIcon': return HomeIcon;
      case 'Building': return Building;
      case 'Sparkles': return Sparkles;
      case 'Store': return Store;
      case 'Briefcase': return Briefcase;
      case 'LandPlot': return LandPlot;
      default: return Layers;
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCat(null);
    setFormKey(`cat_${Date.now()}`);
    setFormLabel('');
    setFormDesc('');
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setModalMode('edit');
    setEditingCat(cat);
    setFormKey(cat.type);
    setFormLabel(cat.label);
    setFormDesc(cat.desc);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    if (modalMode === 'create') {
      const newCat: CategoryItem = {
        type: formKey.trim() || `custom_${Date.now()}`,
        label: formLabel.trim(),
        desc: formDesc.trim(),
        iconName: 'Building2',
      };
      setCategories([...categories, newCat]);
    } else if (modalMode === 'edit' && editingCat) {
      setCategories(categories.map(c => 
        c.type === editingCat.type 
          ? { ...c, label: formLabel.trim(), desc: formDesc.trim() } 
          : c
      ));
    }

    setModalMode(null);
  };

  const handleDelete = (cat: CategoryItem) => {
    if (window.confirm(`هل أنت متأكد من حذف قسم "${cat.label}"؟`)) {
      setCategories(categories.filter(c => c.type !== cat.type));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#8D6A28]" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">
              إدارة الأقسام وأنواع العقارات
            </h1>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            تخصيص وتعديل فئات وأنواع العقارات في النظام ({categories.length} أقسام رئيسية)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl gold-gradient gold-gradient-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const Icon = getIcon(cat.iconName);
          const count = properties.filter(p => p.property_type === cat.type).length;

          return (
            <div 
              key={cat.type}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#8D6A28] flex items-center justify-center shadow-xs shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{cat.label}</h3>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">{cat.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-[#8D6A28] transition cursor-pointer"
                    title="تعديل"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {categories.length > 1 && (
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {cat.desc}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">العقارات المسجلة:</span>
                <span className="font-black px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono">
                  {count} عقار
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Universal Viewport-Centered Modal via AdminModal */}
      <AdminModal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'إضافة قسم عقاري جديد' : 'تعديل بيانات القسم العقاري'}
        subtitle="حدد مسمى القسم ووصفه التعريفي لتظهر في واجهة وفلاتر المنصة"
        icon={<Layers className="w-5 h-5 text-[#8D6A28]" />}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم القسم (بالعربية) *</label>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="مثال: تاون هاوس، شقق دوبلكس..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#8D6A28]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوصف التوضيحي</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="اكتب نبذة تعريفية عن نوع العقارات التي يشملها هذا القسم..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#8D6A28] resize-none h-24"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gold-gradient gold-gradient-hover text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {modalMode === 'create' ? 'إضافة القسم' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </AdminModal>

    </div>
  );
};
