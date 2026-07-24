import React, { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Hash,
  Check,
  X,
} from "lucide-react";
import { COFFEE } from "../../constants/constants";
import { getTags, createTag, updateTag, deleteTag } from "../../services/tagService";
import { successToast, errorToast } from "../../utils/toast";
import usePageTitle from "../../hooks/usePageTitle";

function Tags() {
  usePageTitle("إدارة التاجات — سكني");
  const [tags, setTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState("");
  const [editTagName, setEditTagName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredTags(
        tags.filter(tag =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredTags(tags);
    }
  }, [tags, searchQuery]);

  const loadTags = async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (error) {
      console.error("Failed to load tags", error);
      errorToast("فشل في تحميل التاجات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      errorToast("اسم التاج مطلوب");
      return;
    }

    setSubmitting(true);
    try {
      await createTag({ name: newTagName.trim() });
      setNewTagName("");
      setIsCreating(false);
      await loadTags();
      successToast("تم إنشاء التاج بنجاح");
    } catch (error) {
      console.error("Failed to create tag", error);
      errorToast("فشل في إنشاء التاج");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editTagName.trim()) {
      errorToast("اسم التاج مطلوب");
      return;
    }

    setSubmitting(true);
    try {
      await updateTag(editingTag.id, { name: editTagName.trim() });
      setEditingTag(null);
      setEditTagName("");
      await loadTags();
      successToast("تم تحديث التاج بنجاح");
    } catch (error) {
      console.error("Failed to update tag", error);
      errorToast("فشل في تحديث التاج");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    setSubmitting(true);
    try {
      await deleteTag(tagId);
      await loadTags();
      successToast("تم حذف التاج بنجاح");
    } catch (error) {
      console.error("Failed to delete tag", error);
      errorToast("فشل في حذف التاج");
    } finally {
      setSubmitting(false);
      setDeleteConfirm(null);
    }
  };

  const startEditing = (tag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditTagName("");
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTagName("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold" style={{ color: COFFEE.stone }}>جاري تحميل التاجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COFFEE.gold }}>
            <Tag className="w-5 h-5" style={{ color: COFFEE.dark }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: COFFEE.dark }}>
              إدارة التاجات
            </h1>
            <p className="text-sm" style={{ color: COFFEE.stone }}>
              إضافة وتعديل وحذف تاجات العقارات
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{ backgroundColor: COFFEE.gold, color: COFFEE.dark }}
        >
          <Plus className="w-4 h-4" />
          تاج جديد
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COFFEE.stone }} />
          <input
            type="text"
            placeholder="البحث في التاجات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 rounded-xl border text-sm outline-none focus:ring-2"
            style={{ borderColor: COFFEE.line, backgroundColor: "white" }}
          />
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="mb-6 p-4 rounded-xl border" style={{ borderColor: COFFEE.line, backgroundColor: "white" }}>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4" style={{ color: COFFEE.gold }} />
            <span className="font-bold text-sm" style={{ color: COFFEE.dark }}>إضافة تاج جديد</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="اسم التاج..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border text-sm outline-none focus:ring-2"
              style={{ borderColor: COFFEE.line }}
              onKeyPress={(e) => e.key === "Enter" && handleCreateTag()}
            />
            <button
              onClick={handleCreateTag}
              disabled={submitting || !newTagName.trim()}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: COFFEE.gold, color: COFFEE.dark }}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={cancelCreating}
              disabled={submitting}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
              style={{ backgroundColor: "#ef4444", color: "white" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tags Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTags.map((tag) => (
          <div
            key={tag.id}
            className="p-4 rounded-xl border bg-white transition-all hover:shadow-md"
            style={{ borderColor: COFFEE.line }}
          >
            {editingTag?.id === tag.id ? (
              // Edit Form
              <div>
                <input
                  type="text"
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 mb-3"
                  style={{ borderColor: COFFEE.line }}
                  onKeyPress={(e) => e.key === "Enter" && handleUpdateTag()}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUpdateTag}
                    disabled={submitting || !editTagName.trim()}
                    className="flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all hover:scale-105 disabled:opacity-50"
                    style={{ backgroundColor: COFFEE.gold, color: COFFEE.dark }}
                  >
                    حفظ
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={submitting}
                    className="flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all hover:scale-105"
                    style={{ backgroundColor: "#6b7280", color: "white" }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4" style={{ color: COFFEE.gold }} />
                  <span className="font-bold text-sm" style={{ color: COFFEE.dark }}>
                    {tag.name}
                  </span>
                </div>
                <div className="text-xs mb-3" style={{ color: COFFEE.stone }}>
                  الرمز: {tag.slug}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditing(tag)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold text-xs transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}
                  >
                    <Edit2 className="w-3 h-3" />
                    تعديل
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(tag)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold text-xs transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: COFFEE.stone }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: COFFEE.stone }}>
            {searchQuery ? "لا توجد نتائج" : "لا توجد تاجات"}
          </h3>
          <p className="text-sm" style={{ color: COFFEE.stone }}>
            {searchQuery ? "جرب البحث بكلمة أخرى" : "ابدأ بإضافة تاج جديد"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-lg" style={{ color: COFFEE.dark }}>
                تأكيد الحذف
              </h3>
            </div>
            <p className="mb-6" style={{ color: COFFEE.stone }}>
              هل أنت متأكد من حذف التاج "{deleteConfirm.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDeleteTag(deleteConfirm.id)}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-red-600 text-white transition-all hover:scale-105 disabled:opacity-50"
              >
                {submitting ? "جاري الحذف..." : "نعم، احذف"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                style={{ backgroundColor: COFFEE.cream, color: COFFEE.stone }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tags;